/**
 * One pure function per matching criterion.
 * Each returns: { score: 0..1 | null, status, detail, strengths: string[], gaps: {text, critical}[] }
 *   score === null  -> the criterion could not be assessed (missing data); the engine
 *                      removes it from the weighting instead of guessing.
 *   status          -> 'met' | 'partial' | 'gap' | 'unknown'
 */
const { EDUCATION_LEVELS, LANGUAGE_LEVELS, REGIONS, rankOf, labelOf } = require('../../utils/reference');
const { norm, normSkill, tokens } = require('../../utils/text');
const cfg = require('./config');

const statusFromScore = (s) => (s >= 0.75 ? 'met' : s >= 0.4 ? 'partial' : 'gap');
const join = (arr) => arr.join(', ');
const unknown = (detail) => ({ score: null, status: 'unknown', detail, strengths: [], gaps: [] });

/* ------------------------------------------------------------------ skills */
function isRelated(a, b) {
  // "communication" is related to "stakeholder communication" (token subset, tokens > 3 chars).
  const ta = tokens(a).filter((t) => t.length > 3);
  const tb = tokens(b).filter((t) => t.length > 3);
  if (!ta.length || !tb.length) return false;
  const sub = (x, y) => x.every((t) => y.includes(t));
  return sub(ta, tb) || sub(tb, ta);
}

function skillsFactor(profile, opp) {
  const have = (profile.skills || []).map((s) => ({ raw: s, n: normSkill(s) }));
  if (!have.length) return unknown('No skills were provided, so skill fit could not be assessed.');

  const required = opp.requiredSkills || [];
  const preferred = opp.preferredSkills || [];
  const find = (skill) => {
    const n = normSkill(skill);
    const exact = have.find((h) => h.n === n);
    if (exact) return { type: 'exact', via: exact.raw };
    const rel = have.find((h) => isRelated(h.n, n));
    return rel ? { type: 'related', via: rel.raw } : null;
  };

  const matched = [], related = [], missing = [], prefMatched = [];
  required.forEach((s) => {
    const m = find(s);
    if (!m) missing.push(s);
    else if (m.type === 'exact') matched.push(s);
    else related.push(`${s} (via "${m.via}")`);
  });
  preferred.forEach((s) => {
    if (find(s)) prefMatched.push(s);
  });

  const reqCoverage = required.length ? (matched.length + 0.5 * related.length) / required.length : 1;
  const score = preferred.length ? 0.85 * reqCoverage + 0.15 * (prefMatched.length / preferred.length) : reqCoverage;

  const strengths = [];
  const gaps = [];
  if (matched.length) strengths.push(`You match ${matched.length} of ${required.length} required skills: ${join(matched)}.`);
  if (related.length) strengths.push(`Partly related skills: ${join(related)}.`);
  if (prefMatched.length) strengths.push(`You also have preferred skills: ${join(prefMatched)}.`);
  if (missing.length) {
    gaps.push({
      text: `Missing required skill${missing.length > 1 ? 's' : ''}: ${join(missing)}.`,
      critical: required.length > 0 && matched.length + related.length === 0,
    });
  }
  const detail = required.length
    ? `${matched.length} exact, ${related.length} related, ${missing.length} missing of ${required.length} required skills.`
    : 'No specific skills required.';
  return { score, status: statusFromScore(score), detail, strengths, gaps };
}

/* -------------------------------------------------------------- experience */
function experienceFactor(profile, opp) {
  const years = profile.yearsExperience;
  const exp = opp.experience || {};
  if (typeof years !== 'number' || Number.isNaN(years)) return unknown('Years of experience were not provided.');
  if (typeof exp.minYears !== 'number') return { score: 1, status: 'met', detail: 'No minimum experience stated.', strengths: [], gaps: [] };

  const range = typeof exp.maxYears === 'number' ? `${exp.minYears}–${exp.maxYears}` : `${exp.minYears}+`;
  const strengths = [];
  const gaps = [];
  let score = 1;

  if (years < exp.minYears) {
    const deficit = exp.minYears - years;
    score = Math.max(0, 1 - cfg.EXPERIENCE_PENALTY_PER_YEAR * deficit);
    gaps.push({ text: `Role asks for ${range} years of experience; you have ${years} (${deficit} year${deficit === 1 ? '' : 's'} short).`, critical: deficit >= cfg.CRITICAL_EXPERIENCE_GAP_YEARS });
  } else if (typeof exp.maxYears === 'number' && years > exp.maxYears + (opp.type === 'internship' ? 0.5 : cfg.OVERQUALIFIED_AFTER_YEARS)) {
    score = 0.7;
    gaps.push({ text: `You have ${years} years of experience, notably above the ${range} years this role targets; it may be below your level.`, critical: false });
  } else {
    strengths.push(`Your ${years} years of experience fits the ${range} years requested.`);
  }
  return { score, status: statusFromScore(score), detail: `${years} yrs vs ${range} yrs requested.`, strengths, gaps };
}

