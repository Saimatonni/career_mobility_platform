const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProfile } = require('../src/validation/profile');
const sample = require('../src/data/sampleProfile');

const clone = (o) => JSON.parse(JSON.stringify(o));

test('sample profile is valid and work authorisation stays "unknown"', () => {
  const r = validateProfile(sample);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.value.workAuthorisation.status, 'unknown');
  assert.equal(r.value.isStudent, null);
});

test('empty / non-object body is rejected', () => {
  assert.equal(validateProfile(null).valid, false);
  assert.equal(validateProfile([]).valid, false);
  assert.equal(validateProfile('x').valid, false);
});

test('missing required fields produce per-field errors', () => {
  const r = validateProfile({});
  assert.equal(r.valid, false);
  for (const k of ['education.level', 'education.field', 'yearsExperience', 'skills', 'languages', 'preferredLocations', 'careerInterests']) {
    assert.ok(r.errors[k], `expected error for ${k}`);
  }
});

test('invalid enums, ranges and duplicate languages are rejected', () => {
  const p = clone(sample);
  p.education.level = 'wizard';
  p.yearsExperience = 80;
  p.languages = [{ name: 'English', level: 'professional' }, { name: 'english', level: 'native' }, { name: 'French', level: 'godlike' }];
  const r = validateProfile(p);
  assert.ok(r.errors['education.level']);
  assert.ok(r.errors.yearsExperience);
  assert.ok(r.errors['languages.1.name']);
  assert.ok(r.errors['languages.2.level']);
});

test('"authorised" without countries is rejected; unknown clears countries', () => {
  const p = clone(sample);
  p.workAuthorisation = { status: 'authorised', countries: [] };
  assert.ok(validateProfile(p).errors['workAuthorisation.countries']);
  p.workAuthorisation = { status: 'unknown', countries: ['Canada'] };
  assert.deepEqual(validateProfile(p).value.workAuthorisation, { status: 'unknown', countries: [] });
});

test('lists are trimmed and de-duplicated; unknown fields are dropped', () => {
  const p = clone(sample);
  p.skills = ['  Excel ', 'excel', 'Reporting', '', '   '];
  p.$where = 'sleep(1000)';
  p.role = 'admin';
  const r = validateProfile(p);
  assert.deepEqual(r.value.skills, ['Excel', 'Reporting']);
  assert.equal(r.value.$where, undefined);
  assert.equal(r.value.role, undefined);
});

test('operator-injection style values cannot reach the database as objects', () => {
  const p = clone(sample);
  p.education = { level: { $ne: null }, field: { $gt: '' } };
  p.skills = [{ $ne: 1 }, 'Excel'];
  const r = validateProfile(p);
  assert.equal(r.valid, false);
  assert.ok(typeof r.value.education.level === 'string');
  assert.ok(r.value.skills.every((s) => typeof s === 'string'));
});

test('control characters are stripped from text', () => {
  const p = clone(sample);
  p.displayName = 'Sam\u0000\u0007ple';
  assert.equal(validateProfile(p).value.displayName, 'Sam ple');
});
