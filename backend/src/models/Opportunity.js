const mongoose = require('mongoose');
const { EXPERIENCE_LEVELS, EDUCATION_LEVELS, LANGUAGE_LEVELS } = require('../utils/reference');

const languageReq = new mongoose.Schema(
  {
    name: { type: String, required: true },
    minLevel: { type: String, enum: LANGUAGE_LEVELS.map((l) => l.value), required: true },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const opportunitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // stable public id, e.g. "opp-001"
    title: { type: String, required: true },
    organisation: { type: String, required: true },
    type: { type: String, enum: ['job', 'internship'], required: true },
    location: {
      city: String,
      country: { type: String, required: true },
      remote: { type: Boolean, default: false },
    },
    domainTags: [String],
    requiredSkills: [String],
    preferredSkills: [String],
    experience: {
      level: { type: String, enum: EXPERIENCE_LEVELS },
      minYears: Number,
      maxYears: Number,
    },
    education: {
      minLevel: { type: String, enum: EDUCATION_LEVELS.map((l) => l.value) },
      fields: [String],
    },
    languages: [languageReq],
    eligibility: {
      workAuthorisationRequired: { type: Boolean, default: false },
      sponsorshipOffered: { type: Boolean, default: false },
      studentOnly: { type: Boolean, default: false },
      notes: String,
    },
    summary: String,
    responsibilities: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Opportunity || mongoose.model('Opportunity', opportunitySchema);
