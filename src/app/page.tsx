"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decodeHtml } from "@/utils/decodeHtml";
import TagSection from "@/components/TagSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import PromptDialog from "@/components/PromptDialog";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import SavedQueries from "@/components/SavedQueries";
import { CATEGORIES, useTagle, type TagEntry } from "@/hooks/useTagle";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { buildBackup, downloadBackup, parseBackup } from "@/utils/backup";

const SECTIONS = [
  { key: "general", label: "General" },
  { key: "characters", label: "Characters" },
  { key: "artists", label: "Artists" },
  { key: "copyright", label: "Copyright" },
  { key: "meta", label: "Meta" },
  { key: "other", label: "Other" },
] as const;

type Pending =
  | { kind: "tag"; name: string }
  | { kind: "query"; index: number; name: string }
  | null;

export default function Home() {
  const [dark, setDark] = useLocalStorage("dark", false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const [view, setView] = useState<"tags" | "queries">("tags");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [queryHighlight, setQueryHighlight] = useState(-1);
  const [status, setStatus] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pending>(null);
  const [savePrompt, setSavePrompt] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useTagle();

  // A fresh suggestion list invalidates whatever was highlighted in the old one.
  const [seenSuggestions, setSeenSuggestions] = useState(suggestions);
  if (seenSuggestions !== suggestions) {
    setSeenSuggestions(suggestions);
    setHighlightIdx(-1);
  }

  // ── query box autocomplete, drawn from the tags already in the sections ───
  const allTags = useMemo(
    () => CATEGORIES.flatMap((category) => categoryMap[category]),
    [categoryMap]
  );

  const fragment = query.slice(query.lastIndexOf(" ") + 1);
  const bareFragment = fragment.replace(/^[-~]+/, "").toLowerCase();
  const queryMatches: TagEntry[] = useMemo(() => {
    if (!bareFragment) return [];
    return allTags
      .filter((tag) => {
        const name = decodeHtml(tag.name).toLowerCase();
        return name.includes(bareFragment) && name !== bareFragment;
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allTags, bareFragment]);

  const [seenFragment, setSeenFragment] = useState(fragment);
  if (seenFragment !== fragment) {
    setSeenFragment(fragment);
    setQueryHighlight(-1);
  }

  const applyQueryMatch = (name: string) => {
    const prefix = fragment.slice(0, fragment.length - fragment.replace(/^[-~]+/, "").length);
    setQuery(`${query.slice(0, query.lastIndexOf(" ") + 1)}${prefix}${name} `);
    setQueryHighlight(-1);
    queryRef.current?.focus();
  };

  // ── backup ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    downloadBackup(buildBackup(categoryMap, queries, dark));
    setStatus({
      ok: true,
      lines: [`Exported ${allTags.length} tags and ${queries.length} queries.`],
    });
  };

  const handleImport = async (file: File) => {
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setStatus({ ok: false, lines: ["Import failed:", ...result.errors] });
      return;
    }
    setCategoryMap(result.data.tags);
    setQueries(result.data.queries);
    setDark(result.data.dark);
    handleClear();
    const tagCount = Object.values(result.data.tags).reduce((n, tags) => n + tags.length, 0);
    setStatus({
      ok: true,
      lines: [
        `Imported ${tagCount} tags and ${result.data.queries.length} queries.`,
        ...result.notes,
      ],
    });
    refreshCounts();
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "tag") handleTagRemove(pendingDelete.name);
    else handleQueryRemove(pendingDelete.index);
    setPendingDelete(null);
  };

  // ── theme shortcuts ──────────────────────────────────────────────────────
  const d = dark;

  const rootCls = d ? "bg-zinc-950 text-zinc-200" : "bg-white text-gray-900";
  const sidebarCls = d ? "border-zinc-800/80 bg-zinc-900/30" : "border-gray-200 bg-gray-50";
  const headingCls = d ? "text-zinc-100" : "text-gray-900";
  const toggleCls = d
    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
    : "text-gray-400 hover:bg-gray-200 hover:text-gray-600";
  const inputCls = d
    ? "border-zinc-700/80 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/30"
    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400/30";
  const dropdownCls = d
    ? "border-zinc-700/80 bg-zinc-900 shadow-black/50"
    : "border-gray-200 bg-white shadow-black/10";
  const dropItemCls = d ? "hover:bg-zinc-800" : "hover:bg-gray-50";
  const dropTextCls = d ? "text-zinc-200" : "text-gray-900";
  const dropCountCls = d ? "text-zinc-400" : "text-gray-400";
  const labelCls = d ? "text-zinc-500" : "text-gray-400";
  const saveBtnCls = d
    ? "border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  const neutralBtnCls = d
    ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300"
    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-600";
  const orCls = orMode
    ? d
      ? "border-blue-900/80 bg-blue-950/50 text-blue-400 hover:bg-blue-900/50"
      : "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
    : neutralBtnCls;
  const excludeCls = exclude
    ? d
      ? "border-red-900/80 bg-red-950/50 text-red-400 hover:bg-red-900/50"
      : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
    : neutralBtnCls;
  const sortCls = sortByScore
    ? d
      ? "border-amber-900/80 bg-amber-950/50 text-amber-400 hover:bg-amber-900/50"
      : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
    : neutralBtnCls;
  const barCls = d ? "border-zinc-800/80" : "border-gray-200";
  const statusCls = status?.ok
    ? d
      ? "text-emerald-400"
      : "text-emerald-600"
    : d
      ? "text-red-400"
      : "text-red-600";
  const viewBtnCls = (active: boolean) =>
    active
      ? d
        ? "border-zinc-600 bg-zinc-800 text-zinc-100"
        : "border-gray-400 bg-gray-100 text-gray-900"
      : neutralBtnCls;

  return (
    // Both columns are pinned to the viewport and scroll independently.
    <div className={`flex h-screen overflow-hidden ${rootCls}`}>
      {/* Sidebar — shared by both views */}
      <aside className={`h-full w-80 shrink-0 overflow-y-auto border-r ${sidebarCls}`}>
        {/* Inner wrapper so the controls keep their height and the aside scrolls. */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h1 className={`font-mono text-base font-bold tracking-widest ${headingCls}`}>TAGLE</h1>
            <button
              className={`p-1.5 transition-colors ${toggleCls}`}
              onClick={() => setDark(!dark)}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? "☀︎" : "☾"}
            </button>
          </div>

          {/* Add a tag to the sections */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add tag…"
              className={`w-full border px-3 py-2 text-sm transition-colors outline-none focus:ring-1 ${inputCls}`}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                handleAutocomplete(e.target.value);
              }}
              onBlur={() =>
                setTimeout(() => {
                  clearSuggestions();
                  setHighlightIdx(-1);
                }, 150)
              }
              onKeyDown={(e) => {
                if (
                  suggestions.length > 0 &&
                  (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp")
                ) {
                  e.preventDefault();
                  const forward = e.key === "Tab" ? !e.shiftKey : e.key === "ArrowDown";
                  setHighlightIdx((i) =>
                    forward
                      ? i >= suggestions.length - 1
                        ? 0
                        : i + 1
                      : i <= 0
                        ? suggestions.length - 1
                        : i - 1
                  );
                } else if (e.key === "Enter") {
                  const picked = suggestions[highlightIdx];
                  handleSubmit(picked ? picked.value : undefined);
                  setHighlightIdx(-1);
                } else if (e.key === "Escape") {
                  clearSuggestions();
                  setHighlightIdx(-1);
                }
              }}
            />
            {suggestions.length > 0 && (
              <ul
                className={`absolute top-full z-10 mt-0.5 w-full list-none overflow-hidden border p-0 shadow-lg ${dropdownCls}`}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.value}
                    className={`flex cursor-pointer items-center justify-between px-3 py-1.5 transition-colors ${i === highlightIdx ? (d ? "bg-zinc-700" : "bg-gray-100") : dropItemCls}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      handleSubmit(s.value);
                      setHighlightIdx(-1);
                    }}
                  >
                    <span className={`font-mono text-xs ${dropTextCls}`}>
                      {decodeHtml(s.value)}
                    </span>
                    <span className={`text-xs ${dropCountCls}`}>{s.count?.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Query box — also where a saved query is edited */}
          <div className="relative">
            <div className="mb-1 flex items-baseline gap-2">
              <p className={`text-xs font-semibold tracking-widest uppercase ${labelCls}`}>Query</p>
              {editing !== null && (
                <>
                  <span className="min-w-0 truncate text-xs text-blue-500">
                    editing “{editing}”
                  </span>
                  <button
                    className={`ml-auto shrink-0 cursor-pointer text-xs ${labelCls} hover:underline`}
                    title="Stop editing — the next save creates a new query"
                    onClick={stopEditing}
                  >
                    detach
                  </button>
                </>
              )}
            </div>
            <input
              ref={queryRef}
              type="text"
              placeholder="tag_a -tag_b ( tag_c ~ tag_d )"
              className={`w-full border px-3 py-2 font-mono text-xs transition-colors outline-none focus:ring-1 ${inputCls}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (
                  queryMatches.length > 0 &&
                  (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp")
                ) {
                  e.preventDefault();
                  const forward = e.key === "Tab" ? !e.shiftKey : e.key === "ArrowDown";
                  setQueryHighlight((i) =>
                    forward
                      ? i >= queryMatches.length - 1
                        ? 0
                        : i + 1
                      : i <= 0
                        ? queryMatches.length - 1
                        : i - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const picked = queryMatches[queryHighlight];
                  if (picked) applyQueryMatch(decodeHtml(picked.name));
                  else handleSearch();
                } else if (e.key === "Escape") {
                  setQueryHighlight(-1);
                }
              }}
            />
            {queryMatches.length > 0 && (
              <ul
                className={`absolute top-full z-10 mt-0.5 w-full list-none overflow-hidden border p-0 shadow-lg ${dropdownCls}`}
              >
                {queryMatches.map((tag, i) => (
                  <li
                    key={tag.name}
                    className={`flex cursor-pointer items-center justify-between px-3 py-1.5 transition-colors ${i === queryHighlight ? (d ? "bg-zinc-700" : "bg-gray-100") : dropItemCls}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyQueryMatch(decodeHtml(tag.name))}
                  >
                    <span className={`font-mono text-xs ${dropTextCls}`}>
                      {decodeHtml(tag.name)}
                    </span>
                    <span className={`text-xs ${dropCountCls}`}>{tag.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags in the query that no section knows about */}
          {unknownTags.length > 0 && (
            <div className={`flex flex-wrap items-center gap-1.5 text-xs ${labelCls}`}>
              <span>Not saved:</span>
              {unknownTags.map((name) => (
                <button
                  key={name}
                  className={`cursor-pointer border px-1.5 py-0.5 font-mono text-[11px] transition-colors ${neutralBtnCls}`}
                  title={`Add "${name}" to its section`}
                  onClick={() => handleSubmit(name)}
                >
                  {name} +
                </button>
              ))}
            </div>
          )}

          {/* Modes */}
          <div className="grid grid-cols-3 gap-2">
            {/* The colour carries the on/off state; the labels stay put. */}
            <button
              className={`justify-center border px-3 py-1.5 text-sm transition-colors ${orCls}`}
              title="Wrap the tags you add next in an OR group"
              aria-pressed={orMode}
              onClick={handleOrMode}
            >
              Or
            </button>
            <button
              className={`justify-center border px-3 py-1.5 text-sm transition-colors ${excludeCls}`}
              title="Prefix the tags you add next with −"
              aria-pressed={exclude}
              onClick={handleExclude}
            >
              Exclude
            </button>
            <button
              className={`justify-center border px-3 py-1.5 text-sm transition-colors ${sortCls}`}
              title="Sort results by score — adds sort:score when you search"
              aria-pressed={sortByScore}
              onClick={handleSortByScore}
            >
              Score
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              className={`flex-1 justify-center border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${saveBtnCls}`}
              disabled={query.trim() === ""}
              onClick={() => setSavePrompt(true)}
            >
              Save
            </button>
            <button
              className="flex-1 justify-center bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              onClick={() => handleSearch()}
            >
              Go →
            </button>
          </div>
          <button
            className={`justify-center border px-3 py-1.5 text-sm transition-colors ${neutralBtnCls}`}
            onClick={handleClear}
          >
            Clear
          </button>

          {/* Backup */}
          <div className="flex gap-2">
            <button
              className={`flex-1 justify-center border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${neutralBtnCls}`}
              onClick={handleExport}
              disabled={!hydrated}
              title="Download tags, saved queries and theme as JSON"
            >
              Export
            </button>
            <button
              className={`flex-1 justify-center border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${neutralBtnCls}`}
              onClick={() => fileRef.current?.click()}
              disabled={!hydrated}
              title="Replace current data with a backup JSON"
            >
              Import
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImport(file);
            }}
          />
          {status && (
            <div className={`flex flex-col gap-0.5 text-xs ${statusCls}`}>
              {status.lines.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`flex items-center gap-2 border-b px-6 py-3 ${barCls}`}>
          <button
            className={`border px-3 py-1.5 text-sm transition-colors ${viewBtnCls(view === "tags")}`}
            onClick={() => setView("tags")}
          >
            Tags
          </button>
          <button
            className={`border px-3 py-1.5 text-sm transition-colors ${viewBtnCls(view === "queries")}`}
            onClick={() => setView("queries")}
          >
            Saved queries
            {hydrated && queries.length > 0 && (
              <span className={`ml-2 font-mono text-[10px] ${labelCls}`}>{queries.length}</span>
            )}
          </button>
          <div className="ml-auto">
            <NotificationsDropdown
              notifications={notifications}
              dark={dark}
              onSelect={handleNotificationClick}
              onClear={clearNotifications}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {!hydrated ? null : view === "tags" ? (
            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
              {SECTIONS.map((section) => (
                <TagSection
                  key={section.key}
                  dark={dark}
                  name={section.label}
                  tags={categoryMap[section.key]}
                  onTagClick={handleTagClick}
                  onTagDelete={(name) => setPendingDelete({ kind: "tag", name })}
                  onTagStar={handleTagStar}
                  onTagRedirect={handleTagSearch}
                />
              ))}
            </div>
          ) : (
            <SavedQueries
              queries={queries}
              dark={dark}
              editing={editing}
              onRun={handleQueryRun}
              onEdit={handleQueryEdit}
              onDelete={(index) =>
                setPendingDelete({ kind: "query", index, name: queries[index].name })
              }
              onReorder={handleQueriesReorder}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        dark={dark}
        message={pendingDelete?.kind === "query" ? "Delete this saved query?" : "Delete this tag?"}
        detail={pendingDelete?.name}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {savePrompt && (
        <PromptDialog
          dark={dark}
          title={editing === null ? "Name this query" : "Save changes as"}
          detail={query.trim()}
          placeholder="Query name"
          initialValue={editing ?? ""}
          onSubmit={(name) => {
            const result = handleSave(name);
            if (!result.ok) return result.error;
            setSavePrompt(false);
            setStatus({
              ok: true,
              lines: [
                result.updated
                  ? `Updated query "${result.name}".`
                  : `Saved query "${result.name}".`,
              ],
            });
            return null;
          }}
          onCancel={() => setSavePrompt(false)}
        />
      )}
    </div>
  );
}
