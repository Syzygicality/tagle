import {
  CATEGORIES,
  emptyMap,
  type Category,
  type CategoryMap,
  type SavedQuery,
} from "@/hooks/useTagle";
import { decodeHtml } from "./decodeHtml";

export const BACKUP_VERSION = 2;

export interface TagleBackup {
  version: number;
  exportedAt: string;
  tags: CategoryMap;
  queries: SavedQuery[];
  dark: boolean;
}

export type ImportResult =
  | { ok: true; data: TagleBackup; notes: string[] }
  | { ok: false; errors: string[] };

const KNOWN_KEYS = ["version", "exportedAt", "tags", "queries", "dark"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

export function buildBackup(tags: CategoryMap, queries: SavedQuery[], dark: boolean): TagleBackup {
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
 * its own storage: the six known categories, tag objects and saved query
 * objects. Structural problems are errors; recoverable ones (missing fields,
 * duplicates that would collide as React keys) are normalized and reported as
 * notes. Version 1 backups held bare strings and are not convertible, so they
 * are rejected outright.
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
  } else if (raw.version === 1) {
    errors.push("Version 1 backups store tags as plain strings and cannot be imported.");
  } else if (raw.version !== BACKUP_VERSION) {
    errors.push(
      `Backup version ${raw.version} is not supported (this app reads version ${BACKUP_VERSION}).`
    );
  }

  const tags = emptyMap();
  if (raw.tags === undefined) {
    errors.push('Missing "tags" field.');
  } else if (!isRecord(raw.tags)) {
    errors.push('"tags" must be an object mapping categories to arrays of tag objects.');
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
        errors.push(`"tags.${category}" must be an array of tag objects.`);
        continue;
      }

      const seen = new Set<string>();
      let duplicates = 0;
      let invalid = false;

      list.forEach((entry, i) => {
        const at = `"tags.${category}[${i}]"`;
        if (!isRecord(entry)) {
          errors.push(`${at} must be an object with name, category, count, starred and updated.`);
          invalid = true;
          return;
        }
        if (!isNonEmptyString(entry.name)) {
          errors.push(`${at}.name must be a non-empty string.`);
          invalid = true;
          return;
        }
        if (
          !isNonEmptyString(entry.category) ||
          !(CATEGORIES as readonly string[]).includes(entry.category)
        ) {
          errors.push(`${at}.category must be one of: ${CATEGORIES.join(", ")}.`);
          invalid = true;
          return;
        }
        if (entry.category !== category) {
          errors.push(`${at}.category is "${entry.category}" but it is filed under "${category}".`);
          invalid = true;
          return;
        }
        if (typeof entry.count !== "number" || !Number.isFinite(entry.count) || entry.count < 0) {
          errors.push(`${at}.count must be a non-negative number.`);
          invalid = true;
          return;
        }
        if (typeof entry.starred !== "boolean") {
          errors.push(`${at}.starred must be true or false.`);
          invalid = true;
          return;
        }
        if (
          typeof entry.updated !== "number" ||
          !Number.isFinite(entry.updated) ||
          entry.updated < 0
        ) {
          errors.push(`${at}.updated must be an epoch timestamp in milliseconds.`);
          invalid = true;
          return;
        }
        // Backups written before names were stored decoded hold the escaped
        // form ("d&#039;arce"); normalize so they match what the app stores.
        const name = decodeHtml(entry.name);
        if (seen.has(name)) {
          duplicates++;
          return;
        }
        seen.add(name);
        tags[category].push({
          name,
          category: entry.category as Category,
          count: entry.count,
          starred: entry.starred,
          updated: entry.updated,
        });
      });

      if (invalid) tags[category] = [];
      else if (duplicates > 0)
        notes.push(`Dropped ${duplicates} duplicate tag(s) from "${category}".`);
    }

    // A tag filed under two categories would render twice and refresh twice.
    const across = new Map<string, Category>();
    for (const category of CATEGORIES) {
      for (const tag of tags[category]) {
        const other = across.get(tag.name);
        if (other) errors.push(`Tag "${tag.name}" appears in both "${other}" and "${category}".`);
        else across.set(tag.name, category);
      }
    }
  }

  const queries: SavedQuery[] = [];
  if (raw.queries === undefined) {
    notes.push('Field "queries" was missing — imported empty.');
  } else if (!Array.isArray(raw.queries)) {
    errors.push('"queries" must be an array of saved query objects.');
  } else {
    const seen = new Set<string>();
    let duplicates = 0;
    raw.queries.forEach((entry, i) => {
      const at = `"queries[${i}]"`;
      if (!isRecord(entry)) {
        errors.push(`${at} must be an object with name, query and lastInteracted.`);
        return;
      }
      if (!isNonEmptyString(entry.name)) {
        errors.push(`${at}.name must be a non-empty string.`);
        return;
      }
      if (!isNonEmptyString(entry.query)) {
        errors.push(`${at}.query must be a non-empty string.`);
        return;
      }
      if (
        typeof entry.lastInteracted !== "number" ||
        !Number.isFinite(entry.lastInteracted) ||
        entry.lastInteracted < 0
      ) {
        errors.push(`${at}.lastInteracted must be an epoch timestamp in milliseconds.`);
        return;
      }
      // Written since the score toggle landed; older backups simply lack it.
      if (entry.sortByScore !== undefined && typeof entry.sortByScore !== "boolean") {
        errors.push(`${at}.sortByScore must be true or false.`);
        return;
      }
      // Saved queries are keyed by name when rendered, so two would collide.
      if (seen.has(entry.name)) {
        duplicates++;
        return;
      }
      seen.add(entry.name);
      queries.push({
        name: entry.name,
        query: decodeHtml(entry.query.trim()),
        lastInteracted: entry.lastInteracted,
        sortByScore: entry.sortByScore === true,
      });
    });
    if (duplicates > 0) notes.push(`Dropped ${duplicates} saved quer(y/ies) with a repeated name.`);
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
