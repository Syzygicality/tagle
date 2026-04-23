import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

const CATEGORIES = ["general", "artists", "other", "copyright", "characters", "meta"];

type CategoryMap = Record<string, string[]>;

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
  const [categoryMap, setCategoryMap, hydrated] = useLocalStorage<CategoryMap>("tags", INITIAL);
  const [selectedTags, setSelectedtags] = useState([]);

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

  return {
    value,
    setValue,
    categoryMap,
    setCategoryMap,
    hydrated,
    selectedTags,
    setSelectedtags,
    handleSubmit,
  };
}
