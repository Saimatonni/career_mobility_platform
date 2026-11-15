/** Scoring configuration. Weights sum to 100. Change here; nothing else needs editing. */
module.exports = {
  WEIGHTS: {
    skills: 30,
    experience: 15,
    education: 10,
    location: 15,
    language: 15,
    interests: 15,
  },
  LABELS: {
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    location: 'Location',
    language: 'Language',
    interests: 'Career interests',
  },
  /** Any critical gap or confirmed eligibility block caps the final score at this value. */
  CRITICAL_CAP: 45,
  /** Tier thresholds (applied to the final, possibly capped, score). */
  STRONG_MIN: 75,
  PARTIAL_MIN: 50,
  /** Experience: score lost per missing year, and years above max before "overqualified" applies. */
  EXPERIENCE_PENALTY_PER_YEAR: 0.3,
  OVERQUALIFIED_AFTER_YEARS: 2,
  /** An experience shortfall of at least this many years is treated as a critical gap. */
  CRITICAL_EXPERIENCE_GAP_YEARS: 3,
};
