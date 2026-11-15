const test = require('node:test');
const assert = require('node:assert/strict');
const { matchOpportunity, rankOpportunities } = require('../src/services/matching/engine');
const opportunities = require('../src/data/opportunities');
const sample = require('../src/data/sampleProfile');

const opp = (id) => opportunities.find((o) => o.id === id);
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- The three cases required by the assessment brief ---------- */

test('STRONG match: Programme Assistant – International NGO', () => {
  const m = matchOpportunity(sample, opp('opp-001'));
  assert.equal(m.tier, 'strong');
  assert.ok(m.score >= 85, `expected >=85, got ${m.score}`);
  assert.equal(m.capped, false);
  assert.ok(m.strengths.some((s) => /3 of 3 required skills/.test(s)));
  // Work authorisation is unknown -> must be flagged, never silently satisfied
  assert.equal(m.eligibility.status, 'verify');
  assert.ok(m.eligibility.flags.some((f) => f.code === 'WORK_AUTH_UNKNOWN' && /not a legal determination/i.test(f.message)));
});

test('PARTIAL match: Junior Data Analyst – Fintech', () => {
  const m = matchOpportunity(sample, opp('opp-006'));
  assert.equal(m.tier, 'partial');
  assert.ok(m.score >= 50 && m.score < 75, `got ${m.score}`);
  const skillGap = m.gaps.find((g) => g.area === 'Skills');
  assert.match(skillGap.text, /SQL/);
  assert.match(skillGap.text, /Python/);
  assert.equal(skillGap.critical, false); // Excel still matches
});

test('CRITICAL GAP: German-speaking Client Associate (required German missing)', () => {
  const m = matchOpportunity(sample, opp('opp-003'));
  assert.equal(m.tier, 'critical_gap');
  assert.ok(m.score <= 45);
  assert.equal(m.capped, true);
  assert.ok(m.rawScore > m.score, 'raw score should be higher than the capped score');
  assert.ok(m.gaps.some((g) => g.critical && /German/.test(g.text)));
  assert.match(m.summary, /capped/);
});

/* ---------- Eligibility handling ---------- */

test('Student-only role: unknown -> verify, not enrolled -> critical, enrolled -> info', () => {
  const o = opp('opp-002');
  const unknown = matchOpportunity({ ...sample, isStudent: null }, o);
  assert.ok(unknown.eligibility.flags.some((f) => f.code === 'STUDENT_UNKNOWN' && f.severity === 'verify'));

  const no = matchOpportunity({ ...sample, isStudent: false }, o);
  assert.equal(no.eligibility.status, 'blocked');
  assert.equal(no.tier, 'critical_gap');

  const yes = matchOpportunity({ ...sample, isStudent: true, workAuthorisation: { status: 'authorised', countries: ['Singapore'] } }, o);
  assert.ok(yes.eligibility.flags.some((f) => f.code === 'STUDENT_OK'));
  assert.notEqual(yes.eligibility.status, 'blocked');
});

test('Work authorisation: sponsorship needed + none offered is critical; offered -> verify', () => {
  const needs = { ...sample, workAuthorisation: { status: 'needs_sponsorship', countries: [] } };
  const noSponsor = matchOpportunity(needs, opp('opp-001'));
  assert.equal(noSponsor.eligibility.status, 'blocked');
  assert.ok(noSponsor.score <= 45);

  const sponsor = matchOpportunity(needs, opp('opp-005'));
  assert.equal(sponsor.eligibility.status, 'verify');
  assert.ok(sponsor.eligibility.flags.some((f) => f.code === 'WORK_AUTH_SPONSORSHIP'));
});

test('Work authorisation: authorised in a different country is not treated as authorised here', () => {
  const p = { ...sample, workAuthorisation: { status: 'authorised', countries: ['Canada'] } };
  assert.equal(matchOpportunity(p, opp('opp-008')).eligibility.status, 'clear'); // Canada role, self-declared => info only
  assert.equal(matchOpportunity(p, opp('opp-001')).eligibility.status, 'blocked'); // Germany role, no sponsorship
});

