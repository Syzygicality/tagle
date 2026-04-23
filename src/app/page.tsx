"use client";

import TagSection from "@/components/TagSection";
import Tag from "@/components/Tag";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTagle } from "@/hooks/useTagle";

export default function Home() {
  const {
    value,
    setValue,
    categoryMap,
    setCategoryMap,
    hydrated,
    selectedTags,
    setSelectedtags,
    handleSubmit,
  } = useTagle();

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
          <div className="flex flex-wrap gap-2 rounded border p-2">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => <Tag key={tag} name={tag} disabled={true} />)
            ) : (
              <span className="text-gray-400">Selected tags will appear here</span>
            )}
          </div>
          <div className="flex gap-4">
            <button className="grow">Save</button>
            <button className="grow-4">Go</button>
          </div>
          <button className="">Exclude</button>
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
