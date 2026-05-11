"use client";

import { useEffect, useRef, useState } from "react";
import TagSection from "@/components/TagSection";
import Tag from "@/components/Tag";
import { useTagle } from "@/hooks/useTagle";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function Home() {
  const [dark, setDark] = useLocalStorage("dark", false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const queriesDragIndex = useRef<number | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const {
    value,
    setValue,
    categoryMap,
    hydrated,
    exclude,
    removeMode,
    queries,
    selectedTags,
    setSelectedtags,
    suggestions,
    handleSubmit,
    handleAutocomplete,
    handleExclude,
    handleRemoveMode,
    clearSuggestions,
    handleTagClick,
    handleSearchTagClick,
    handleSave,
    handleSearch,
    handleQueryRemove,
    handleQueriesReorder,
    handleCategoryReorder,
  } = useTagle();

  // ── theme shortcuts ──────────────────────────────────────────────────────
  const d = dark;

  const rootCls = d ? "bg-zinc-950 text-zinc-200" : "bg-white text-gray-900";
  const sidebarCls = d ? "border-zinc-800/80 bg-zinc-900/30" : "border-gray-200 bg-gray-50";
  const headingCls = d ? "text-zinc-100" : "text-gray-900";
  const toggleCls = d
    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
    : "text-gray-400 hover:bg-gray-200 hover:text-gray-600";
  const inputCls = d
    ? "border-zinc-700/80 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/30"
    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400/30";
  const dropdownCls = d
    ? "border-zinc-700/80 bg-zinc-900 shadow-black/50"
    : "border-gray-200 bg-white shadow-black/10";
  const dropItemCls = d ? "hover:bg-zinc-800" : "hover:bg-gray-50";
  const dropTextCls = d ? "text-zinc-200" : "text-gray-900";
  const dropCountCls = d ? "text-zinc-400" : "text-gray-400";
  const selAreaCls = d ? "border-zinc-800/80 bg-zinc-900/40" : "border-gray-200 bg-white/50";
  const emptyTagsCls = d ? "text-zinc-500" : "text-gray-400";
  const saveBtnCls = d
    ? "border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  const clearBtnCls = d
    ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300"
    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-600";
  const excludeCls = exclude
    ? d
      ? "border-red-900/80 bg-red-950/50 text-red-400 hover:bg-red-900/50"
      : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
    : d
      ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300"
      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-600";
  const removeCls = removeMode
    ? d
      ? "border-orange-900/80 bg-orange-950/50 text-orange-400 hover:bg-orange-900/50"
      : "border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100"
    : d
      ? "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300"
      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-600";
  const queryBorderCls = d ? "border-zinc-800/80" : "border-gray-200";
  const queryLabelCls = d ? "text-zinc-400" : "text-gray-400";

  return (
    <div className={`flex min-h-screen ${rootCls}`}>
      {/* Sidebar */}
      <aside className={`flex w-80 shrink-0 flex-col gap-3 border-r p-4 ${sidebarCls}`}>
        <div className="flex items-center justify-between">
          <h1 className={`font-mono text-base font-bold tracking-widest ${headingCls}`}>TAGLE</h1>
          <button
            className={`rounded-md p-1.5 transition-colors ${toggleCls}`}
            onClick={() => setDark(!dark)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? "☀︎" : "☾"}
          </button>
        </div>

        {/* Tag input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Add tag…"
            className={`w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-1 ${inputCls}`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleAutocomplete(e.target.value);
              setHighlightIdx(-1);
            }}
            onBlur={() =>
              setTimeout(() => {
                clearSuggestions();
                setHighlightIdx(-1);
              }, 150)
            }
            onKeyDown={(e) => {
              if (suggestions.length > 0 && e.key === "Tab") {
                e.preventDefault();
                setHighlightIdx((i) =>
                  e.shiftKey
                    ? i <= 0
                      ? suggestions.length - 1
                      : i - 1
                    : i >= suggestions.length - 1
                      ? 0
                      : i + 1
                );
              } else if (e.key === "Enter") {
                const picked = suggestions[highlightIdx];
                handleSubmit(picked ? picked.value : undefined);
                setHighlightIdx(-1);
              } else if (e.key === "Escape") {
                setHighlightIdx(-1);
              }
            }}
          />
          {suggestions.length > 0 && (
            <ul
              className={`absolute top-full z-10 mt-0.5 w-full list-none overflow-hidden rounded-md border p-0 shadow-lg ${dropdownCls}`}
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.value}
                  className={`flex cursor-pointer items-center justify-between px-3 py-1.5 transition-colors ${i === highlightIdx ? (d ? "bg-zinc-700" : "bg-gray-100") : dropItemCls}`}
                  onClick={() => {
                    handleSubmit(s.value);
                    setHighlightIdx(-1);
                  }}
                >
                  <span className={`font-mono text-xs ${dropTextCls}`}>{s.value}</span>
                  <span className={`text-xs ${dropCountCls}`}>{s.count?.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected tags */}
        <div
          className={`flex min-h-10 flex-wrap content-start gap-1.5 rounded-md border px-3 py-2 ${selAreaCls}`}
        >
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <Tag
                key={tag}
                name={tag}
                type="search"
                dark={dark}
                tagOnClick={handleSearchTagClick}
              />
            ))
          ) : (
            <span className={`text-sm ${emptyTagsCls}`}>No tags selected</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            className={`flex-1 justify-center rounded-md border px-3 py-1.5 text-sm transition-colors ${saveBtnCls}`}
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            onClick={() => handleSearch()}
          >
            Go →
          </button>
        </div>
        <button
          className={`justify-center rounded-md border px-3 py-1.5 text-sm transition-colors ${clearBtnCls}`}
          onClick={() => setSelectedtags([])}
        >
          Clear
        </button>
        <button
          className={`justify-center rounded-md border px-3 py-1.5 text-sm transition-colors ${excludeCls}`}
          onClick={handleExclude}
        >
          {exclude ? "− Exclude mode on" : "+ Exclude mode"}
        </button>
        <button
          className={`justify-center rounded-md border px-3 py-1.5 text-sm transition-colors ${removeCls}`}
          onClick={handleRemoveMode}
        >
          {removeMode ? "− Remove mode on" : "− Remove mode"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-x-8 gap-y-6">
            {hydrated && (
              <>
                <TagSection
                  dark={dark}
                  name="Copyright"
                  tags={categoryMap.copyright}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("copyright", f, t)}
                />
                <TagSection
                  dark={dark}
                  name="Characters"
                  tags={categoryMap.characters}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("characters", f, t)}
                />
                <TagSection
                  dark={dark}
                  name="Artists"
                  tags={categoryMap.artists}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("artists", f, t)}
                />
                <TagSection
                  dark={dark}
                  name="General"
                  tags={categoryMap.general}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("general", f, t)}
                />
                <TagSection
                  dark={dark}
                  name="Meta"
                  tags={categoryMap.meta}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("meta", f, t)}
                />
                <TagSection
                  dark={dark}
                  name="Other"
                  tags={categoryMap.other}
                  query={false}
                  tagOnClick={handleTagClick}
                  onReorder={(f, t) => handleCategoryReorder("other", f, t)}
                />
              </>
            )}
          </div>
        </div>

        {hydrated && queries.length > 0 && (
          <div className={`border-t p-4 ${queryBorderCls}`}>
            <p className={`mb-2 text-xs font-semibold tracking-widest uppercase ${queryLabelCls}`}>
              Saved Queries
            </p>
            <div className="flex flex-col gap-2">
              {queries.map((queryTags, i) => (
                <div
                  key={i}
                  draggable
                  className="cursor-grab active:cursor-grabbing"
                  onDragStart={() => {
                    queriesDragIndex.current = i;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (queriesDragIndex.current === null || queriesDragIndex.current === i) return;
                    handleQueriesReorder(queriesDragIndex.current, i);
                    queriesDragIndex.current = null;
                  }}
                >
                  <TagSection
                    dark={dark}
                    tags={queryTags}
                    query={true}
                    onSectionClick={() =>
                      removeMode ? handleQueryRemove(i) : handleSearch(queryTags)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
