/**
 * The upstream API matches tag names in their HTML-escaped form — asking it
 * for "d'arce" returns nothing, while "d&#039;arce" returns the tag (whose
 * name attribute then comes back decoded). Every outgoing name goes through
 * this; what the app stores and shows stays plain text.
 */
export function htmlEncode(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#039;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
