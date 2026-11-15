const { SKILL_ALIASES, STOPWORDS } = require('./reference');

/** Lower-case, trim, collapse whitespace, strip control characters. */
function clean(str) {
  return String(str ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const norm = (str) => clean(str).toLowerCase();

function normSkill(str) {
  const n = norm(str);
  return SKILL_ALIASES[n] || n;
}

/** Tokenise free text into comparable stems ("programmes" -> "programme", "program" -> "programme"). */
function tokens(str) {
  return norm(str)
    .replace(/[^a-z0-9+#\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map((t) => {
      let s = t;
      if (s === 'program' || s === 'programs') s = 'programme';
      if (s.length > 4 && s.endsWith('ies')) s = s.slice(0, -3) + 'y';
      else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
      return s;
    });
}

const unique = (arr) => [...new Set(arr)];

/** Trim, drop empties, de-duplicate case-insensitively, keep first-seen casing. */
function cleanList(arr, maxLen = 60) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(arr) ? arr : []) {
    const c = clean(item).slice(0, maxLen);
    const k = c.toLowerCase();
    if (c && !seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}

module.exports = { clean, norm, normSkill, tokens, unique, cleanList };
