#!/usr/bin/env node
/**
 * Converts a Tagle v1 backup (the old design, b8025a7) into the v2 format the
 * current app imports.
 *
 *   node migrate-backup.mjs <input.json> [-o output.json]
 *
 * Accepts either a backup file produced by the old Export button, or a raw
 * localStorage dump keyed by "tags" / "queries" / "dark" (values may be JSON
 * strings, as most localStorage exporters write them).
 *
 * v1 -> v2, per src/utils/backup.ts:
 *   tags:    { [category]: string[] }  ->  { [category]: TagEntry[] }
 *   queries: string[][]                ->  SavedQuery[] (named, query string)
 *
 * Counts start at 0 with updated: 0, so the app's background sweep treats
 * every tag as stale and refetches real counts on first load.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const CATEGORIES = ["general", "artists", "other", "copyright", "characters", "meta"];
/** Query syntax the new design keeps out of storage entirely. */
const OPERATOR_TOKENS = new Set(["(", ")", "~"]);
const NAME_MAX = 48;

const notes = [];

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

/** localStorage dumps nest JSON inside strings; backup files do not. */
function unwrap(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function readInput(path) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    die(`could not read ${path} as JSON: ${err.message}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    die("expected a JSON object at the top level");
  }
  return raw;
}

function convertTags(rawTags) {
  const tags = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
  if (rawTags === undefined) {
    notes.push('No "tags" field found — output has no tags.');
    return tags;
  }
  if (typeof rawTags !== "object" || rawTags === null || Array.isArray(rawTags)) {
    die('"tags" must be an object mapping categories to arrays');
  }

  for (const key of Object.keys(rawTags)) {
    if (!CATEGORIES.includes(key)) {
      notes.push(`Dropped unknown category "${key}".`);
    }
  }

  // A tag filed under two categories is a hard error on import, so the first
  // category (in CATEGORIES order) wins and the rest are dropped.
  const claimed = new Map();

  for (const category of CATEGORIES) {
    const list = unwrap(rawTags[category]);
    if (list === undefined || list === null) continue;
    if (!Array.isArray(list)) die(`"tags.${category}" must be an array`);

    for (const entry of list) {
      // Tolerate a partly-migrated file: objects pass through by name.
      const name =
        typeof entry === "string"
          ? entry.trim()
          : typeof entry?.name === "string"
            ? entry.name.trim()
            : null;

      if (!name) {
        notes.push(`Dropped a non-string tag in "${category}".`);
        continue;
      }
      if (OPERATOR_TOKENS.has(name)) {
        notes.push(`Dropped operator "${name}" from "${category}" — it is query syntax now.`);
        continue;
      }
      const owner = claimed.get(name);
      if (owner === category) {
        notes.push(`Dropped duplicate "${name}" in "${category}".`);
        continue;
      }
      if (owner) {
        notes.push(`Dropped "${name}" from "${category}" — already filed under "${owner}".`);
        continue;
      }
      claimed.set(name, category);
      tags[category].push({
        name,
        category,
        count: typeof entry?.count === "number" && entry.count >= 0 ? entry.count : 0,
        starred: entry?.starred === true,
        updated: typeof entry?.updated === "number" && entry.updated >= 0 ? entry.updated : 0,
      });
    }
  }
  return tags;
}

function queryName(tokens, taken) {
  const meaningful = tokens.filter((t) => !OPERATOR_TOKENS.has(t));
  let base = (meaningful.length > 0 ? meaningful : tokens).slice(0, 3).join(" + ");
  if (base.length > NAME_MAX) base = `${base.slice(0, NAME_MAX - 1).trimEnd()}…`;
  if (!base) base = "Untitled query";

  let name = base;
  for (let n = 2; taken.has(name); n++) name = `${base} (${n})`;
  taken.add(name);
  return name;
}

function convertQueries(rawQueries, stamp) {
  const queries = [];
  if (rawQueries === undefined) {
    notes.push('No "queries" field found — output has no saved queries.');
    return queries;
  }
  if (!Array.isArray(rawQueries)) die('"queries" must be an array');

  const taken = new Set();
  const seen = new Set();

  rawQueries.forEach((entry, i) => {
    // v1 stored a bare tag array; a partly-migrated file may already be an object.
    const tokens = Array.isArray(entry)
      ? entry
      : typeof entry?.query === "string"
        ? entry.query.split(" ")
        : null;

    if (!tokens) {
      notes.push(`Skipped queries[${i}] — not an array of tags.`);
      return;
    }
    const clean = tokens
      .filter((t) => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (clean.length === 0) {
      notes.push(`Skipped empty query at index ${i}.`);
      return;
    }
    const key = clean.join("\0");
    if (seen.has(key)) {
      notes.push(`Dropped duplicate query "${clean.join(" ")}".`);
      return;
    }
    seen.add(key);

    const existing = typeof entry?.name === "string" ? entry.name.trim() : "";
    let name = existing;
    if (!name || taken.has(name)) name = queryName(clean, taken);
    else taken.add(name);

    queries.push({
      name,
      query: clean.join(" "),
      lastInteracted:
        typeof entry?.lastInteracted === "number" && entry.lastInteracted >= 0
          ? entry.lastInteracted
          : stamp,
      sortByScore: entry?.sortByScore === true,
    });
  });
  return queries;
}

const args = process.argv.slice(2);
const outFlag = args.findIndex((a) => a === "-o" || a === "--out");
const outPath = outFlag !== -1 ? args[outFlag + 1] : null;
const inPath = args.find((a, i) => !a.startsWith("-") && !(outFlag !== -1 && i === outFlag + 1));

if (!inPath) {
  console.error("usage: node migrate-backup.mjs <input.json> [-o output.json]");
  process.exit(1);
}
if (outFlag !== -1 && !outPath) die("-o needs a file path");

const raw = readInput(inPath);

if (raw.version !== undefined && raw.version !== 1) {
  if (raw.version === 2) die("this file is already version 2 — import it as is");
  die(`unexpected backup version ${raw.version}; this script only reads version 1`);
}

const exportedAt = typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString();
const stamp = Number.isFinite(Date.parse(exportedAt)) ? Date.parse(exportedAt) : Date.now();

const dark = unwrap(raw.dark);
if (dark !== undefined && typeof dark !== "boolean") {
  notes.push('Field "dark" was not a boolean — defaulting to light mode.');
}

const backup = {
  version: 2,
  exportedAt,
  tags: convertTags(unwrap(raw.tags)),
  queries: convertQueries(unwrap(raw.queries), stamp),
  dark: dark === true,
};

const target = outPath ?? inPath.replace(/(\.json)?$/i, ".v2.json");
writeFileSync(target, `${JSON.stringify(backup, null, 2)}\n`);

const tagCount = CATEGORIES.reduce((n, c) => n + backup.tags[c].length, 0);
console.log(`wrote ${target}`);
console.log(`  ${tagCount} tag(s) across ${CATEGORIES.length} categories`);
for (const c of CATEGORIES) {
  if (backup.tags[c].length > 0) console.log(`    ${c}: ${backup.tags[c].length}`);
}
console.log(`  ${backup.queries.length} saved quer(y/ies)`);
console.log(`  dark: ${backup.dark}`);
if (notes.length > 0) {
  console.log(`\nnotes (${basename(inPath)}):`);
  for (const note of notes) console.log(`  - ${note}`);
}
console.log("\nCounts are 0 with updated: 0, so the app refreshes them on first load.");
