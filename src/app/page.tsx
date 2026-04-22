"use client";

import TagSection from "@/components/TagSection";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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

export default function Home() {
  const [value, setValue] = useState("");
  const [categoryMap, setCategoryMap, hydrated] = useLocalStorage<CategoryMap>("tags", INITIAL);

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

  return (
    <div className="flex min-h-screen min-w-full flex-col items-center gap-4 bg-white p-4">
      <h1>Tagle</h1>
      <div className="flex w-full gap-4">
        <div className="flex grow flex-col gap-4">
          <input
            type="text"
            placeholder="Register tags here"
            className=""
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <input type="text" placeholder="Selected tags will appear here" className="" disabled />
          <div className="flex gap-4">
            <button className="grow">Save</button>
            <button className="grow-4">Go</button>
          </div>
        </div>
        <div className="grid grow-4 grid-cols-3 gap-4">
          {hydrated && (
            <>
              <TagSection name="Copyright" tags={categoryMap.copyright} query={false} />
              <TagSection name="Characters" tags={categoryMap.characters} query={false} />
              <TagSection name="Artists" tags={categoryMap.artists} query={false} />
              <TagSection name="General" tags={categoryMap.general} query={false} />
              <TagSection name="Meta" tags={categoryMap.meta} query={false} />
              <TagSection name="Other" tags={categoryMap.other} query={false} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
