import { Category, TagEntry } from "@/hooks/useTagle";
import { decodeHtml } from "@/utils/decodeHtml";

const lightCategory: Record<Category, string> = {
  copyright: "text-purple-700 hover:text-purple-900",
  characters: "text-green-700 hover:text-green-900",
  artists: "text-red-700 hover:text-red-900",
  general: "text-sky-700 hover:text-sky-900",
  meta: "text-yellow-700 hover:text-yellow-900",
  other: "text-gray-600 hover:text-gray-900",
};

const darkCategory: Record<Category, string> = {
  copyright: "text-purple-300 hover:text-purple-200",
  characters: "text-green-300 hover:text-green-200",
  artists: "text-red-300 hover:text-red-200",
  general: "text-sky-300 hover:text-sky-200",
  meta: "text-yellow-300 hover:text-yellow-200",
  other: "text-zinc-400 hover:text-zinc-200",
};

function compactCount(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${count}`;
}

interface TagProps {
  tag: TagEntry;
  dark?: boolean;
  onClick: (name: string) => void;
  onDelete: (name: string) => void;
  onStar: (name: string) => void;
  onRedirect: (name: string) => void;
}

/**
 * One row of a tag list. The name reads as a link and adds the tag to the
 * query; the star, redirect and delete controls stay hidden until hover.
 * Long names are clipped rather than wrapped so the rows stay aligned.
 */
export default function Tag({
  tag,
  dark = false,
  onClick,
  onDelete,
  onStar,
  onRedirect,
}: TagProps) {
  const colors = dark ? darkCategory[tag.category] : lightCategory[tag.category];
  const actionCls = dark
    ? "text-zinc-500 hover:text-zinc-100"
    : "text-gray-400 hover:text-gray-900";
  const countCls = dark ? "text-zinc-600" : "text-gray-400";
  const name = decodeHtml(tag.name);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <span className="group flex min-w-0 items-center gap-1.5 font-mono text-xs leading-6">
      <button
        className={`block min-w-0 flex-1 truncate text-left underline-offset-2 transition-colors hover:underline ${colors}`}
        title={name}
        onClick={() => onClick(tag.name)}
      >
        {name}
      </button>

      {tag.starred && <span className="shrink-0 text-amber-400 group-hover:hidden">★</span>}

      <span className="hidden shrink-0 items-center gap-1 group-hover:inline-flex">
        <button
          className={`cursor-pointer ${tag.starred ? "text-amber-400" : actionCls}`}
          title={tag.starred ? "Unstar" : "Star"}
          onClick={stop(() => onStar(tag.name))}
        >
          {tag.starred ? "★" : "☆"}
        </button>
        <button
          className={`cursor-pointer ${actionCls}`}
          title="Search this tag"
          onClick={stop(() => onRedirect(tag.name))}
        >
          ↗
        </button>
        <button
          className={`cursor-pointer ${actionCls} hover:text-red-500`}
          title="Delete tag"
          onClick={stop(() => onDelete(tag.name))}
        >
          ✕
        </button>
      </span>

      <span className={`shrink-0 tabular-nums ${countCls}`}>{compactCount(tag.count)}</span>
    </span>
  );
}
