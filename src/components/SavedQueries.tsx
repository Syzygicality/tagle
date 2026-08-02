import { useEffect, useState } from "react";
import { SavedQuery, SORT_SCORE } from "@/hooks/useTagle";
import { decodeHtml } from "@/utils/decodeHtml";

interface SavedQueriesProps {
  queries: SavedQuery[];
  dark?: boolean;
  /** Name of the query the sidebar builder is currently editing, if any. */
  editing?: string | null;
  onRun: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export default function SavedQueries({
  queries,
  dark = false,
  editing = null,
  onRun,
  onEdit,
  onDelete,
  onReorder,
}: SavedQueriesProps) {
  /** Index picked up by the reorder button, waiting for a destination. */
  const [moving, setMoving] = useState<number | null>(null);

  // A pending move points at an index the new list may not have.
  const [seenLength, setSeenLength] = useState(queries.length);
  if (seenLength !== queries.length) {
    setSeenLength(queries.length);
    setMoving(null);
  }

  useEffect(() => {
    if (moving === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoving(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moving]);

  const rowCls = dark
    ? "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-800/40"
    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/60";
  const targetCls = dark ? "border-blue-700/80 bg-blue-950/30" : "border-blue-300 bg-blue-50/60";
  const editingCls = dark ? "border-blue-800/80 bg-blue-950/20" : "border-blue-200 bg-blue-50/40";
  const nameCls = dark ? "text-zinc-200" : "text-gray-900";
  const queryCls = dark ? "text-zinc-500" : "text-gray-400";
  const sortCls = dark ? "text-amber-500/80" : "text-amber-600/80";
  const actionCls = dark
    ? "text-zinc-400 hover:text-zinc-100"
    : "text-gray-400 hover:text-gray-900";
  const emptyCls = dark ? "text-zinc-500" : "text-gray-400";

  if (queries.length === 0) {
    return <p className={`text-sm ${emptyCls}`}>No saved queries yet.</p>;
  }

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="flex flex-col gap-2">
      {moving !== null && (
        <p className={`text-xs ${queryCls}`}>
          Moving “{queries[moving].name}” — click a query to drop it there, or press Escape.
        </p>
      )}

      {queries.map((saved, i) => {
        const isTarget = moving !== null && moving !== i;
        const isEditing = editing !== null && saved.name === editing;
        return (
          <div
            key={saved.name}
            className={`group flex cursor-pointer items-center gap-3 border p-2 transition-colors ${isTarget ? targetCls : isEditing ? editingCls : rowCls} ${moving === i ? "opacity-50" : ""}`}
            onClick={() => {
              if (moving === null) onRun(i);
              else if (moving !== i) {
                onReorder(moving, i);
                setMoving(null);
              }
            }}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={`truncate text-sm ${nameCls}`}>
                {saved.name}
                {isEditing && <span className="ml-2 text-xs text-blue-500">editing</span>}
              </span>
              {/* The sort flag lives beside the query, so name it here to be seen. */}
              <span className={`truncate font-mono text-xs ${queryCls}`}>
                {decodeHtml(saved.query)}
                {saved.sortByScore && <span className={sortCls}> {SORT_SCORE}</span>}
              </span>
            </div>

            <span className="ml-auto hidden shrink-0 items-center gap-2 group-hover:inline-flex">
              <button
                className={`cursor-pointer ${moving === i ? "text-blue-500" : actionCls}`}
                title={moving === i ? "Cancel move" : "Move to another position"}
                onClick={stop(() => setMoving(moving === i ? null : i))}
              >
                ⇅
              </button>
              <button
                className={`cursor-pointer ${actionCls}`}
                title="Edit in the query builder"
                onClick={stop(() => onEdit(i))}
              >
                ✎
              </button>
              <button
                className={`cursor-pointer ${actionCls} hover:text-red-500`}
                title="Delete"
                onClick={stop(() => onDelete(i))}
              >
                ✕
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
