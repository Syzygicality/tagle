import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useHydrated } from "./useHydrated";

export const CATEGORIES = [
  "general",
  "artists",
  "other",
  "copyright",
  "characters",
  "meta",
] as const;

/** Query syntax that is never a real tag, so never worth storing or refreshing. */
const OPERATOR_TOKENS = new Set(["(", ")", "~"]);

/** Appended at search time by the score toggle; never part of the query box. */
export const SORT_SCORE = "sort:score";

/** How long a tag's item count is trusted before it is worth re-fetching. */
export const STALE_MS = 30 * 60 * 1000;

/** How often the background refresh sweeps for stale tags. */
const SWEEP_MS = 60 * 1000;

/** Spacing between count fetches within a sweep, to stay under the upstream rate limit. */
const THROTTLE_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type Category = (typeof CATEGORIES)[number];

export interface TagEntry {
  name: string;
  category: Category;
  count: number;
  starred: boolean;
  /** Epoch ms of the last count refresh by Tagle; 0 means never. */
  updated: number;
}

export type CategoryMap = Record<Category, TagEntry[]>;

export interface SavedQuery {
  name: string;
  query: string;
  /** Epoch ms of the last click or creation — not touched by string edits. */
  lastInteracted: number;
  /**
   * Whether running this query sorts by score. Kept beside the query rather
   * than inside it, so the box only ever holds tags. Absent on queries saved
   * before the toggle existed, which read as off.
   */
  sortByScore?: boolean;
}

export type SaveResult =
  | { ok: true; updated: boolean; name: string }
  | { ok: false; error: string };

export interface Notification {
  /** The starred tag whose count grew; also the dedupe key. */
  tag: string;
  from: number;
  to: number;
  at: number;
}

const INITIAL: CategoryMap = {
  general: [],
  artists: [],
  other: [],
  copyright: [],
  characters: [],
  meta: [],
};

interface TagResponse {
  type: number;
  name: string;
  count: number;
}

interface AutocompleteItem {
  count?: number;
  label: string;
  value: string;
}

