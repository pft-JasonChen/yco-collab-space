/**
 * Prototype stand-in for RD's `getTranslationFunction()`.
 *
 * Keys are RD's global flat dot-notation, and the interpolation syntax matches
 * RD's `{{name}}` placeholders, so a feature's strings can be merged into
 * `src/i18n/json/<lang>.json` without renaming anything. A key whose `origin` is
 * `rd-existing` already lives in RD and must not be re-declared there.
 *
 * The prototype ships English only. Localisation happens in RD.
 */
const PLACEHOLDER = /\{\{(\w+)\}\}/g;

export function createTranslator(dictionary) {
  const entries = dictionary?.keys ?? {};
  const table = new Map(Object.entries(entries).map(([key, entry]) => [key, entry.value]));

  return function t(key, replacements) {
    const value = table.get(key);
    if (value === undefined) {
      // Loud in development, harmless in a review build: a missing key renders as
      // the key itself rather than an empty gap, so it is obvious in a screenshot.
      if (typeof console !== 'undefined') console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    if (!replacements) return value;
    return value.replace(PLACEHOLDER, (match, name) =>
      Object.prototype.hasOwnProperty.call(replacements, name) ? String(replacements[name]) : match,
    );
  };
}

/** Keys this feature adds to RD, i.e. everything not already in the RD dictionary. */
export function newKeys(dictionary) {
  return Object.fromEntries(
    Object.entries(dictionary?.keys ?? {})
      .filter(([, entry]) => entry.origin === 'new')
      .map(([key, entry]) => [key, entry.value]),
  );
}

export default createTranslator;