/* --------------------------------------------------------------- education */
function fieldRelevant(candidateField, oppFields) {
  const c = tokens(candidateField);
  return oppFields.some((f) => {
    const t = tokens(f);
    return t.length && (t.every((x) => c.includes(x)) || (c.length && c.every((x) => t.includes(x))));
  });
}

function educationFactor(profile, opp) {
  const level = profile.education && profile.education.level;
  if (!level) return unknown('Education level was not provided.');
  const req = opp.education || {};
  if (!req.minLevel) return { score: 1, status: 'met', detail: 'No education requirement stated.', strengths: [], gaps: [] };

  const have = rankOf(EDUCATION_LEVELS, level);
  const need = rankOf(EDUCATION_LEVELS, req.minLevel);
  const deficit = need - have;
  const levelScore = deficit <= 0 ? 1 : Math.max(0, 1 - 0.5 * deficit);

  const fields = req.fields || [];
  const field = profile.education.field || '';
  let fieldScore = 1;
  let fieldNote = '';
  if (fields.length) {
    if (fieldRelevant(field, fields)) fieldNote = `Your field (${field}) matches the preferred fields.`;
    else {
      fieldScore = 0.4;
      fieldNote = `Preferred fields are ${join(fields)}; your field (${field || 'not given'}) may not be directly relevant.`;
    }
  }

  const strengths = [];
  const gaps = [];
  if (deficit <= 0) strengths.push(`Your ${labelOf(EDUCATION_LEVELS, level)} meets the ${labelOf(EDUCATION_LEVELS, req.minLevel)} requirement.`);
  else gaps.push({ text: `Role requires ${labelOf(EDUCATION_LEVELS, req.minLevel)}; your highest level is ${labelOf(EDUCATION_LEVELS, level)}.`, critical: deficit >= 2 });
  if (fields.length) (fieldScore === 1 ? strengths : gaps).push(fieldScore === 1 ? fieldNote : { text: fieldNote, critical: false });

  const score = 0.7 * levelScore + 0.3 * fieldScore;
  return { score, status: statusFromScore(score), detail: `Level ${deficit <= 0 ? 'met' : 'below requirement'}; field ${fieldScore === 1 ? 'relevant' : 'not clearly relevant'}.`, strengths, gaps };
}

/* ---------------------------------------------------------------- location */
function locationFactor(profile, opp) {
  const prefs = (profile.preferredLocations || []).map(norm);
  if (!prefs.length) return unknown('No preferred locations were provided.');
  const loc = opp.location || {};
  const country = loc.country || '';
  const place = [loc.city, country].filter(Boolean).join(', ');

  if (prefs.includes(norm(country))) {
    return { score: 1, status: 'met', detail: `${country} is a preferred country.`, strengths: [`Located in ${place}, one of your preferred countries.`], gaps: [] };
  }
  const region = Object.keys(REGIONS).find((r) => prefs.includes(norm(r)) && REGIONS[r].map(norm).includes(norm(country)));
  if (region) {
    return { score: 0.8, status: 'met', detail: `${country} is in your preferred region (${region}).`, strengths: [`${country} is in ${region}, a region you selected.`], gaps: [] };
  }
  if (loc.remote && profile.openToRemote) {
    return { score: 0.6, status: 'partial', detail: 'Remote role; employer based outside preferred countries.', strengths: [`Remote-friendly role, which fits your openness to remote work.`], gaps: [{ text: `Employer is based in ${country}, which is not in your preferred locations; remote eligibility may be limited to that country.`, critical: false }] };
  }
  return { score: 0.1, status: 'gap', detail: `${country} is not in your preferred locations.`, strengths: [], gaps: [{ text: `Located in ${place}, outside your preferred locations.`, critical: false }] };
}

/* ---------------------------------------------------------------- language */
function languageFactor(profile, opp) {
  const mine = profile.languages || [];
  const reqs = opp.languages || [];
  if (!mine.length) return unknown('No languages were provided, so language fit could not be assessed.');
  if (!reqs.length) return { score: 1, status: 'met', detail: 'No language requirement stated.', strengths: [], gaps: [] };

  const myRank = (name) => {
    const m = mine.find((l) => norm(l.name) === norm(name));
    return m ? rankOf(LANGUAGE_LEVELS, m.level) : 0;
  };
  const strengths = [];
  const gaps = [];
  const requiredScores = [];

  reqs.forEach((r) => {
    const need = rankOf(LANGUAGE_LEVELS, r.minLevel);
    const have = myRank(r.name);
    const deficit = need - have;
    const needLabel = `${r.name} (${labelOf(LANGUAGE_LEVELS, r.minLevel)})`;
    if (r.required) {
      const s = deficit <= 0 ? 1 : deficit === 1 ? 0.5 : 0;
      requiredScores.push(s);
      if (deficit <= 0) strengths.push(`You meet the required ${needLabel}.`);
      else if (have === 0) gaps.push({ text: `Required language not listed on your profile: ${needLabel}.`, critical: true });
      else gaps.push({ text: `Required ${needLabel}; your level is ${labelOf(LANGUAGE_LEVELS, mine.find((l) => norm(l.name) === norm(r.name)).level)}.`, critical: deficit >= 2 });
    } else if (deficit <= 0) strengths.push(`Bonus: you meet the optional ${needLabel}.`);
    else gaps.push({ text: `${needLabel} is an asset but not required.`, critical: false });
  });

  if (!requiredScores.length) return { score: 1, status: 'met', detail: 'No mandatory language requirement.', strengths, gaps };
  const score = Math.min(...requiredScores);
  return { score, status: statusFromScore(score), detail: `Weakest required language scores ${Math.round(score * 100)}%.`, strengths, gaps };
}

