import { Category } from "@/hooks/useTagle";

const lightCategory: Record<Category, string> = {
  copyright:
    "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300",
  characters:
    "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300",
  artists: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300",
  general: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300",
  meta: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300",
  other: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300",
};

const darkCategory: Record<Category, string> = {
  copyright:
    "border-purple-800/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-700/80",
  characters:
    "border-green-800/60 bg-green-950/40 text-green-300 hover:bg-green-900/50 hover:border-green-700/80",
  artists:
    "border-red-800/60 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:border-red-700/80",
  general:
    "border-sky-800/60 bg-sky-950/40 text-sky-300 hover:bg-sky-900/50 hover:border-sky-700/80",
  meta: "border-yellow-800/60 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-900/50 hover:border-yellow-700/80",
  other:
    "border-zinc-700/60 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/60 hover:border-zinc-600/80",
};

const pill =
  "inline-flex items-center rounded-full border px-2 py-1 font-mono text-xs leading-none transition-colors";

interface TagProps {
  name: string;
  type: "category" | "search" | "query";
  dark?: boolean;
  category?: Category;
  tagOnClick?: (name: string, category?: Category) => void;
  index?: number;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDrop?: (index: number) => void;
}

export default function Tag({
  name,
  type,
  dark = false,
  category,
  tagOnClick,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: TagProps) {
  const dragProps = onDragStart
    ? {
        draggable: true as const,
        onDragStart: () => onDragStart(index!),
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          onDragOver?.(index!);
        },
        onDrop: () => onDrop?.(index!),
      }
    : {};

  if (type === "category") {
    const colors = dark ? darkCategory[category!] : lightCategory[category!];
    return (
      <button
        className={`${pill} ${colors} cursor-pointer ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""}`}
        onClick={() => tagOnClick!(name, category)}
        {...dragProps}
      >
        {name}
      </button>
    );
  }

  if (type === "search") {
    const colors = dark
      ? "border-zinc-600/60 bg-zinc-800/60 text-zinc-200 hover:border-red-800/60 hover:bg-red-950/40 hover:text-red-300"
      : "border-gray-300 bg-gray-100 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600";
    return (
      <button
        className={`${pill} group cursor-pointer ${colors}`}
        onClick={() => tagOnClick!(name)}
      >
        {name}
        <span className="ml-1 w-0 overflow-hidden transition-all group-hover:w-2.5">×</span>
      </button>
    );
  }

  const colors = dark
    ? "border-zinc-700/50 bg-zinc-900/50 text-zinc-400"
    : "border-gray-200 bg-gray-100 text-gray-400";
  return (
    <button
      className={`${pill} ${colors} ${onDragStart ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      {...dragProps}
    >
      {name}
    </button>
  );
}
