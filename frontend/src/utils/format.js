export const tierClass = (tier) => `tier-${tier}`;

export const eligibilityLabel = (status) =>
  ({ clear: 'No eligibility flags', verify: 'Verify eligibility', blocked: 'Eligibility blocker' })[status] || status;

export const placeOf = (opp) => [opp.location?.city, opp.location?.country].filter(Boolean).join(', ');

export const expOf = (opp) => {
  const e = opp.experience || {};
  if (typeof e.minYears !== 'number') return 'Not specified';
  return typeof e.maxYears === 'number' ? `${e.minYears}–${e.maxYears} years` : `${e.minYears}+ years`;
};

export const pct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n * 100)}%`);
