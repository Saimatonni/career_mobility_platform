/**
 * End-to-end API test (HTTP) using the in-memory store, so it needs NO database.
 * Requires `npm install` first (uses express). Run: npm test
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createMemoryStore } = require('../src/store/memoryStore');
const seed = require('../src/data/opportunities');
const sample = require('../src/data/sampleProfile');

let server, base, profileId;

test.before(async () => {
  const store = createMemoryStore();
  await store.seedOpportunities(seed);
  server = createApp(store, { rateLimit: 10000 }).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};

test('rejects an invalid profile with field-level errors (422)', async () => {
  const r = await call('POST', '/profiles', { skills: [] });
  assert.equal(r.status, 422);
  assert.ok(r.body.error.details.skills);
});

test('profile -> ranked matches -> detail -> shortlist -> remove', async () => {
  const created = await call('POST', '/profiles', sample);
  assert.equal(created.status, 201);
  profileId = created.body.id;

  const matches = await call('GET', `/profiles/${profileId}/matches`);
  assert.equal(matches.status, 200);
  assert.equal(matches.body.count, 12);
  assert.equal(matches.body.items[0].rank, 1);

  const detail = await call('GET', `/profiles/${profileId}/matches/opp-003`);
  assert.equal(detail.body.match.tier, 'critical_gap');

  assert.equal((await call('PUT', `/profiles/${profileId}/shortlist/opp-001`, { note: 'first choice' })).status, 200);
  const list = await call('GET', `/profiles/${profileId}/shortlist`);
  assert.equal(list.body.count, 1);
  assert.equal(list.body.items[0].note, 'first choice');

  assert.equal((await call('DELETE', `/profiles/${profileId}/shortlist/opp-001`)).body.shortlisted, false);
  assert.equal((await call('GET', `/profiles/${profileId}/shortlist`)).body.count, 0);
});

test('404 for unknown profile / opportunity / route, 400 for malformed JSON', async () => {
  assert.equal((await call('GET', '/profiles/does-not-exist/matches')).status, 404);
  assert.equal((await call('GET', `/profiles/${profileId}/matches/opp-999`)).status, 404);
  assert.equal((await call('GET', '/nope')).status, 404);
  const res = await fetch(base + '/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  assert.equal(res.status, 400);
});
