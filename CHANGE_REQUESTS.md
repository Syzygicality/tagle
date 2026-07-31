# Tagle Change Requests

## Access Protection

Protect Tagle access and limit to personal use while keeping it deployed.

- `APP_PASSWORD` and `COOKIE_SECRET` env vars
- Cookie token to authenticate page access
- Auth middleware to check requests and authenticate access
- Sign with expiry datetime
- When unauthorized, redirect to a login page to enter the app password

## Schema Change

- Tags are now objects, not strings
  - Fields: name, category, item count, starred, last updated (by Tagle)
  - To avoid hammering the API when updating item count, only make update calls for tags whose last update is older than 10 minutes
  - Also make update calls for tags that are being searched and redirected to
- Saved queries are now objects
  - Fields: name, query string, last interacted (clicked/created, but not updated on query string edits)

## Features

### Tags

- Remove the rounded borders on all tags
- Get rid of remove mode; implement a small button next to the tag name that is hidden but appears on hover. Clicking it opens a confirmation dialog with the accept button already focused
- Add a star button next to the tag name that is hidden but appears on hover
  - Add a notifications dropdown button in the top right
  - When a tag's item count increases on update and the tag is starred, create a new notification in the dropdown that does a query-redirect of the tag when clicked
  - If the notification is already in the dropdown, push it to the top
- Add a redirect button that replaces the right-click functionality, hidden until the tag entry is hovered

### Tag Sections

- Remove the ability to drag and reorder tags
  - Each tag section can sort tags ascending or descending by name or item count (default: alphabetical order)
  - Each section has a search bar to search tags by matching substring
- Lock section height to a hard cap when too many tags are in the section, then enable a scrollbar to navigate tags in the section

### Query Building

- The query box is now an actual text box; clicking tags in tag sections just appends the tag name with a trailing space
- Add an OR mode toggle button
  - When pressed: insert `(` into the query
  - While enabled: insert `~` before inserting a tag
  - When untoggled: disable that behavior and add `)` into the query
- Autocomplete based on saved tags in the sections when manually typing tags into the query box
  - If a tag is entered into the query that isn't already in a tag section (and thus wasn't autocompleted), non-intrusively prompt the user asking if they want to add that tag
- Disable the key corresponding to exclude mode, save, and any other now-removed shortcuts
- Parse by splitting on spaces, cleaning up empty strings
- Prompt for a query name when saving
  - If saving, check whether a query with that name already exists
    - If so, update the existing query's string
    - If not, create a new query

### Saved Queries

- Now on a separate view from tag sections (with a method to switch between the two views); sidebar, notifications dropdown, etc. are preserved
- Remove dragging functionality
  - Instead, to reorder: each saved query has a small reorder button, hidden but appears on hover. Clicking it, then clicking another saved query, moves it to that position and shifts the rest in between down
- Add an edit button that replaces the right-click functionality, hidden until the saved query is hovered