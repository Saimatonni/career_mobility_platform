/**
 * Rule-based, deterministic matching engine. No network calls, no AI service, so results
 * are repeatable and every number can be traced back to a rule in factors.js / config.js.
 *
 * Pipeline per opportunity:
 *   1. Score six weighted factors (0..1 each, or null when the profile lacks the data).
 *   2. Re-normalise the weights over the factors that WERE assessed (missing data is never
 *      silently treated as a pass or a fail) and report a confidence value.
 *   3. Evaluate eligibility separately and as flags (never a silent "satisfied").
 *   4. Cap the score when a critical gap or confirmed eligibility blocker exists.
 *   5. Build a template-based explanation from the same facts that produced the score.
 */
const cfg = require('./config');
const f = require('./factors');

const FACTORS = [
  ['skills', f.skillsFactor],
  ['experience', f.experienceFactor],
  ['education', f.educationFactor],
  ['location', f.locationFactor],
  ['language', f.languageFactor],
  ['interests', f.interestsFactor],
];

const TIER_LABELS = {
  strong: 'Strong match',
  partial: 'Partial match',
  weak: 'Weak match',
  critical_gap: 'Critical gap',
};

function matchOpportunity(profile, opp) {
  const results = FACTORS.map(([key, fn]) => ({ key, label: cfg.LABELS[key], weight: cfg.WEIGHTS[key], ...fn(profile, opp) }));

  const assessed = results.filter((r) => r.score !== null);
  const assessedWeight = assessed.reduce((s, r) => s + r.weight, 0);
  const rawScore = assessedWeight ? (assessed.reduce((s, r) => s + r.score * r.weight, 0) / assessedWeight) * 100 : 0;
  const confidence = assessedWeight / Object.values(cfg.WEIGHTS).reduce((a, b) => a + b, 0);

  const factors = results.map((r) => ({
    key: r.key,
    label: r.label,
    weight: r.weight,
    score: r.score === null ? null : Math.round(r.score * 100) / 100,
    contribution: r.score === null || !assessedWeight ? 0 : Math.round(((r.score * r.weight) / assessedWeight) * 1000) / 10,
    status: r.status,
    detail: r.detail,
  }));

  const eligibility = f.eligibilityCheck(profile, opp);

  const strengths = results.flatMap((r) => r.strengths);
  const gaps = results.flatMap((r) => r.gaps.map((g) => ({ ...g, area: r.label })));
  const notAssessed = results.filter((r) => r.score === null).map((r) => r.label);

  const criticalReasons = [
    ...gaps.filter((g) => g.critical).map((g) => g.text),
    ...eligibility.flags.filter((x) => x.severity === 'critical').map((x) => x.message),
  ];
  const capped = criticalReasons.length > 0 && rawScore > cfg.CRITICAL_CAP;
  const score = Math.round(criticalReasons.length ? Math.min(rawScore, cfg.CRITICAL_CAP) : rawScore);

  const tier = criticalReasons.length ? 'critical_gap' : score >= cfg.STRONG_MIN ? 'strong' : score >= cfg.PARTIAL_MIN ? 'partial' : 'weak';

  return {
    opportunityId: opp.id,
    score,
    rawScore: Math.round(rawScore),
    capped,
    tier,
    tierLabel: TIER_LABELS[tier],
    confidence: Math.round(confidence * 100) / 100,
    factors,
    strengths,
    gaps,
    notAssessed,
    eligibility,
    summary: buildSummary({ tier, score, strengths, gaps, eligibility, criticalReasons, notAssessed, capped, rawScore }),
  };
}

function buildSummary({ tier, score, strengths, gaps, eligibility, criticalReasons, notAssessed, capped, rawScore }) {
  const parts = [`${TIER_LABELS[tier]} (${score}/100).`];
  if (strengths.length) parts.push(`Strengths: ${strengths.slice(0, 2).join(' ')}`);
  const nonCritical = gaps.filter((g) => !g.critical);
  if (criticalReasons.length) {
    parts.push(`Critical: ${criticalReasons[0]}${capped ? ` The score was capped from ${Math.round(rawScore)} to ${score} because of this.` : ''}`);
  } else if (nonCritical.length) {
    parts.push(`Main gap: ${nonCritical[0].text}`);
  }
  if (!criticalReasons.length && eligibility.status === 'verify') parts.push('Eligibility needs verification before you apply.');
  if (notAssessed.length) parts.push(`Not assessed (missing profile data): ${notAssessed.join(', ')}.`);
  return parts.join(' ');
}

/** Rank all opportunities for a profile. Highest score first; ties: fewer verification flags, then title. */
function rankOpportunities(profile, opportunities) {
  const verifyCount = (m) => m.eligibility.flags.filter((x) => x.severity === 'verify').length;
  const ranked = opportunities.map((opp) => ({ opportunity: opp, match: matchOpportunity(profile, opp) }));
  ranked.sort((a, b) => b.match.score - a.match.score || verifyCount(a.match) - verifyCount(b.match) || a.opportunity.title.localeCompare(b.opportunity.title));
  return ranked.map((r, i) => ({ rank: i + 1, ...r }));
}

module.exports = { matchOpportunity, rankOpportunities, TIER_LABELS };
