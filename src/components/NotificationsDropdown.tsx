import { useEffect, useRef, useState } from "react";
import { Notification } from "@/hooks/useTagle";
import { decodeHtml } from "@/utils/decodeHtml";

interface NotificationsDropdownProps {
  notifications: Notification[];
  dark?: boolean;
  onSelect: (tag: string) => void;
  onClear: () => void;
}

/** Starred tags that gained items since their last refresh. */
export default function NotificationsDropdown({
  notifications,
  dark = false,
  onSelect,
  onClear,
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const buttonCls = dark
    ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700";
  const panelCls = dark
    ? "border-zinc-700/80 bg-zinc-900 shadow-black/50"
    : "border-gray-200 bg-white shadow-black/10";
  const itemCls = dark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-gray-50 text-gray-900";
  const metaCls = dark ? "text-zinc-500" : "text-gray-400";

  return (
    <div ref={rootRef} className="relative">
      <button
        className={`relative border px-2 py-1.5 text-sm transition-colors ${buttonCls}`}
        title="Notifications"
        onClick={() => setOpen(!open)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 justify-center bg-blue-600 px-1 text-center font-mono text-[10px] leading-4 text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 z-20 mt-1 w-72 border shadow-lg ${panelCls}`}>
          {notifications.length === 0 ? (
            <p className={`px-3 py-2 text-xs ${metaCls}`}>Nothing new.</p>
          ) : (
            <>
              <ul className="m-0 max-h-72 list-none overflow-y-auto p-0">
                {notifications.map((n) => (
                  <li key={n.tag}>
                    <button
                      className={`w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 transition-colors ${itemCls}`}
                      onClick={() => {
                        onSelect(n.tag);
                        setOpen(false);
                      }}
                    >
                      <span className="font-mono text-xs break-all">{decodeHtml(n.tag)}</span>
                      <span className={`text-[11px] ${metaCls}`}>
                        +{(n.to - n.from).toLocaleString()} new ({n.from.toLocaleString()} →{" "}
                        {n.to.toLocaleString()})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full cursor-pointer justify-center border-t px-3 py-1.5 text-xs transition-colors ${dark ? "border-zinc-800 text-zinc-500 hover:text-zinc-300" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}
                onClick={onClear}
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
