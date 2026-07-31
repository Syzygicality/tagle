import { CATEGORIES, type CategoryMap } from "@/hooks/useTagle";

export const BACKUP_VERSION = 1;

export interface TagleBackup {
  version: number;
  exportedAt: string;
  tags: CategoryMap;
  queries: string[][];
  dark: boolean;
}

export type ImportResult =
  | { ok: true; data: TagleBackup; notes: string[] }
  | { ok: false; errors: string[] };

const KNOWN_KEYS = ["version", "exportedAt", "tags", "queries", "dark"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyMap(): CategoryMap {
  return { general: [], artists: [], other: [], copyright: [], characters: [], meta: [] };
}

export function buildBackup(tags: CategoryMap, queries: string[][], dark: boolean): TagleBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tags,
    queries,
    dark,
  };
}

export function downloadBackup(backup: TagleBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tagle-backup-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses a backup file and checks it against everything the app assumes about
 * its own storage: the six known categories, string tags, and string queries.
 * Structural problems are errors; recoverable ones (missing fields, duplicates
 * that would collide as React keys) are normalized and reported as notes.
 */
export function parseBackup(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["File is not valid JSON."] };
  }

  if (!isRecord(raw)) {
    return { ok: false, errors: ["Backup must be a JSON object."] };
  }

  const errors: string[] = [];
  const notes: string[] = [];

  if (raw.version === undefined) {
    errors.push('Missing "version" field.');
  } else if (typeof raw.version !== "number" || !Number.isInteger(raw.version)) {
    errors.push('"version" must be an integer.');
  } else if (raw.version < 1) {
    errors.push(`"version" ${raw.version} is not a valid backup version.`);
  } else if (raw.version > BACKUP_VERSION) {
    errors.push(
      `Backup version ${raw.version} is newer than this app supports (${BACKUP_VERSION}).`
    );
  }

  const tags = emptyMap();
  if (raw.tags === undefined) {
    errors.push('Missing "tags" field.');
  } else if (!isRecord(raw.tags)) {
    errors.push('"tags" must be an object mapping categories to arrays of tags.');
  } else {
    const categories = raw.tags;
    for (const key of Object.keys(categories)) {
      if (!(CATEGORIES as readonly string[]).includes(key)) {
        errors.push(`"tags.${key}" is not a known category (expected: ${CATEGORIES.join(", ")}).`);
      }
    }
    for (const category of CATEGORIES) {
      const list = categories[category];
      if (list === undefined) {
        notes.push(`Category "${category}" was missing — imported empty.`);
        continue;
      }
      if (!Array.isArray(list)) {
        errors.push(`"tags.${category}" must be an array of strings.`);
        continue;
      }
      const bad = list.findIndex((tag) => typeof tag !== "string" || tag.trim() === "");
      if (bad !== -1) {
        errors.push(`"tags.${category}[${bad}]" must be a non-empty string.`);
        continue;
      }
      const seen = new Set<string>();
      tags[category] = (list as string[]).filter((tag) => {
        if (seen.has(tag)) return false;
        seen.add(tag);
        return true;
      });
      const dropped = list.length - tags[category].length;
      if (dropped > 0) notes.push(`Dropped ${dropped} duplicate tag(s) from "${category}".`);
    }
  }

  const queries: string[][] = [];
  if (raw.queries === undefined) {
    notes.push('Field "queries" was missing — imported empty.');
  } else if (!Array.isArray(raw.queries)) {
    errors.push('"queries" must be an array of tag arrays.');
  } else {
    const seen = new Set<string>();
    let duplicates = 0;
    raw.queries.forEach((query, i) => {
      if (!Array.isArray(query)) {
        errors.push(`"queries[${i}]" must be an array of strings.`);
        return;
      }
      const bad = query.findIndex((tag) => typeof tag !== "string" || tag.trim() === "");
      if (bad !== -1) {
        errors.push(`"queries[${i}][${bad}]" must be a non-empty string.`);
        return;
      }
      if (query.length === 0) {
        notes.push(`Skipped empty query at index ${i}.`);
        return;
      }
      // Saved queries are keyed by their joined tags when rendered, so two
      // identical queries would collide.
      const key = (query as string[]).join("\0");
      if (seen.has(key)) {
        duplicates++;
        return;
      }
      seen.add(key);
      queries.push(query as string[]);
    });
    if (duplicates > 0) notes.push(`Dropped ${duplicates} duplicate saved quer(y/ies).`);
  }

  let dark = false;
  if (raw.dark === undefined) {
    notes.push('Field "dark" was missing — defaulting to light mode.');
  } else if (typeof raw.dark !== "boolean") {
    errors.push('"dark" must be true or false.');
  } else {
    dark = raw.dark;
  }

  const unknown = Object.keys(raw).filter((key) => !KNOWN_KEYS.includes(key));
  if (unknown.length > 0) notes.push(`Ignored unknown field(s): ${unknown.join(", ")}.`);

  if (errors.length > 0) return { ok: false, errors };

  const exportedAt = typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString();
  return { ok: true, data: { version: BACKUP_VERSION, exportedAt, tags, queries, dark }, notes };
}
