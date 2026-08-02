import { useMemo, useState } from "react";
import Tag from "./Tag";
import { TagEntry } from "@/hooks/useTagle";
import { decodeHtml } from "@/utils/decodeHtml";

const lightHeader: Record<string, string> = {
  copyright: "text-purple-600",
  characters: "text-green-600",
  artists: "text-red-600",
  general: "text-sky-600",
  meta: "text-yellow-600",
  other: "text-gray-500",
};

const darkHeader: Record<string, string> = {
  copyright: "text-purple-400",
  characters: "text-green-400",
  artists: "text-red-400",
  general: "text-sky-400",
  meta: "text-yellow-400",
  other: "text-zinc-400",
};

type SortKey = "name" | "count";
type SortDir = "asc" | "desc";

interface TagSectionProps {
  name: string;
  tags: TagEntry[];
  dark?: boolean;
  onTagClick: (name: string) => void;
  onTagDelete: (name: string) => void;
  onTagStar: (name: string) => void;
  onTagRedirect: (name: string) => void;
}

export default function TagSection({
  name,
  tags,
  dark = false,
  onTagClick,
  onTagDelete,
  onTagStar,
  onTagRedirect,
}: TagSectionProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? tags.filter((tag) => decodeHtml(tag.name).toLowerCase().includes(needle))
      : tags;
    const sorted = [...filtered].sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name) : a.count - b.count
    );
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [tags, search, sortKey, sortDir]);

  const headerMap = dark ? darkHeader : lightHeader;
  const colorClass = headerMap[name.toLowerCase()] ?? (dark ? "text-zinc-400" : "text-gray-500");
  const emptyClass = dark ? "text-xs text-zinc-500" : "text-xs text-gray-300";
  const controlCls = dark
    ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300"
    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700";
  const searchCls = dark
    ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600"
    : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <p className={`text-xs font-semibold tracking-widest uppercase ${colorClass}`}>{name}</p>
        <span className={`text-xs ${dark ? "text-zinc-600" : "text-gray-300"}`}>{tags.length}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            className={`border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${controlCls}`}
            title={
              sortKey === "name"
                ? "Sorting by name — switch to item count"
                : "Sorting by item count — switch to name"
            }
            onClick={() => setSortKey(sortKey === "name" ? "count" : "name")}
          >
            {sortKey === "name" ? "az" : "#"}
          </button>
          <button
            className={`border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${controlCls}`}
            title={
              sortDir === "asc"
                ? "Ascending — switch to descending"
                : "Descending — switch to ascending"
            }
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <input
        type="text"
        value={search}
        placeholder="Filter…"
        className={`w-full border px-2 py-1 text-xs outline-none ${searchCls}`}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Capped so one crowded category cannot push the rest off the page. */}
      <div className="max-h-56 overflow-y-auto">
        {visible.length > 0 ? (
          <ul className="m-0 grid list-none grid-cols-2 gap-x-4 p-0">
            {visible.map((tag) => (
              <li key={tag.name} className="min-w-0">
                <Tag
                  tag={tag}
                  dark={dark}
                  onClick={onTagClick}
                  onDelete={onTagDelete}
                  onStar={onTagStar}
                  onRedirect={onTagRedirect}
                />
              </li>
            ))}
          </ul>
        ) : (
          <span className={emptyClass}>{tags.length > 0 ? "no matches" : "—"}</span>
        )}
      </div>
    </div>
  );
}
