import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useHydrated } from "./useHydrated";

const CATEGORIES = ["general", "artists", "other", "copyright", "characters", "meta"] as const;

type Category = (typeof CATEGORIES)[number];

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

export function useTagle() {
  const [value, setValue] = useState("");
  const [categoryMap, setCategoryMap] = useLocalStorage<CategoryMap>("tags", INITIAL);
  const [queries, setQueries] = useLocalStorage<string[][]>("queries", [] as string[][]);
  const [selectedTags, setSelectedtags] = useState<string[]>([]);
  const [exclude, setExclude] = useState(false);

  const hydrated = useHydrated();

  const handleSubmit = async () => {
    if (!value) return;
    const res = await fetch(`/api/tag?name=${value}`);

    const data = (await res.json()) as TagResponse;
    const category = CATEGORIES[data.type] || "other";

    if (!categoryMap[category].includes(value)) {
      setCategoryMap({
        ...categoryMap,
        [category]: [...categoryMap[category], value],
      });
    }

    setValue("");
  };

  const handleExclude = () => {
    setExclude(!exclude);
  };

  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) return;
    const tag = exclude ? `-${tagName}` : tagName;
    setSelectedtags((prev) => [...prev, tag]);
  };

  const handleTagDblClick = (category: Category, tagName: string) => {
    setCategoryMap({
      ...categoryMap,
      [category]: categoryMap[category].filter((tag) => tag !== tagName),
    });
  };

  const handleSearchTagClick = (tagName: string) => {
    setSelectedtags((prev) => prev.filter((tag) => tag !== tagName));
  };

  const handleSave = () => {
    if (selectedTags.length === 0) return;
    setQueries([selectedTags, ...queries]);
  };

  return {
    value,
    setValue,
    categoryMap,
    setCategoryMap,
    hydrated,
    selectedTags,
    setSelectedtags,
    handleSubmit,
    handleExclude,
    handleTagClick,
    handleTagDblClick,
    handleSearchTagClick,
    handleSave,
  };
}
