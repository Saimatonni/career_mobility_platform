import { useEffect, useState } from 'react';
import TagInput from '../components/TagInput.jsx';
import Banner from '../components/Banner.jsx';
import Icon from '../components/Icon.jsx';
import { api, ApiError } from '../api.js';

const blank = {
  displayName: '',
  education: { level: '', field: '' },
  yearsExperience: '',
  experienceSummary: '',
  skills: [],
  languages: [{ name: '', level: '' }],
  preferredLocations: [],
  openToRemote: false,
  careerInterests: [],
  workAuthorisation: { status: 'unknown', countries: [] },
  isStudent: null,
};

const toForm = (p) => ({
  ...blank,
  ...p,
  education: { ...blank.education, ...(p.education || {}) },
  yearsExperience: p.yearsExperience ?? '',
  languages: p.languages && p.languages.length ? p.languages.map((l) => ({ ...l })) : blank.languages,
  workAuthorisation: { status: 'unknown', countries: [], ...(p.workAuthorisation || {}) },
  isStudent: p.isStudent ?? null,
});

/** Mirrors the server rules for instant feedback. The server remains the source of truth. */
function validate(f) {
  const e = {};
  if (!f.education.level) e['education.level'] = 'Choose your highest completed education level.';
  if (!f.education.field.trim()) e['education.field'] = 'Enter your field of study.';
  const y = Number(f.yearsExperience);
  if (f.yearsExperience === '' || !Number.isFinite(y) || y < 0 || y > 50) e.yearsExperience = 'Enter a number between 0 and 50.';
  if (!f.skills.length) e.skills = 'Add at least one skill.';
  const names = new Set();
  f.languages.forEach((l, i) => {
    if (!l.name.trim()) e[`languages.${i}.name`] = 'Language name is required.';
    else if (!l.level) e[`languages.${i}.level`] = `Choose your level for ${l.name}.`;
    else if (names.has(l.name.trim().toLowerCase())) e[`languages.${i}.name`] = `${l.name} is listed twice.`;
    names.add(l.name.trim().toLowerCase());
  });
  if (!f.preferredLocations.length) e.preferredLocations = 'Add at least one preferred country or region.';
  if (!f.careerInterests.length) e.careerInterests = 'Add at least one career interest.';
  if (f.workAuthorisation.status === 'authorised' && !f.workAuthorisation.countries.length) {
    e['workAuthorisation.countries'] = 'List the countries where you are authorised to work, or choose "Not specified".';
  }
  return e;
}

