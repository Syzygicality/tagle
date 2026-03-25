"use client";

import { useState, useEffect } from "react";

import type {
  Storage,
  QuerySectionProps,
  TagProps,
  TagSectionProps
} from "../types";

const STORAGE_KEY = "tagle";

const API_URL = process.env.NEXT_PUBLIC_API_DOMAIN
const API_KEY = process.env.NEXT_PUBLIC_API_KEY
const USER_ID = process.env.NEXT_PUBLIC_USER_ID

const CATEGORIES = ["general", "artists", "placeholder", "copyright", "characters", "meta"]

function Tag({ name, disabled, onRemove, draggable, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }: TagProps) {
  return (
    <button
      className={[
        "border rounded-full px-3 py-1 text-sm select-none transition-all duration-150",
        draggable && !disabled ? "cursor-grab active:cursor-grabbing" : "",
        isDragging ? "opacity-30 scale-95" : "",
        isDragOver ? "ring-2 ring-blue-400 bg-blue-50 scale-105 border-blue-400" : "",
        !isDragging && !isDragOver && !disabled ? "hover:bg-gray-100" : "",
        disabled ? "opacity-60" : "",
      ].filter(Boolean).join(" ")}
      disabled={disabled}
      onDoubleClick={onRemove}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >{name}</button>)
}

function TagSection({ category, tags, onRemove, onReorder }: TagSectionProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDrop = (index: number) => {
    if (draggingIndex !== null && draggingIndex !== index) {
      onReorder(draggingIndex, index);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col p-2 gap-2 border rounded-2xl min-h-22">
      <p>{category}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Tag
            key={tag}
            name={tag}
            disabled={false}
            onRemove={() => onRemove(tag)}
            draggable={true}
            isDragging={draggingIndex === index}
            isDragOver={dragOverIndex === index && draggingIndex !== index}
            onDragStart={() => setDraggingIndex(index)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  )
}

function QuerySection({ searches }: QuerySectionProps ) {
  return (
    <div className="flex flex-col p-2 gap-2 border rounded-2xl">
      <p>Saved Searches</p>
      <div className="flex flex-col gap-4">
        {searches.map(search => (
          <a href={search.url}>
            <div className="flex flex-wrap gap-2">
              {search.tags.map(tag => (
                <Tag key={tag} name={tag} disabled={true} />
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [storage, setStorage] = useState<Storage>(() => {
    if (typeof window === "undefined") return {
      copyright: [],
      characters: [],
      artists: [],
      general: [],
      meta: [],
      savedSearches: [],
    };
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      copyright: [],
      characters: [],
      artists: [],
      general: [],
      meta: [],
      savedSearches: [],
    };
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }, [storage])

  const addTag = (tag: string, category: keyof Omit<Storage, "savedSearches">) => {
    if (!storage[category].includes(tag)) {
      setStorage(prev => ({
        ...prev,
        [category]: [...prev[category], tag]
      }));
    }
  }

  const removeTag = (tag: string, category: keyof Omit<Storage, "savedSearches">) => {
    setStorage(prev => ({
      ...prev,
      [category]: prev[category].filter(t => t !== tag)
    }));
  }

  const reorderTags = (category: keyof Omit<Storage, "savedSearches">, from: number, to: number) => {
    setStorage(prev => {
      const tags = [...prev[category]];
      tags.splice(to, 0, tags.splice(from, 1)[0]);
      return { ...prev, [category]: tags };
    });
  }


  const [excluding, setExcluding] = useState(false);

  useEffect(() => {
    const categories = ["copyright", "characters", "artists", "general", "meta"] as const;
    if (excluding) {
      setStorage(prev => {
        const updated = { ...prev };
        for (const category of categories) {
          updated[category] = prev[category].map(tag => `-${tag}`);
        }
        return updated;
      });
    } else {
      setStorage(prev => {
        const updated = { ...prev };
        for (const category of categories) {
          updated[category] = prev[category].map(tag => tag.startsWith("-") ? tag.slice(1) : tag);
        }
        return updated;
      });
    }
  }, [excluding]);

  const [value, setValue] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      user_id: USER_ID!,
      api_key: API_KEY!,
      name: value.trim().toLowerCase().replaceAll(" ", "_"),
      page: "dapi",
      q: "index",
      s: "tag"
    })
    setValue("")
    const response = await fetch(`https://${API_URL}/index.php?${params.toString()}`)
    const text = await response.text()
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, "application/xml")
    const tag = xml.querySelector("tag")
    const nameAttr = tag?.getAttribute("name")
    const typeAttr = tag?.getAttribute("type")
    if (!tag || typeAttr === "2" || typeAttr === null) return
    const category = CATEGORIES[parseInt(typeAttr!)] as keyof Omit<Storage, "savedSearches">
    addTag(nameAttr!, category)
  };

  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden max-w-6xl mx-auto flex flex-col gap-4">
      <div className="mt-4 mx-4 flex justify-between">
        <h1 className="font-bold text-6xl">Tagle</h1>
        <button className="bg-black text-white p-2 rounded-2xl transition-all duration-150 hover:bg-gray-800 active:scale-95">Dark Mode</button>
      </div>
      <div className="mx-4 flex flex-col p-4 gap-4 border border-black rounded-2xl">
        <form onSubmit={(e) => handleSubmit(e)}>
          <input
            className="p-2 border rounded-2xl w-full"
            type="text"
            placeholder="Add Tag"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </form>

        <div className="flex gap-2">
          <div className="grow border p-2 rounded-2xl">Build Search</div>
          <button className="bg-black text-white p-2 rounded-2xl transition-all duration-150 hover:bg-gray-800 active:scale-95">Go</button>
          <button className="bg-black text-white p-2 rounded-2xl transition-all duration-150 hover:bg-gray-800 active:scale-95">Save</button>
          <button className="bg-black text-white p-2 rounded-2xl transition-all duration-150 hover:bg-gray-800 active:scale-95">Clear</button>
        </div>
        <button
          className={`p-2 rounded-2xl ${excluding ? "bg-red-500" : "bg-red-400"} text-white transition-all duration-150 hover:brightness-110 active:scale-95`}
          onClick={() => setExcluding(prev => !prev)}
        >
          Exclude
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagSection
            category="Copyright"
            tags={storage.copyright}
            onRemove={(tag: string) => removeTag(tag, "copyright")}
            onReorder={(from, to) => reorderTags("copyright", from, to)}
          />
          <TagSection
            category="Characters"
            tags={storage.characters}
            onRemove={(tag: string) => removeTag(tag, "characters")}
            onReorder={(from, to) => reorderTags("characters", from, to)}
          />
          <TagSection
            category="Artists"
            tags={storage.artists}
            onRemove={(tag: string) => removeTag(tag, "artists")}
            onReorder={(from, to) => reorderTags("artists", from, to)}
          />
          <TagSection
            category="General"
            tags={storage.general}
            onRemove={(tag: string) => removeTag(tag, "general")}
            onReorder={(from, to) => reorderTags("general", from, to)}
          />
          <div className="md:col-span-2">
            <TagSection
              category="Meta"
              tags={storage.meta}
              onRemove={(tag: string) => removeTag(tag, "meta")}
              onReorder={(from, to) => reorderTags("meta", from, to)}
            />
          </div>
        </div>
        <QuerySection searches={storage.savedSearches} />
      </div>
    </div>
  )
}
