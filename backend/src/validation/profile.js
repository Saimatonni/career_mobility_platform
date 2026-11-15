const { EDUCATION_LEVELS, LANGUAGE_LEVELS, WORK_AUTH_STATUSES } = require('../utils/reference');
const { clean, cleanList } = require('../utils/text');

const EDU = EDUCATION_LEVELS.map((x) => x.value);
const LANG = LANGUAGE_LEVELS.map((x) => x.value);
const AUTH = WORK_AUTH_STATUSES.map((x) => x.value);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Validate + sanitise a profile payload.
 * Returns { valid, errors, value }. `errors` maps a field path to a human-readable message.
 * Unknown fields are dropped (never passed to the database) which also blocks operator injection.
 */
function validateProfile(input) {
  const errors = {};
  if (!isPlainObject(input)) {
    return { valid: false, errors: { _form: 'Request body must be a JSON object.' }, value: null };
  }

  const value = {};

  // displayName (optional, deliberately NOT a real-name field)
  value.displayName = clean(input.displayName).slice(0, 60);
  if (input.displayName !== undefined && typeof input.displayName !== 'string') {
    errors.displayName = 'Display name must be text.';
  }

  // education
  const edu = isPlainObject(input.education) ? input.education : {};
  const level = typeof edu.level === 'string' ? edu.level : '';
  const field = clean(edu.field).slice(0, 100);
  if (!EDU.includes(level)) errors['education.level'] = 'Choose your highest completed education level.';
  if (!field) errors['education.field'] = 'Enter your field of study (e.g. Business Administration).';
  value.education = { level, field };

  // experience
  const years = input.yearsExperience === '' || input.yearsExperience === null ? NaN : Number(input.yearsExperience);
  if (!Number.isFinite(years) || years < 0 || years > 50) {
    errors.yearsExperience = 'Enter years of relevant experience as a number between 0 and 50.';
  }
  value.yearsExperience = Number.isFinite(years) ? Math.round(years * 10) / 10 : 0;
  value.experienceSummary = clean(input.experienceSummary).slice(0, 300);

  // skills
  const skills = cleanList(input.skills, 50);
  if (skills.length < 1) errors.skills = 'Add at least one skill.';
  if (skills.length > 40) errors.skills = 'Please list at most 40 skills.';
  value.skills = skills.slice(0, 40);

  // languages
  const langs = [];
  const seenLang = new Set();
  if (!Array.isArray(input.languages) || input.languages.length < 1) {
    errors.languages = 'Add at least one language and your level.';
  } else {
    input.languages.slice(0, 10).forEach((l, i) => {
      const name = clean(l && l.name).slice(0, 40);
      const lvl = l && typeof l.level === 'string' ? l.level : '';
      if (!name) errors[`languages.${i}.name`] = 'Language name is required.';
      else if (!LANG.includes(lvl)) errors[`languages.${i}.level`] = `Choose your level for ${name}.`;
      else if (seenLang.has(name.toLowerCase())) errors[`languages.${i}.name`] = `${name} is listed twice.`;
      else {
        seenLang.add(name.toLowerCase());
        langs.push({ name, level: lvl });
      }
    });
  }
  value.languages = langs;

  // preferred locations
  const locs = cleanList(input.preferredLocations, 60);
  if (locs.length < 1) errors.preferredLocations = 'Add at least one preferred country or region.';
  if (locs.length > 10) errors.preferredLocations = 'Please list at most 10 locations.';
  value.preferredLocations = locs.slice(0, 10);
  value.openToRemote = input.openToRemote === true || input.openToRemote === 'true';

  // career interests
  const interests = cleanList(input.careerInterests, 60);
  if (interests.length < 1) errors.careerInterests = 'Add at least one career interest.';
  if (interests.length > 10) errors.careerInterests = 'Please list at most 10 interests.';
  value.careerInterests = interests.slice(0, 10);

  // work authorisation (self-declared, unverified)
  const wa = isPlainObject(input.workAuthorisation) ? input.workAuthorisation : {};
  const status = wa.status === undefined || wa.status === '' ? 'unknown' : wa.status;
  if (!AUTH.includes(status)) errors['workAuthorisation.status'] = 'Invalid work authorisation option.';
  const countries = cleanList(wa.countries, 60).slice(0, 10);
  if (status === 'authorised' && countries.length < 1) {
    errors['workAuthorisation.countries'] = 'List the countries where you are authorised to work, or choose "Not specified".';
  }
  value.workAuthorisation = { status: AUTH.includes(status) ? status : 'unknown', countries: status === 'authorised' ? countries : [] };

  // student status: true | false | null (unknown)
  if (input.isStudent === true || input.isStudent === 'true') value.isStudent = true;
  else if (input.isStudent === false || input.isStudent === 'false') value.isStudent = false;
  else value.isStudent = null;

  return { valid: Object.keys(errors).length === 0, errors, value };
}

module.exports = { validateProfile };
