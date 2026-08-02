import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  // Mirrors `value` synchronously so functional updates fired in the same tick
  // (the tag refresh loop does this) each see the previous one's result.
  const ref = useRef<T>(initial);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as T;
      ref.current = parsed;
      setValue(parsed);
    } catch {
      localStorage.removeItem(key);
    }
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(ref.current) : next;
      ref.current = resolved;
      setValue(resolved);
      localStorage.setItem(key, JSON.stringify(resolved));
    },
    [key]
  );

  return [value, set, ref] as const;
}
