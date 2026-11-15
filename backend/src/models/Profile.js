const mongoose = require('mongoose');
const { EDUCATION_LEVELS, LANGUAGE_LEVELS, WORK_AUTH_STATUSES } = require('../utils/reference');

const profileSchema = new mongoose.Schema(
  {
    // Intentionally no real name / email / phone: this prototype stores no direct identifiers.
    displayName: { type: String, default: '', maxlength: 60 },
    education: {
      level: { type: String, enum: EDUCATION_LEVELS.map((l) => l.value), required: true },
      field: { type: String, required: true, maxlength: 100 },
    },
    yearsExperience: { type: Number, min: 0, max: 50, required: true },
    experienceSummary: { type: String, default: '', maxlength: 300 },
    skills: { type: [String], default: [] },
    languages: [
      {
        _id: false,
        name: { type: String, required: true },
        level: { type: String, enum: LANGUAGE_LEVELS.map((l) => l.value), required: true },
      },
    ],
    preferredLocations: { type: [String], default: [] },
    openToRemote: { type: Boolean, default: false },
    careerInterests: { type: [String], default: [] },
    workAuthorisation: {
      status: { type: String, enum: WORK_AUTH_STATUSES.map((s) => s.value), default: 'unknown' },
      countries: { type: [String], default: [] },
    },
    isStudent: { type: Boolean, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