export default function ProfilePage({ meta, profile, profileId, onSaved }) {
  const [form, setForm] = useState(profile ? toForm(profile) : blank);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(toForm(profile));
  }, [profile]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const err = (k) => errors[k];

  const loadSample = async () => {
    try {
      setForm(toForm(await api.sampleProfile()));
      setErrors({});
      setBanner({ kind: 'info', text: 'Sample profile loaded (fictional). Work authorisation is deliberately "Not specified". Review it and click Save.' });
    } catch (e) {
      setBanner({ kind: 'error', text: e.message });
    }
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setBanner(null);
    const local = validate(form);
    setErrors(local);
    if (Object.keys(local).length) {
      setBanner({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }
    const payload = {
      ...form,
      yearsExperience: Number(form.yearsExperience),
      languages: form.languages.map((l) => ({ name: l.name.trim(), level: l.level })),
    };
    setSaving(true);
    try {
      let saved;
      try {
        saved = profileId ? await api.updateProfile(profileId, payload) : await api.createProfile(payload);
      } catch (e) {
        // Stored profile vanished (e.g. memory-mode server restarted): create a fresh one.
        if (e instanceof ApiError && e.status === 404 && profileId) saved = await api.createProfile(payload);
        else throw e;
      }
      onSaved(saved);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setErrors(e.details);
        setBanner({ kind: 'error', text: e.message });
      } else setBanner({ kind: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const setLang = (i, patch) => set({ languages: form.languages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const eduOptions = meta?.educationLevels || [];
  const langOptions = meta?.languageLevels || [];
  const countries = [...(meta?.countries || []), ...(meta?.regions || [])];

  return (
    <form className="page page-narrow profile-form" onSubmit={submit} noValidate>
      <div className="page-head">
        <div>
          <h1>{profileId ? 'Edit your career profile' : 'Create your career profile'}</h1>
          <p className="muted">Tell us about yourself so we can rank international opportunities and explain every match. Do not enter real personal data in this prototype.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadSample}>
          Load sample profile
        </button>
      </div>

      <Banner kind={banner?.kind} onClose={() => setBanner(null)}>
        {banner?.text}
      </Banner>

      <fieldset className="card">
        <legend>About you</legend>
        <div className="field">
          <label htmlFor="displayName">Display name (optional, a nickname is fine)</label>
          <input id="displayName" maxLength={60} value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className={`field ${err('education.level') ? 'has-error' : ''}`}>
            <label htmlFor="eduLevel">Highest education level *</label>
            <select id="eduLevel" value={form.education.level} onChange={(e) => set({ education: { ...form.education, level: e.target.value } })}>
              <option value="">Select…</option>
              {eduOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {err('education.level') && <p className="error-text" role="alert">{err('education.level')}</p>}
          </div>
          <div className={`field ${err('education.field') ? 'has-error' : ''}`}>
            <label htmlFor="eduField">Field of study *</label>
            <input id="eduField" maxLength={100} placeholder="e.g. Business Administration" value={form.education.field} onChange={(e) => set({ education: { ...form.education, field: e.target.value } })} />
            {err('education.field') && <p className="error-text" role="alert">{err('education.field')}</p>}
          </div>
        </div>
        <div className="grid-2">
          <div className={`field ${err('yearsExperience') ? 'has-error' : ''}`}>
            <label htmlFor="years">Years of relevant work experience *</label>
            <input id="years" type="number" min="0" max="50" step="0.5" value={form.yearsExperience} onChange={(e) => set({ yearsExperience: e.target.value })} />
            {err('yearsExperience') && <p className="error-text" role="alert">{err('yearsExperience')}</p>}
          </div>
          <div className="field">
            <label htmlFor="expSummary">Experience summary (optional)</label>
            <input id="expSummary" maxLength={300} placeholder="e.g. Business operations and project support" value={form.experienceSummary} onChange={(e) => set({ experienceSummary: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="student">Are you currently enrolled as a student?</label>
          <select id="student" value={form.isStudent === null ? 'unknown' : form.isStudent ? 'yes' : 'no'} onChange={(e) => set({ isStudent: e.target.value === 'unknown' ? null : e.target.value === 'yes' })}>
            <option value="unknown">Prefer not to say / not specified</option>
            <option value="yes">Yes, currently enrolled</option>
            <option value="no">No</option>
          </select>
          <p className="hint">Some internships are only open to enrolled students. If not specified we flag it for verification.</p>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Skills & interests</legend>
        <TagInput id="skills" label="Skills *" values={form.skills} onChange={(skills) => set({ skills })} placeholder="Type a skill and press Enter (e.g. Excel)" error={err('skills')} hint="Press Enter or comma to add each skill." />
        <TagInput id="interests" label="Career interests *" values={form.careerInterests} onChange={(careerInterests) => set({ careerInterests })} max={10} placeholder="e.g. Programme support" error={err('careerInterests')} />
      </fieldset>

      <fieldset className="card">
        <legend>Languages</legend>
        {form.languages.map((l, i) => (
          <div className="grid-lang" key={i}>
            <div className={`field ${err(`languages.${i}.name`) ? 'has-error' : ''}`}>
              <label htmlFor={`lang-name-${i}`}>Language *</label>
              <input id={`lang-name-${i}`} maxLength={40} value={l.name} placeholder="e.g. English" onChange={(e) => setLang(i, { name: e.target.value })} />
              {err(`languages.${i}.name`) && <p className="error-text" role="alert">{err(`languages.${i}.name`)}</p>}
            </div>
            <div className={`field ${err(`languages.${i}.level`) ? 'has-error' : ''}`}>
              <label htmlFor={`lang-level-${i}`}>Level *</label>
              <select id={`lang-level-${i}`} value={l.level} onChange={(e) => setLang(i, { level: e.target.value })}>
                <option value="">Select…</option>
                {langOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {err(`languages.${i}.level`) && <p className="error-text" role="alert">{err(`languages.${i}.level`)}</p>}
            </div>
            <button type="button" className="btn btn-ghost" disabled={form.languages.length === 1} onClick={() => set({ languages: form.languages.filter((_, idx) => idx !== i) })} aria-label={`Remove language ${i + 1}`}>
              Remove
            </button>
          </div>
        ))}
        {err('languages') && <p className="error-text" role="alert">{err('languages')}</p>}
        <button type="button" className="btn btn-secondary" disabled={form.languages.length >= 10} onClick={() => set({ languages: [...form.languages, { name: '', level: '' }] })}>
          <Icon name="plus" size={15} />
          Add language
        </button>
      </fieldset>

      <fieldset className="card">
        <legend>Where do you want to work?</legend>
        <TagInput id="locations" label="Preferred countries or regions *" values={form.preferredLocations} onChange={(preferredLocations) => set({ preferredLocations })} max={10} suggestions={countries} placeholder="e.g. Germany, Canada, Europe" error={err('preferredLocations')} />
        <label className="check">
          <input type="checkbox" checked={form.openToRemote} onChange={(e) => set({ openToRemote: e.target.checked })} /> I am open to remote roles based in other countries
        </label>
      </fieldset>

      <fieldset className="card">
        <legend>Work authorisation (self-declared)</legend>
        <p className="hint">We never decide your visa or work-authorisation status. If you leave it as "Not specified", roles that require it are flagged <em>needs verification</em>.</p>
        <div className="field">
          <label htmlFor="waStatus">Status</label>
          <select id="waStatus" value={form.workAuthorisation.status} onChange={(e) => set({ workAuthorisation: { ...form.workAuthorisation, status: e.target.value } })}>
            {(meta?.workAuthStatuses || [{ value: 'unknown', label: 'Not specified / unknown' }]).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {form.workAuthorisation.status === 'authorised' && (
          <TagInput id="waCountries" label="Countries where you may work *" values={form.workAuthorisation.countries} onChange={(countries) => set({ workAuthorisation: { ...form.workAuthorisation, countries } })} max={10} suggestions={meta?.countries || []} placeholder="e.g. Canada" error={err('workAuthorisation.countries')} />
        )}
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? 'Saving…' : profileId ? 'Save & see matches' : 'Create profile & see matches'}
        </button>
      </div>
    </form>
  );
}