test('Every opportunity that requires work authorisation is flagged for an unknown-status profile', () => {
  for (const o of opportunities.filter((x) => x.eligibility.workAuthorisationRequired)) {
    const m = matchOpportunity(sample, o);
    assert.ok(m.eligibility.flags.some((f) => f.code === 'WORK_AUTH_UNKNOWN'), `${o.id} lacks flag`);
    assert.notEqual(m.eligibility.status, 'clear', `${o.id} must not be "clear"`);
  }
});

/* ---------- Missing data ---------- */

test('Missing profile data is excluded from scoring, reported, and lowers confidence', () => {
  const m = matchOpportunity({ ...sample, skills: [] }, opp('opp-001'));
  const skills = m.factors.find((f) => f.key === 'skills');
  assert.equal(skills.score, null);
  assert.ok(m.notAssessed.includes('Skills'));
  assert.ok(m.confidence < 1);
  assert.match(m.summary, /Not assessed/);
  const sum = m.factors.reduce((s, f) => s + f.contribution, 0);
  assert.ok(Math.abs(sum - m.rawScore) <= 1, 'contributions must add up to the raw score');
});

/* ---------- Individual criteria ---------- */

test('Skill aliases and related skills are recognised', () => {
  const p = { ...sample, skills: ['MS Excel', 'Communication skills', 'Report writing', 'Project management'] };
  const m = matchOpportunity(p, opp('opp-001'));
  const text = m.strengths.join(' ');
  assert.match(text, /Reporting/);
  assert.match(text, /Project coordination/);
  const related = matchOpportunity({ ...sample, skills: ['Communication'] }, opp('opp-001')).strengths.join(' ');
  assert.match(related, /related/i);
});

test('Preferred region ("Europe") matches a country in that region', () => {
  const p = { ...sample, preferredLocations: ['Europe'] };
  const loc = matchOpportunity(p, opp('opp-001')).factors.find((f) => f.key === 'location');
  assert.equal(loc.score, 0.8);
});

test('Language one level short is a partial score, two or more is critical', () => {
  const o = clone(opp('opp-010'));
  const oneShort = matchOpportunity({ ...sample, languages: [{ name: 'English', level: 'professional' }] }, o);
  assert.equal(oneShort.factors.find((f) => f.key === 'language').score, 0.5);
  assert.ok(!oneShort.gaps.some((g) => g.critical));

  const twoShort = matchOpportunity({ ...sample, languages: [{ name: 'English', level: 'intermediate' }] }, o);
  assert.ok(twoShort.gaps.some((g) => g.critical));
});

test('Experience: far too little is critical; slightly short is a normal gap', () => {
  const senior = matchOpportunity(sample, opp('opp-007'));
  assert.ok(senior.gaps.some((g) => g.area === 'Experience' && g.critical));
  const slightly = matchOpportunity({ ...sample, yearsExperience: 1 }, opp('opp-004'));
  assert.ok(slightly.gaps.some((g) => g.area === 'Experience' && !g.critical));
});

/* ---------- Ranking ---------- */

test('Ranking is sorted, complete, deterministic and puts critical gaps below strong matches', () => {
  const a = rankOpportunities(sample, opportunities);
  const b = rankOpportunities(sample, opportunities);
  assert.deepEqual(a.map((r) => r.opportunity.id), b.map((r) => r.opportunity.id));
  assert.equal(a.length, opportunities.length);
  for (let i = 1; i < a.length; i++) assert.ok(a[i - 1].match.score >= a[i].match.score);
  assert.equal(a[0].rank, 1);
  const lastStrong = Math.max(...a.map((r, i) => (r.match.tier === 'strong' ? i : -1)));
  const firstCritical = a.findIndex((r) => r.match.tier === 'critical_gap');
  assert.ok(lastStrong < firstCritical);
});

test('Sample dataset covers strong, partial and critical-gap outcomes and has >= 10 records', () => {
  assert.ok(opportunities.length >= 10);
  const tiers = new Set(rankOpportunities(sample, opportunities).map((r) => r.match.tier));
  for (const t of ['strong', 'partial', 'critical_gap']) assert.ok(tiers.has(t), `missing tier ${t}`);
});
