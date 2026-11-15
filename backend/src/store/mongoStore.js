const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');
const Profile = require('../models/Profile');
const Shortlist = require('../models/Shortlist');

const validId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);

/** Strip Mongo internals so the API always returns plain `id` fields. */
const plainProfile = (doc) => {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc.toObject ? doc.toObject() : doc;
  return { id: String(_id), ...rest };
};
const plainOpp = (doc) => {
  if (!doc) return null;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc.toObject ? doc.toObject() : doc;
  return rest;
};

function createMongoStore() {
  return {
    mode: 'mongodb',
    async close() {
      await mongoose.disconnect();
    },
    async seedOpportunities(list) {
      await Opportunity.bulkWrite(
        list.map((o) => ({ replaceOne: { filter: { id: o.id }, replacement: o, upsert: true } }))
      );
      return Opportunity.countDocuments();
    },
    countOpportunities: () => Opportunity.countDocuments(),
    async listOpportunities() {
      return (await Opportunity.find().sort({ id: 1 }).lean()).map(plainOpp);
    },
    async getOpportunity(id) {
      return plainOpp(await Opportunity.findOne({ id: String(id) }).lean());
    },
    async createProfile(data) {
      return plainProfile(await Profile.create(data));
    },
    async getProfile(id) {
      if (!validId(id)) return null;
      return plainProfile(await Profile.findById(id).lean());
    },
    async updateProfile(id, data) {
      if (!validId(id)) return null;
      return plainProfile(await Profile.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean());
    },
    async listShortlist(profileId) {
      if (!validId(profileId)) return [];
      const rows = await Shortlist.find({ profileId }).sort({ createdAt: -1 }).lean();
      return rows.map((r) => ({ profileId: String(r.profileId), opportunityId: r.opportunityId, note: r.note, createdAt: r.createdAt }));
    },
    async addShortlist(profileId, opportunityId, note = '') {
      const r = await Shortlist.findOneAndUpdate(
        { profileId, opportunityId },
        { $set: { note } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      return { profileId: String(r.profileId), opportunityId: r.opportunityId, note: r.note, createdAt: r.createdAt };
    },
    async removeShortlist(profileId, opportunityId) {
      if (!validId(profileId)) return false;
      const r = await Shortlist.deleteOne({ profileId, opportunityId });
      return r.deletedCount > 0;
    },
  };
}

module.exports = { createMongoStore };
