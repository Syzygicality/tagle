"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/** Only same-origin paths, so `?next=` can't be used as an open redirect. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function Login() {
  const [dark] = useLocalStorage("dark", false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending || !password) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong.");
        setPassword("");
        return;
      }
      // Full navigation so middleware re-runs with the new cookie.
      window.location.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  };

  const d = dark;
  const rootCls = d ? "bg-zinc-950 text-zinc-200" : "bg-white text-gray-900";
  const cardCls = d ? "border-zinc-800/80 bg-zinc-900/30" : "border-gray-200 bg-gray-50";
  const headingCls = d ? "text-zinc-100" : "text-gray-900";
  const labelCls = d ? "text-zinc-400" : "text-gray-400";
  const inputCls = d
    ? "border-zinc-700/80 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/30"
    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400/30";
  const errorCls = d ? "text-red-400" : "text-red-600";

  return (
    <div className={`flex min-h-screen items-center justify-center p-6 ${rootCls}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex w-full max-w-xs flex-col gap-3 rounded-lg border p-5 ${cardCls}`}
      >
        <h1 className={`font-mono text-base font-bold tracking-widest ${headingCls}`}>TAGLE</h1>
        <p className={`text-xs font-semibold tracking-widest uppercase ${labelCls}`}>
          Password required
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-1 ${inputCls}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending || !password}
          className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Enter →"}
        </button>
        {error && <span className={`text-xs ${errorCls}`}>{error}</span>}
      </form>
    </div>
  );
}
