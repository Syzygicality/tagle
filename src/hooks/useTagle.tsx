import { useState, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useHydrated } from "./useHydrated";

const CATEGORIES = ["general", "artists", "other", "copyright", "characters", "meta"] as const;

export type Category = (typeof CATEGORIES)[number];

type CategoryMap = Record<Category, string[]>;

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
}

interface AutocompleteItem {
  count?: number;
  label: string;
  value: string;
}

export function tagleRedirect(tags: string[]) {
  const tagQuery = tags.length > 0 ? tags.map(encodeURIComponent).join("+") : "all";
  window.open(`/api/search?tags=${tagQuery}`, "_blank");
}

export function useTagle() {
  const [value, setValue] = useState("");
  const [categoryMap, setCategoryMap] = useLocalStorage<CategoryMap>("tags", INITIAL);
  const [queries, setQueries] = useLocalStorage<string[][]>("queries", [] as string[][]);
  const [selectedTags, setSelectedtags] = useState<string[]>([]);
  const [exclude, setExclude] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);

  const hydrated = useHydrated();
  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbort = useRef<AbortController | null>(null);

  const handleSubmit = async (name?: string) => {
    const tag = name ?? value;
    if (!tag) return;
    const res = await fetch(`/api/tag?name=${tag}`);

    const data = (await res.json()) as TagResponse;
    const category = CATEGORIES[data.type] || "other";

    if (!categoryMap[category].includes(tag)) {
      setCategoryMap({
        ...categoryMap,
        [category]: [...categoryMap[category], tag],
      });
    }

    setSuggestions([]);
    setValue("");
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
        const data = (await res.json()) as AutocompleteItem[];
        setSuggestions(data.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 6));
      } catch {
        // fetch was aborted
      }
    }, 100);
  };

  const handleExclude = () => {
    setExclude(!exclude);
  };

  const handleRemoveMode = () => {
    setRemoveMode(!removeMode);
  };

  const handleTagClick = (tagName: string, category?: Category) => {
    if (removeMode && category) {
      setCategoryMap({
        ...categoryMap,
        [category]: categoryMap[category].filter((t) => t !== tagName),
      });
      return;
    }
    if (selectedTags.includes(tagName)) return;
    const tag = exclude ? `-${tagName}` : tagName;
    setSelectedtags((prev) => [...prev, tag]);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const handleSearchTagClick = (tagName: string) => {
    setSelectedtags((prev) => prev.filter((tag) => tag !== tagName));
  };

  const handleSave = () => {
    if (selectedTags.length === 0) return;
    setQueries([selectedTags, ...queries]);
  };

  const handleSearch = (queryTags?: string[]) => {
    const tags = queryTags ?? selectedTags;
    tagleRedirect(tags);
  };

  const handleQueryRemove = (index: number) => {
    setQueries(queries.filter((_, i) => i !== index));
  };

  const handleQueriesReorder = (from: number, to: number) => {
    const next = [...queries];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setQueries(next);
  };

  const handleCategoryReorder = (category: Category, from: number, to: number) => {
    const tags = [...categoryMap[category]];
    const [removed] = tags.splice(from, 1);
    tags.splice(to, 0, removed);
    setCategoryMap({ ...categoryMap, [category]: tags });
  };

  return {
    value,
    setValue,
    categoryMap,
    setCategoryMap,
    hydrated,
    queries,
    selectedTags,
    setSelectedtags,
    suggestions,
    handleSubmit,
    handleAutocomplete,
    exclude,
    handleExclude,
    removeMode,
    handleRemoveMode,
    clearSuggestions,
    handleTagClick,
    handleSearchTagClick,
    handleSave,
    handleSearch,
    handleQueryRemove,
    handleQueriesReorder,
    handleCategoryReorder,
  };
}
