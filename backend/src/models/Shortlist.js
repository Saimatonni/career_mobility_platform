const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    opportunityId: { type: String, required: true },
    note: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);
shortlistSchema.index({ profileId: 1, opportunityId: 1 }, { unique: true });

module.exports = mongoose.models.Shortlist || mongoose.model('Shortlist', shortlistSchema);