/* --------------------------------------------------------------- interests */
function interestsFactor(profile, opp) {
  const interests = profile.careerInterests || [];
  if (!interests.length) return unknown('No career interests were provided.');
  const tags = (opp.domainTags || []).map(norm);
  const pool = new Set([...tags.flatMap(tokens), ...tokens(opp.title || '')]);

  let best = 0;
  let bestInterest = null;
  interests.forEach((i) => {
    const exact = tags.includes(norm(i)) || norm(opp.title || '').includes(norm(i));
    const toks = tokens(i);
    const coverage = toks.length ? toks.filter((t) => pool.has(t)).length / toks.length : 0;
    const s = exact ? 1 : coverage * 0.8;
    if (s > best) {
      best = s;
      bestInterest = i;
    }
  });

  if (best >= 0.5) {
    return { score: best, status: statusFromScore(best), detail: `Best overlap with your interest "${bestInterest}".`, strengths: [`Aligns with your interest in ${bestInterest}.`], gaps: [] };
  }
  return { score: best, status: 'gap', detail: 'Little overlap with your stated interests.', strengths: [], gaps: [{ text: `Role focus (${join(opp.domainTags || [])}) does not clearly align with your stated interests.`, critical: false }] };
}

/* ------------------------------------------------------------- eligibility */
/**
 * Eligibility is NOT a weighted score. It produces flags with a severity:
 *   critical -> known blocker (caps the score)
 *   verify   -> information missing / self-declared; MUST be verified, never assumed OK
 *   info     -> context for the reader
 * Nothing here is a legal determination.
 */
function eligibilityCheck(profile, opp) {
  const e = opp.eligibility || {};
  const country = (opp.location && opp.location.country) || 'this country';
  const flags = [];

  if (e.workAuthorisationRequired) {
    const wa = profile.workAuthorisation || { status: 'unknown', countries: [] };
    const authorisedHere = wa.status === 'authorised' && (wa.countries || []).map(norm).includes(norm(country));
    if (wa.status === 'unknown' || !wa.status) {
      flags.push({ code: 'WORK_AUTH_UNKNOWN', severity: 'verify', message: `Work authorisation for ${country} is required and your status is not specified. Requires verification; this is not a legal determination.` });
    } else if (authorisedHere) {
      flags.push({ code: 'WORK_AUTH_SELF_DECLARED', severity: 'info', message: `You stated you are authorised to work in ${country}. This is self-declared and unverified; the employer will confirm.` });
    } else if (e.sponsorshipOffered) {
      flags.push({ code: 'WORK_AUTH_SPONSORSHIP', severity: 'verify', message: `You indicated you would need authorisation for ${country}. The employer says sponsorship may be available; eligibility must be verified with the employer and official sources.` });
    } else {
      flags.push({ code: 'WORK_AUTH_BLOCKED', severity: 'critical', message: `Role requires existing work authorisation for ${country} and does not mention sponsorship; based on what you entered, this is likely a blocker. Verify with the employer.` });
    }
  }

  if (e.studentOnly) {
    if (profile.isStudent === true) flags.push({ code: 'STUDENT_OK', severity: 'info', message: 'You stated you are currently enrolled; the role is open to current students (proof of enrolment is usually required).' });
    else if (profile.isStudent === false) flags.push({ code: 'STUDENT_REQUIRED', severity: 'critical', message: 'This role is open to currently enrolled students only, and your profile says you are not enrolled.' });
    else flags.push({ code: 'STUDENT_UNKNOWN', severity: 'verify', message: 'This role is open to currently enrolled students only; your enrolment status is not specified. Requires verification.' });
  }

  if (e.notes) flags.push({ code: 'EMPLOYER_NOTE', severity: 'info', message: `Employer note: ${e.notes}` });

  const status = flags.some((f) => f.severity === 'critical') ? 'blocked' : flags.some((f) => f.severity === 'verify') ? 'verify' : 'clear';
  return { status, flags };
}

module.exports = { skillsFactor, experienceFactor, educationFactor, locationFactor, languageFactor, interestsFactor, eligibilityCheck };
