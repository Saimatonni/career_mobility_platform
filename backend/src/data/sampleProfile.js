/** Fictional sample candidate from the assessment brief. Work authorisation is deliberately "unknown". */
module.exports = {
  displayName: 'Sample Candidate',
  education: { level: 'bachelor', field: 'Business Administration' },
  yearsExperience: 2,
  experienceSummary: 'Business operations and project support.',
  skills: ['Excel', 'Research', 'Stakeholder communication', 'Reporting', 'Project coordination'],
  languages: [
    { name: 'Bengali', level: 'native' },
    { name: 'English', level: 'professional' },
  ],
  preferredLocations: ['Germany', 'Canada', 'Singapore'],
  openToRemote: true,
  careerInterests: ['Programme support', 'Business operations', 'Project coordination'],
  workAuthorisation: { status: 'unknown', countries: [] },
  isStudent: null,
};
