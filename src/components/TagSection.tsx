import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  tagOnContextMenu?: (name: string, category?: Category) => void;
  onSectionClick?: () => void;
  onReorder?: (from: number, to: number) => void;
}

export default function TagSection({
  name,
  tags,
  query,
  dark = false,
  tagOnClick,
  tagOnContextMenu,
  onSectionClick,
  onReorder,
}: TagSectionProps) {
  const [displayTags, setDisplayTags] = useState(tags);
  const [activeDrag, setActiveDrag] = useState<number | null>(null);
  const dragSrc = useRef<number | null>(null);
  const originalSrc = useRef<number | null>(null);
  const didDrop = useRef(false);

  useEffect(() => {
    if (dragSrc.current === null) setDisplayTags(tags);
  }, [tags]);

  const handleDragStart = (i: number) => {
    dragSrc.current = i;
    originalSrc.current = i;
    didDrop.current = false;
    setActiveDrag(i);
  };

  const handleDragEnter = (i: number) => {
    if (dragSrc.current === null || dragSrc.current === i) return;
    const next = [...displayTags];
    const [item] = next.splice(dragSrc.current, 1);
    next.splice(i, 0, item);
    dragSrc.current = i;
    setActiveDrag(i);
    setDisplayTags(next);
  };

  const handleDrop = () => {
    if (originalSrc.current === null || dragSrc.current === null) return;
    didDrop.current = true;
    onReorder?.(originalSrc.current, dragSrc.current);
  };

  const handleDragEnd = () => {
    if (!didDrop.current) setDisplayTags(tags);
    didDrop.current = false;
    dragSrc.current = null;
    originalSrc.current = null;
    setActiveDrag(null);
  };

  if (query) {
    const cardClass = dark
      ? "flex flex-wrap gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-800/40"
      : "flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-gray-300 hover:bg-gray-100/60";
    return (
      <div className={cardClass} onClick={onSectionClick}>
        {tags.map((tag, i) => (
          <Tag
            key={`${tag}-${i}`}
            name={tag}
            type="query"
            dark={dark}
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
        {displayTags.length > 0 ? (
          displayTags.map((tag, i) => (
            <motion.div key={tag} layout transition={{ duration: 0.15 }} style={{ display: "inline-flex" }}>
              <Tag
                name={tag}
                type="category"
                dark={dark}
                category={name!.toLowerCase() as Category}
                tagOnClick={tagOnClick}
                tagOnContextMenu={tagOnContextMenu}
                dim={activeDrag === i}
                index={i}
                onDragStart={onReorder ? handleDragStart : undefined}
                onDragEnter={onReorder ? handleDragEnter : undefined}
                onDrop={onReorder ? handleDrop : undefined}
                onDragEnd={onReorder ? handleDragEnd : undefined}
              />
            </motion.div>
          ))
        ) : (
          <span className={emptyClass}>—</span>
        )}
      </div>
    </div>
  );
}
