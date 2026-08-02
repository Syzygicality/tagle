import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  detail?: string;
  confirmLabel?: string;
  dark?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation for anything destructive. The accept button takes focus
 * as soon as it opens, so confirming is Enter and dismissing is Escape.
 */
export default function ConfirmDialog({
  open,
  message,
  detail,
  confirmLabel = "Delete",
  dark = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) acceptRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const panelCls = dark
    ? "border-zinc-700/80 bg-zinc-900 text-zinc-200"
    : "border-gray-200 bg-white text-gray-900";
  const detailCls = dark ? "text-zinc-400" : "text-gray-500";
  const cancelCls = dark
    ? "border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex w-full max-w-sm flex-col gap-3 border p-4 shadow-lg ${panelCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium">{message}</p>
        {detail && <p className={`font-mono text-xs break-all ${detailCls}`}>{detail}</p>}
        <div className="flex justify-end gap-2">
          <button
            className={`border px-3 py-1.5 text-sm transition-colors ${cancelCls}`}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            ref={acceptRef}
            className="bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:ring-2 focus:ring-red-400 focus:outline-none"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
