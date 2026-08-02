import { useEffect, useRef, useState } from "react";

interface PromptDialogProps {
  title: string;
  detail?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  dark?: boolean;
  /** Returns a message to show in the dialog, or null once it has succeeded. */
  onSubmit: (value: string) => string | null;
  onCancel: () => void;
}

/** Single-field modal, used to name a query on save. Render it conditionally. */
export default function PromptDialog({
  title,
  detail,
  placeholder,
  initialValue = "",
  confirmLabel = "Save",
  dark = false,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const panelCls = dark
    ? "border-zinc-700/80 bg-zinc-900 text-zinc-200"
    : "border-gray-200 bg-white text-gray-900";
  const detailCls = dark ? "text-zinc-400" : "text-gray-500";
  const inputCls = dark
    ? "border-zinc-700/80 bg-zinc-950 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500"
    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400";
  const cancelCls = dark
    ? "border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

  const submit = () => {
    if (value.trim()) setError(onSubmit(value.trim()));
  };

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
        <p className="text-sm font-medium">{title}</p>
        {detail && <p className={`font-mono text-xs break-all ${detailCls}`}>{detail}</p>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          className={`w-full border px-3 py-2 text-sm outline-none ${inputCls}`}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            className={`border px-3 py-1.5 text-sm transition-colors ${cancelCls}`}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            disabled={!value.trim()}
            onClick={submit}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
