/**
 * Compatibility shim for brace-expansion.
 *
 * Why this exists
 * ---------------
 * GHSA-mh99-v99m-4gvg (DoS via unbounded brace expansion) is patched only in
 * brace-expansion >= 5.0.8. No 1.x fix was ever published -- 1.1.18 is the
 * highest 1.x release in existence.
 *
 * But minimatch@3 -- which eslint@9, @eslint/config-array, @eslint/eslintrc,
 * eslint-plugin-import, eslint-plugin-jsx-a11y and eslint-plugin-react all
 * still depend on -- does `require('brace-expansion')(pattern)`, i.e. it calls
 * the module itself as a function. v5 is an ESM-first rewrite that exports a
 * named `{ expand }` instead, so pointing minimatch@3 straight at v5 fails with
 * "expand is not a function".
 *
 * Upgrading minimatch to v10 (the only line that accepts brace-expansion@^5)
 * is not an option either: eslint-plugin-react and eslint-plugin-jsx-a11y call
 * minimatch as a bare function too, and both are already at their latest
 * release.
 *
 * So this package re-exports the *patched* v5 implementation using the v1
 * calling convention. The vulnerable code is gone; every consumer's API is
 * preserved. Delete this shim and the `brace-expansion` override in
 * package.json once those plugins move off minimatch@3.
 *
 * Why the code is vendored
 * ------------------------
 * `file:` specs inside an `overrides` block are resolved relative to each
 * depender, not the project root, so npm never installs a nested dependency of
 * this package -- it silently produces a shim that throws MODULE_NOT_FOUND at
 * require time while `npm audit` happily reports 0. Declaring the shim as a
 * workspace instead fails with EOVERRIDE. So this package must have no
 * dependencies: vendor/ holds the unmodified CJS builds of
 * brace-expansion@5.0.9 and balanced-match@4.0.4 (both MIT, licenses included),
 * with the single `require("balanced-match")` repointed at the local copy.
 *
 * Because it is vendored, it will NOT pick up future brace-expansion releases.
 * Re-check when removing the shim.
 */

"use strict";

const upstream = require("./vendor/brace-expansion.js");

function expand(pattern) {
  return upstream.expand(pattern);
}

module.exports = expand;

// Named forms, for consumers written against v5's export shape.
module.exports.expand = expand;
module.exports.default = expand;
module.exports.EXPANSION_MAX = upstream.EXPANSION_MAX;
module.exports.EXPANSION_MAX_LENGTH = upstream.EXPANSION_MAX_LENGTH;
