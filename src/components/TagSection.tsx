import { useRef } from "react";
import Tag from "./Tag";
import { Category } from "@/hooks/useTagle";

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

interface TagSectionProps {
  name?: string;
  tags: string[];
  query: boolean;
  dark?: boolean;
  tagOnClick?: (name: string, category?: Category) => void;
  onSectionClick?: () => void;
  onReorder?: (from: number, to: number) => void;
}

export default function TagSection({
  name,
  tags,
  query,
  dark = false,
  tagOnClick,
  onSectionClick,
  onReorder,
}: TagSectionProps) {
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = (i: number) => {
    dragIndex.current = i;
  };

  const handleDrop = (i: number) => {
    if (dragIndex.current === null || dragIndex.current === i) return;
    onReorder?.(dragIndex.current, i);
    dragIndex.current = null;
  };

  if (query) {
    const cardClass = dark
      ? "flex flex-wrap gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-800/40"
      : "flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-gray-300 hover:bg-gray-100/60";
    return (
      <div className={cardClass} onClick={onSectionClick}>
        {tags.map((tag, i) => (
          <Tag
            key={tag}
            name={tag}
            type="query"
            dark={dark}
            index={i}
            onDragStart={onReorder ? handleDragStart : undefined}
            onDrop={onReorder ? handleDrop : undefined}
          />
        ))}
      </div>
    );
  }

  const headerMap = dark ? darkHeader : lightHeader;
  const colorClass =
    headerMap[name?.toLowerCase() ?? ""] ?? (dark ? "text-zinc-400" : "text-gray-500");
  const emptyClass = dark ? "text-xs text-zinc-500" : "text-xs text-gray-300";

  return (
    <div className="flex flex-col gap-1.5">
      <p className={`text-xs font-semibold tracking-widest uppercase ${colorClass}`}>{name}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((tag, i) => (
            <Tag
              key={tag}
              name={tag}
              type="category"
              dark={dark}
              category={name!.toLowerCase() as Category}
              tagOnClick={tagOnClick}
              index={i}
              onDragStart={onReorder ? handleDragStart : undefined}
              onDrop={onReorder ? handleDrop : undefined}
            />
          ))
        ) : (
          <span className={emptyClass}>—</span>
        )}
      </div>
    </div>
  );
}
