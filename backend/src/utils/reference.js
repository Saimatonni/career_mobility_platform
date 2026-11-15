/** Shared reference data used by validation, matching and the /api/meta endpoint. */

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High school / secondary', rank: 1 },
  { value: 'diploma', label: 'Diploma / associate', rank: 2 },
  { value: 'bachelor', label: "Bachelor's degree", rank: 3 },
  { value: 'master', label: "Master's degree", rank: 4 },
  { value: 'phd', label: 'Doctorate (PhD)', rank: 5 },
];

const LANGUAGE_LEVELS = [
  { value: 'basic', label: 'Basic', rank: 1 },
  { value: 'intermediate', label: 'Intermediate / conversational', rank: 2 },
  { value: 'professional', label: 'Professional working proficiency', rank: 3 },
  { value: 'fluent', label: 'Fluent / advanced', rank: 4 },
  { value: 'native', label: 'Native', rank: 5 },
];

const WORK_AUTH_STATUSES = [
  { value: 'unknown', label: 'Not specified / unknown' },
  { value: 'authorised', label: 'I have the right to work in the countries listed' },
  { value: 'needs_sponsorship', label: 'I would need visa sponsorship' },
];

const EXPERIENCE_LEVELS = ['internship', 'entry', 'mid', 'senior'];

/** Used so that a preference like "Europe" still matches a role in Germany. */
const REGIONS = {
  Europe: ['Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Ireland', 'Poland', 'United Kingdom'],
  'North America': ['Canada', 'United States'],
  'Asia-Pacific': ['Singapore', 'Japan', 'Australia', 'Malaysia', 'India', 'South Korea'],
  'Middle East': ['United Arab Emirates', 'Qatar', 'Saudi Arabia'],
};

const COUNTRIES = [
  'Australia', 'Canada', 'France', 'Germany', 'Ireland', 'Japan', 'Malaysia', 'Netherlands',
  'Singapore', 'Spain', 'Sweden', 'United Arab Emirates', 'United Kingdom', 'United States',
];

/** Small, explicit alias table. Keys and values are already normalised (lower case). */
const SKILL_ALIASES = {
  'ms excel': 'excel',
  'microsoft excel': 'excel',
  spreadsheets: 'excel',
  'project management': 'project coordination',
  'project support': 'project coordination',
  'stakeholder management': 'stakeholder communication',
  'stakeholder engagement': 'stakeholder communication',
  'report writing': 'reporting',
  reports: 'reporting',
  'data analytics': 'data analysis',
  'data analyses': 'data analysis',
  powerpoint: 'presentation',
  presentations: 'presentation',
  'presentation skills': 'presentation',
  'customer service': 'customer support',
  'client support': 'customer support',
  sql: 'sql',
  'power bi': 'power bi',
};

const STOPWORDS = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'to', 'a', 'an', 'with', 'on', 'at']);

const rankOf = (list, value) => (list.find((x) => x.value === value) || {}).rank || 0;
const labelOf = (list, value) => (list.find((x) => x.value === value) || {}).label || value;

module.exports = {
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  WORK_AUTH_STATUSES,
  EXPERIENCE_LEVELS,
  REGIONS,
  COUNTRIES,
  SKILL_ALIASES,
  STOPWORDS,
  rankOf,
  labelOf,
};
