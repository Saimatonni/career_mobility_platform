const express = require('express');
const { HttpError, asyncHandler } = require('../middleware/errors');
const { validateProfile } = require('../validation/profile');
const { matchOpportunity, rankOpportunities } = require('../services/matching/engine');
const ref = require('../utils/reference');
const sampleProfile = require('../data/sampleProfile');
const { clean } = require('../utils/text');

const OPP_ID = /^[a-z0-9-]{1,40}$/i;

function buildRouter(store) {
  const router = express.Router();

  const loadProfile = async (id) => {
    const profile = await store.getProfile(String(id));
    if (!profile) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile not found. Create a profile first.');
    return profile;
  };
  const loadOpportunity = async (id) => {
    if (!OPP_ID.test(String(id))) throw new HttpError(400, 'INVALID_ID', 'Invalid opportunity id.');
    const opp = await store.getOpportunity(String(id));
    if (!opp) throw new HttpError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.');
    return opp;
  };

  /* ---------- meta ---------- */
  router.get('/health', (req, res) => res.json({ status: 'ok', storage: store.mode }));

  router.get('/meta', (req, res) =>
    res.json({
      educationLevels: ref.EDUCATION_LEVELS,
      languageLevels: ref.LANGUAGE_LEVELS,
      workAuthStatuses: ref.WORK_AUTH_STATUSES,
      countries: ref.COUNTRIES,
      regions: Object.keys(ref.REGIONS),
      storage: store.mode,
    })
  );

  router.get('/sample-profile', (req, res) => res.json(sampleProfile));

  /* ---------- profiles ---------- */
  router.post(
    '/profiles',
    asyncHandler(async (req, res) => {
      const { valid, errors, value } = validateProfile(req.body);
      if (!valid) throw new HttpError(422, 'VALIDATION_FAILED', 'Please fix the highlighted fields.', errors);
      res.status(201).json(await store.createProfile(value));
    })
  );

  router.get('/profiles/:id', asyncHandler(async (req, res) => res.json(await loadProfile(req.params.id))));

  router.put(
    '/profiles/:id',
    asyncHandler(async (req, res) => {
      await loadProfile(req.params.id);
      const { valid, errors, value } = validateProfile(req.body);
      if (!valid) throw new HttpError(422, 'VALIDATION_FAILED', 'Please fix the highlighted fields.', errors);
      res.json(await store.updateProfile(req.params.id, value));
    })
  );

  /* ---------- opportunities ---------- */
  router.get('/opportunities', asyncHandler(async (req, res) => res.json(await store.listOpportunities())));
  router.get('/opportunities/:id', asyncHandler(async (req, res) => res.json(await loadOpportunity(req.params.id))));

  /* ---------- matching ---------- */
  router.get(
    '/profiles/:id/matches',
    asyncHandler(async (req, res) => {
      const profile = await loadProfile(req.params.id);
      const [opps, shortlist] = await Promise.all([store.listOpportunities(), store.listShortlist(profile.id)]);
      const saved = new Set(shortlist.map((s) => s.opportunityId));
      const items = rankOpportunities(profile, opps).map((r) => ({ ...r, shortlisted: saved.has(r.opportunity.id) }));
      res.json({ profileId: profile.id, count: items.length, items });
    })
  );

  router.get(
    '/profiles/:id/matches/:opportunityId',
    asyncHandler(async (req, res) => {
      const profile = await loadProfile(req.params.id);
      const opp = await loadOpportunity(req.params.opportunityId);
      const shortlist = await store.listShortlist(profile.id);
      const entry = shortlist.find((s) => s.opportunityId === opp.id);
      res.json({ opportunity: opp, match: matchOpportunity(profile, opp), shortlisted: Boolean(entry), note: entry ? entry.note : '' });
    })
  );

  /* ---------- shortlist ---------- */
  router.get(
    '/profiles/:id/shortlist',
    asyncHandler(async (req, res) => {
      const profile = await loadProfile(req.params.id);
      const [rows, opps] = await Promise.all([store.listShortlist(profile.id), store.listOpportunities()]);
      const byId = new Map(opps.map((o) => [o.id, o]));
      const items = rows
        .filter((r) => byId.has(r.opportunityId))
        .map((r) => ({ opportunity: byId.get(r.opportunityId), match: matchOpportunity(profile, byId.get(r.opportunityId)), note: r.note, savedAt: r.createdAt }));
      res.json({ count: items.length, items });
    })
  );

  router.put(
    '/profiles/:id/shortlist/:opportunityId',
    asyncHandler(async (req, res) => {
      const profile = await loadProfile(req.params.id);
      const opp = await loadOpportunity(req.params.opportunityId);
      const note = clean(req.body && req.body.note).slice(0, 300);
      res.json({ shortlisted: true, item: await store.addShortlist(profile.id, opp.id, note) });
    })
  );

  router.delete(
    '/profiles/:id/shortlist/:opportunityId',
    asyncHandler(async (req, res) => {
      const profile = await loadProfile(req.params.id);
      if (!OPP_ID.test(String(req.params.opportunityId))) throw new HttpError(400, 'INVALID_ID', 'Invalid opportunity id.');
      await store.removeShortlist(profile.id, req.params.opportunityId);
      res.json({ shortlisted: false });
    })
  );

  return router;
}

module.exports = { buildRouter };