function decodeHtml(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

/** The session expired mid-use; the proxy will hand back a login page. */
function toLogin() {
  window.location.href = "/login";
}

export function emptyMap(): CategoryMap {
  return { general: [], artists: [], other: [], copyright: [], characters: [], meta: [] };
}

/** Splits a raw query string into tokens, dropping the empty strings. */
export function parseQuery(query: string): string[] {
  return query.split(" ").filter((token) => token.length > 0);
}

/**
 * The tag a token refers to, or null when the token is pure query syntax.
 * Only leading modifiers are stripped — plenty of real tags end in ")".
 */
export function tokenToTagName(token: string): string | null {
  if (OPERATOR_TOKENS.has(token)) return null;
  const name = token.replace(/^[-~]+/, "");
  // A hand-typed sort: metatag is search syntax too, not a tag to track.
  if (name.startsWith("sort:")) return null;
  return name.length > 0 ? name : null;
}

/**
 * Index of the "(" that opens the group still being built, or -1 when every
 * group in the query is already closed.
 */
function openGroupIndex(tokens: string[]): number {
  const open: number[] = [];
  tokens.forEach((token, i) => {
    if (token === "(") open.push(i);
    else if (token === ")") open.pop();
  });
  return open.length > 0 ? open[open.length - 1] : -1;
}

/**
 * True while the OR group being built holds no tag yet — the first tag of a
 * group has nothing to be an alternative to, so it takes no tilde.
 */
function orGroupIsEmpty(query: string): boolean {
  const tokens = parseQuery(query);
  const open = openGroupIndex(tokens);
  return !tokens.slice(open + 1).some((token) => tokenToTagName(token) !== null);
}

/** Keeps appended tokens from fusing with whatever the box already holds. */
function withTrailingSpace(query: string) {
  return query.length === 0 || query.endsWith(" ") ? query : `${query} `;
}

export function tagleRedirect(tags: string[]) {
  const tagQuery =
    tags.length > 0 ? tags.map((t) => encodeURIComponent(decodeHtml(t))).join("+") : "all";
  window.open(`/api/search?tags=${tagQuery}`, "_blank");
}

export function useTagle() {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [categoryMap, setCategoryMap, categoryMapRef] = useLocalStorage<CategoryMap>(
    "tagle.tags.v2",
    INITIAL
  );
  const [queries, setQueries, queriesRef] = useLocalStorage<SavedQuery[]>("tagle.queries.v2", []);
  const [exclude, setExclude] = useState(false);
  const [orMode, setOrMode] = useState(false);
  const [sortByScore, setSortByScore] = useState(false);
  /** Name of the saved query the builder is currently writing back to. */
  const [editing, setEditing] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hydrated = useHydrated();
  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbort = useRef<AbortController | null>(null);
  const refreshing = useRef(false);
  const pendingForce = useRef<string[]>([]);

  const findTag = useCallback(
    (name: string) => {
      for (const category of CATEGORIES) {
        const found = categoryMapRef.current[category].find((t) => t.name === name);
        if (found) return found;
      }
      return null;
    },
    [categoryMapRef]
  );

  // ── item counts ──────────────────────────────────────────────────────────
  /**
   * Refreshes item counts, skipping anything refreshed within STALE_MS unless
   * it is explicitly forced (a tag that was just searched). Starred tags go
   * first so the notifications they can raise land as early as possible.
   */
  const refreshCounts = useCallback(
    async (force: string[] = []) => {
      // One sweep at a time; anything forced meanwhile is picked up before it ends.
      if (refreshing.current) {
        pendingForce.current.push(...force);
        return;
      }
      refreshing.current = true;
      try {
        let forced = new Set(force);
        let firstFetch = true;
        for (;;) {
          const now = Date.now();
          const due = CATEGORIES.flatMap((c) => categoryMapRef.current[c])
            // "other" holds metatags and the like, whose counts are meaningless
            // and never shown, so they are worth no upstream calls.
            .filter((tag) => tag.category !== "other")
            .filter((tag) => forced.has(tag.name) || now - tag.updated >= STALE_MS)
            .sort((a, b) => Number(b.starred) - Number(a.starred));

          for (const tag of due) {
            // Space the calls out; the first one goes straight through so a
            // freshly searched tag still updates immediately.
            if (firstFetch) firstFetch = false;
            else await sleep(THROTTLE_MS);

            let data: TagResponse;
            try {
              const res = await fetch(`/api/tag?name=${encodeURIComponent(tag.name)}`);
              if (res.status === 401) return toLogin();
              if (!res.ok) continue;
              data = (await res.json()) as TagResponse;
            } catch {
              continue;
            }

            const count = Number(data.count) || 0;
            const previous = findTag(tag.name);
            if (!previous) continue; // deleted while the sweep was running

            if (previous.starred && count > previous.count) {
              const from = previous.count;
              setNotifications((prev) => [
                { tag: tag.name, from, to: count, at: Date.now() },
                ...prev.filter((n) => n.tag !== tag.name),
              ]);
            }

            setCategoryMap((prev) => ({
              ...prev,
              [previous.category]: prev[previous.category].map((t) =>
                t.name === tag.name ? { ...t, count, updated: Date.now() } : t
              ),
            }));
          }

          if (pendingForce.current.length === 0) break;
          forced = new Set(pendingForce.current);
          pendingForce.current = [];
        }
      } finally {
        refreshing.current = false;
        pendingForce.current = [];
      }
    },
    [categoryMapRef, findTag, setCategoryMap]
  );

  // ── stored name normalization ────────────────────────────────────────────
  /**
   * Upstream autocomplete hands back HTML-escaped names ("d&#039;arce"), which
   * earlier versions stored verbatim — so the escaped form leaked into the
   * query box and never matched a real tag. Names are decoded on the way in
   * now; this converts whatever was saved before that. Runs before the first
   * sweep, so refreshes go out under the decoded names.
   */
  useEffect(() => {
    if (!hydrated) return;

    const stored = categoryMapRef.current;
    const decoded = emptyMap();
    const seen = new Map<string, TagEntry>();
    let tagsChanged = false;

    for (const category of CATEGORIES) {
      for (const tag of stored[category]) {
        const name = decodeHtml(tag.name);
        if (name !== tag.name) tagsChanged = true;
        // Decoding can collapse two saved entries onto one name; keep the
        // first and carry over the star, since that is the part worth saving.
        const kept = seen.get(name);
        if (kept) {
          if (tag.starred) kept.starred = true;
          tagsChanged = true;
          continue;
        }
        const entry = { ...tag, name };
        seen.set(name, entry);
        decoded[category].push(entry);
      }
    }
    if (tagsChanged) setCategoryMap(decoded);

    const queries = queriesRef.current;
    if (queries.some((q) => decodeHtml(q.query) !== q.query)) {
      setQueries(queries.map((q) => ({ ...q, query: decodeHtml(q.query) })));
    }
  }, [hydrated, categoryMapRef, queriesRef, setCategoryMap, setQueries]);

  useEffect(() => {
    if (!hydrated) return;
    refreshCounts();
    const id = setInterval(() => refreshCounts(), SWEEP_MS);
    return () => clearInterval(id);
  }, [hydrated, refreshCounts]);

  // ── tag management ───────────────────────────────────────────────────────
  const handleSubmit = async (name?: string) => {
    // Autocomplete values arrive HTML-escaped; storage keeps the plain name.
    const tag = decodeHtml((name ?? value).trim());
    if (!tag) return;

    const res = await fetch(`/api/tag?name=${encodeURIComponent(tag)}`);
    if (res.status === 401) return toLogin();
    if (!res.ok) return;

    const data = (await res.json()) as TagResponse;
    const category = CATEGORIES[data.type] || "other";
    const entry: TagEntry = {
      name: tag,
      category,
      count: Number(data.count) || 0,
      starred: findTag(tag)?.starred ?? false,
      updated: Date.now(),
    };

    setCategoryMap((prev) => {
      const next = { ...prev };
      // A tag can change category upstream, so clear it out everywhere first.
      for (const c of CATEGORIES) next[c] = next[c].filter((t) => t.name !== tag);
      next[category] = [...next[category], entry];
      return next;
    });

    setSuggestions([]);
    setValue("");
  };

  const handleTagRemove = (name: string) => {
    setCategoryMap((prev) => {
      const next = { ...prev };
      for (const c of CATEGORIES) next[c] = next[c].filter((t) => t.name !== name);
      return next;
    });
  };

  const handleTagStar = (name: string) => {
    setCategoryMap((prev) => {
      const next = { ...prev };
      for (const c of CATEGORIES) {
        next[c] = next[c].map((t) => (t.name === name ? { ...t, starred: !t.starred } : t));
      }
      return next;
    });
  };

  const handleAutocomplete = (search: string) => {
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    autocompleteAbort.current?.abort();
    if (!search) {
      setSuggestions([]);
      return;
    }
    autocompleteTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      autocompleteAbort.current = controller;
      try {
        const res = await fetch(`/api/autocomplete?search=${encodeURIComponent(search)}`, {
          signal: controller.signal,
        });
        if (res.status === 401) return toLogin();
        const data = (await res.json()) as AutocompleteItem[];
        setSuggestions(data.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 6));
      } catch {
        // fetch was aborted
      }
    }, 100);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  // ── query building ───────────────────────────────────────────────────────
  /** Clicking a tag appends it to the query box, honouring the active modes. */
  const handleTagClick = (tagName: string) => {
    const prefix = exclude ? "-" : "";
    setQuery((prev) => {
      const or = orMode && !orGroupIsEmpty(prev) ? "~ " : "";
      return `${withTrailingSpace(prev)}${or}${prefix}${tagName} `;
    });
  };

  /** Prefixes the tags added while the toggle is on with a minus. */
  const handleExclude = () => setExclude((prev) => !prev);

  /**
   * Wraps the tags added while the toggle is on in an OR group, reusing a
   * group the query already has open rather than nesting a second one.
   */
  const handleOrMode = () => {
    setQuery((prev) => {
      const isOpen = openGroupIndex(parseQuery(prev)) !== -1;
      if (orMode ? !isOpen : isOpen) return prev;
      return `${withTrailingSpace(prev)}${orMode ? ")" : "("} `;
    });
    setOrMode(!orMode);
  };

  /** Adds sort:score to what gets searched, without touching the query box. */
  const handleSortByScore = () => setSortByScore((prev) => !prev);

  const handleClear = () => {
    setQuery("");
    setOrMode(false);
    setExclude(false);
    setSortByScore(false);
    setEditing(null);
  };

  /** Runs a query — the box by default, or a saved one with its own sorting. */
  const handleSearch = (raw?: string, sort: boolean = sortByScore) => {
    const tags = parseQuery(raw ?? query);
    const names = tags.map(tokenToTagName).filter((n): n is string => n !== null);
    tagleRedirect(sort ? [...tags, SORT_SCORE] : tags);
    // The counts of what you just looked at are the ones worth being current.
    if (names.length > 0) refreshCounts(names);
  };

  /** The ↗ shortcut on a tag: straight to that one tag, sorting included. */
  const handleTagSearch = (name: string) => {
    tagleRedirect(sortByScore ? [name, SORT_SCORE] : [name]);
    refreshCounts([name]);
  };

  /** Names in the query that no section knows about, in first-seen order. */
  const unknownTags = parseQuery(query)
    .map(tokenToTagName)
    .filter((n): n is string => n !== null)
    .filter((name, i, all) => all.indexOf(name) === i && !findTag(name));

  // ── saved queries ────────────────────────────────────────────────────────
  /**
   * Saves the query box. While a saved query is being edited the box writes
   * back to it — renaming it if the given name is different — otherwise a
   * matching name updates that query and anything else creates a new one.
   */
  const handleSave = (name: string): SaveResult => {
    const trimmedName = name.trim();
    const trimmedQuery = query.trim();
    if (!trimmedName || !trimmedQuery) return { ok: false, error: "Nothing to save." };

    const edited = editing === null ? -1 : queriesRef.current.findIndex((q) => q.name === editing);
    const clash = queriesRef.current.some((q, i) => i !== edited && q.name === trimmedName);

    if (edited !== -1) {
      if (clash) {
        return { ok: false, error: `Another saved query is already called "${trimmedName}".` };
      }
      // An edit to the string is not an interaction.
      setQueries((prev) =>
        prev.map((q, i) =>
          i === edited ? { ...q, name: trimmedName, query: trimmedQuery, sortByScore } : q
        )
      );
      setEditing(null);
      return { ok: true, updated: true, name: trimmedName };
    }

    const existing = queriesRef.current.findIndex((q) => q.name === trimmedName);
    if (existing === -1) {
      setQueries((prev) => [
        ...prev,
        { name: trimmedName, query: trimmedQuery, lastInteracted: Date.now(), sortByScore },
      ]);
      return { ok: true, updated: false, name: trimmedName };
    }
    setQueries((prev) =>
      prev.map((q, i) => (i === existing ? { ...q, query: trimmedQuery, sortByScore } : q))
    );
    return { ok: true, updated: true, name: trimmedName };
  };

  const handleQueryRun = (index: number) => {
    const saved = queriesRef.current[index];
    if (!saved) return;
    setQueries((prev) =>
      prev.map((q, i) => (i === index ? { ...q, lastInteracted: Date.now() } : q))
    );
    handleSearch(saved.query, saved.sortByScore ?? false);
  };

  /** Loads a saved query into the query builder; saving writes back to it. */
  const handleQueryEdit = (index: number) => {
    const saved = queriesRef.current[index];
    if (!saved) return;
    setQuery(withTrailingSpace(saved.query));
    setOrMode(false);
    setSortByScore(saved.sortByScore ?? false);
    setEditing(saved.name);
  };

  const handleQueryRemove = (index: number) => {
    const saved = queriesRef.current[index];
    if (saved && saved.name === editing) setEditing(null);
    setQueries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQueriesReorder = (from: number, to: number) => {
    setQueries((prev) => {
      if (from === to || from < 0 || from >= prev.length || to < 0 || to >= prev.length)
        return prev;
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  };

  /** Detaches the builder from the query it was editing, keeping the text. */
  const stopEditing = () => setEditing(null);

  // ── notifications ────────────────────────────────────────────────────────
  const handleNotificationClick = (tag: string) => {
    setNotifications((prev) => prev.filter((n) => n.tag !== tag));
    tagleRedirect(sortByScore ? [tag, SORT_SCORE] : [tag]);
  };

  const clearNotifications = () => setNotifications([]);

  return {
    value,
    setValue,
    query,
    setQuery,
    categoryMap,
    setCategoryMap,
    queries,
    setQueries,
    hydrated,
    exclude,
    orMode,
    sortByScore,
    editing,
    stopEditing,
    suggestions,
    notifications,
    unknownTags,
    findTag,
    handleSubmit,
    handleTagRemove,
    handleTagStar,
    handleAutocomplete,
    clearSuggestions,
    handleTagClick,
    handleExclude,
    handleOrMode,
    handleSortByScore,
    handleClear,
    handleSearch,
    handleTagSearch,
    handleSave,
    handleQueryRun,
    handleQueryEdit,
    handleQueryRemove,
    handleQueriesReorder,
    handleNotificationClick,
    clearNotifications,
    refreshCounts,
  };
}
