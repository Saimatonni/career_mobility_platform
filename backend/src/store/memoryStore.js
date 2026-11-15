const crypto = require('crypto');

/** In-memory implementation used as a fallback / mock mode when MongoDB is unavailable. */
function createMemoryStore() {
  const opportunities = new Map();
  const profiles = new Map();
  const shortlists = new Map(); // key: `${profileId}:${opportunityId}`

  return {
    mode: 'memory',
    async close() {},
    async seedOpportunities(list) {
      list.forEach((o) => opportunities.set(o.id, structuredClone(o)));
      return opportunities.size;
    },
    async countOpportunities() {
      return opportunities.size;
    },
    async listOpportunities() {
      return [...opportunities.values()].map((o) => structuredClone(o));
    },
    async getOpportunity(id) {
      const o = opportunities.get(id);
      return o ? structuredClone(o) : null;
    },
    async createProfile(data) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const doc = { id, ...structuredClone(data), createdAt: now, updatedAt: now };
      profiles.set(id, doc);
      return structuredClone(doc);
    },
    async getProfile(id) {
      const p = profiles.get(id);
      return p ? structuredClone(p) : null;
    },
    async updateProfile(id, data) {
      const p = profiles.get(id);
      if (!p) return null;
      const updated = { ...p, ...structuredClone(data), id, updatedAt: new Date().toISOString() };
      profiles.set(id, updated);
      return structuredClone(updated);
    },
    async listShortlist(profileId) {
      return [...shortlists.values()].filter((s) => s.profileId === profileId).map((s) => ({ ...s }));
    },
    async addShortlist(profileId, opportunityId, note = '') {
      const key = `${profileId}:${opportunityId}`;
      const existing = shortlists.get(key);
      const item = { profileId, opportunityId, note, createdAt: existing ? existing.createdAt : new Date().toISOString() };
      shortlists.set(key, item); // idempotent upsert
      return { ...item };
    },
    async removeShortlist(profileId, opportunityId) {
      return shortlists.delete(`${profileId}:${opportunityId}`);
    },
  };
}

module.exports = { createMemoryStore };
