# Tagle Change Requests

Ordered so that each task depends only on the ones above it.

## Phase 1 — Data model

1. **Tags become objects, not strings.** Fields: name, category, item count, starred, last updated (by Tagle).
2. **Saved queries become objects.** Fields: name, query string, last interacted (set on click/create, not updated when the query string is edited).
3. **Rewrite backup export/import for the new schema.** Bump the backup version and validate the new tag and query object shapes; version 1 files are simply rejected.
4. **Item count updates.** To avoid hammering the API, only make update calls for tags whose last update is older than 10 minutes. Also update tags that are being searched and redirected to.

## Phase 2 — Tag entries

5. **Remove the rounded borders on all tags.**
6. **Add hover-revealed buttons next to the tag name,** hidden until the tag entry is hovered:
   - Delete button, opening a confirmation dialog with the accept button already focused.
   - Star button.
   - Redirect button, replacing the current right-click functionality.
7. **Get rid of remove mode,** including its keyboard shortcut. Tags and saved queries are each deleted with their own hover-revealed button instead.
8. **Add a notifications dropdown button in the top right.**
   - When a starred tag's item count increases on update, create a notification that does a query-redirect of that tag when clicked.
   - If the notification is already in the dropdown, push it to the top.

## Phase 3 — Tag sections

9. **Remove the ability to drag and reorder tags.**
10. **Sort per section** — ascending or descending by name or item count, defaulting to alphabetical order.
11. **Add a search bar per section** that matches tags by substring.
12. **Lock section height to a hard cap** when a section holds too many tags, with a scrollbar to navigate within the section.

## Phase 4 — Query building

13. **Make the query box an actual text box.** Clicking tags in tag sections just appends the tag name with a trailing space. Parse by splitting on spaces and cleaning up empty strings.
14. **Add an OR mode toggle button.**
    - When pressed: insert `(` into the query.
    - While enabled: insert `~` before inserting a tag.
    - When untoggled: disable that behavior and add `)` into the query.
15. **Autocomplete from tags saved in the sections** when typing into the query box. If a tag is entered that isn't already in a section (and so wasn't autocompleted), non-intrusively prompt to add it.
16. **Prompt for a query name when saving.** If a query with that name already exists, update its query string; otherwise create a new query.
17. **Disable the keys for exclude mode, save, and any other now-removed shortcuts.**

## Phase 5 — Saved queries

18. **Move saved queries to a separate view** from the tag sections, with a way to switch between the two. The sidebar, notifications dropdown, etc. are preserved across both.
19. **Replace dragging with a reorder button** on each saved query, hidden until hovered. Clicking it, then clicking another saved query, moves it to that position and shifts the rest in between down.
20. **Add an edit button** on each saved query, hidden until hovered, replacing the right-click functionality.
21. **Add a delete button** on each saved query, hidden until hovered, opening the same confirmation dialog as tag deletion with the accept button already focused.
