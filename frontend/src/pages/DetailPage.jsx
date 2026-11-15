import { useEffect, useState } from 'react';
import ScoreBadge from '../components/ScoreBadge.jsx';
import FactorBars from '../components/FactorBars.jsx';
import EligibilityFlags from '../components/EligibilityFlags.jsx';
import Banner from '../components/Banner.jsx';
import Icon from '../components/Icon.jsx';
import OpportunityMeta from '../components/OpportunityMeta.jsx';
import { api } from '../api.js';
import { go } from '../utils/useHashRoute.js';
import { expOf, tierClass } from '../utils/format.js';

export default function DetailPage({ profileId, oppId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api
      .matchDetail(profileId, oppId)
      .then((d) => {
        setData(d);
        setNote(d.note || '');
      })
      .catch((e) => setError(e.status === 404 ? 'This opportunity could not be found.' : e.message));
  }, [profileId, oppId]);

  const save = async () => {
    setBusy(true);
    setSaved(null);
    try {
      await api.addShortlist(profileId, oppId, note);
      setData((d) => ({ ...d, shortlisted: true, note }));
      setSaved('Saved to your shortlist.');
    } catch (e) {
      setError(`Could not save: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setSaved(null);
    try {
      await api.removeShortlist(profileId, oppId);
      setData((d) => ({ ...d, shortlisted: false, note: '' }));
      setNote('');
      setSaved('Removed from your shortlist.');
    } catch (e) {
      setError(`Could not remove: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data)
    return (
      <div className="page">
        <Banner kind="error">{error}</Banner>
        <button type="button" className="btn btn-secondary" onClick={() => go('/matches')}><Icon name="back" size={15} />Back to matches</button>
      </div>
    );
  if (!data) return <div className="page"><p className="loading">Loading opportunity…</p></div>;

  const { opportunity: o, match: m, shortlisted } = data;
  const critical = m.gaps.filter((g) => g.critical);
  const otherGaps = m.gaps.filter((g) => !g.critical);

  return (
    <div className="page detail">
      <button type="button" className="btn btn-ghost back" onClick={() => go('/matches')}><Icon name="back" size={15} />Back to matches</button>
      <Banner kind="error" onClose={() => setError(null)}>{error}</Banner>

      <header className={`card detail-head ${tierClass(m.tier)}`}>
        <div>
          <h1>{o.title}</h1>
          <OpportunityMeta opportunity={o} />
          <p className="summary-line">{m.summary}</p>
        </div>
        <ScoreBadge score={m.score} tier={m.tier} label={m.tierLabel} size="lg" />
      </header>

      <div className="two-col">
        <section className="card">
          <h2>Why this match</h2>
          {critical.length > 0 && (
            <>
              <h3 className="crit">Critical gaps</h3>
              <ul className="reasons">{critical.map((g, i) => <li key={i} className="crit"><Icon name="x" size={16} /><span>{g.text}</span></li>)}</ul>
              {m.capped && <p className="hint">Because of a critical gap, the score is capped at {m.score} (it would have been {m.rawScore}).</p>}
            </>
          )}
          <h3 className="good">Strengths</h3>
          {m.strengths.length ? <ul className="reasons">{m.strengths.map((s, i) => <li key={i} className="good"><Icon name="check" size={16} /><span>{s}</span></li>)}</ul> : <p className="hint">No clear strengths found for this role.</p>}
          {otherGaps.length > 0 && (
            <>
              <h3 className="warn">Other gaps</h3>
              <ul className="reasons">{otherGaps.map((g, i) => <li key={i} className="warn"><Icon name="alert" size={16} /><span>{g.text}</span></li>)}</ul>
            </>
          )}
          {m.notAssessed.length > 0 && <p className="hint">Not assessed because your profile has no data for: {m.notAssessed.join(', ')}.</p>}
        </section>

        <section className="card">
          <h2>Eligibility</h2>
          <EligibilityFlags eligibility={m.eligibility} />
          <p className="hint">These flags are based on what you entered and what the employer listed. They are not a legal determination of visa or work-authorisation status.</p>
        </section>
      </div>

      <section className="card">
        <h2>Score breakdown</h2>
        <FactorBars factors={m.factors} confidence={m.confidence} />
      </section>

      <section className="card">
        <h2>Role details</h2>
        <p>{o.summary}</p>
        <dl className="facts">
          <div><dt>Experience level</dt><dd>{expOf(o)}</dd></div>
          <div><dt>Education</dt><dd><span className="cap">{o.education?.minLevel?.replace('_', ' ')}</span>{o.education?.fields?.length ? `; preferred: ${o.education.fields.join(', ')}` : ''}</dd></div>
          <div><dt>Languages</dt><dd>{(o.languages || []).map((l) => `${l.name} (${l.minLevel}${l.required ? '' : ', optional'})`).join(', ') || 'Not specified'}</dd></div>
          <div><dt>Work authorisation</dt><dd>{o.eligibility?.workAuthorisationRequired ? `Required${o.eligibility.sponsorshipOffered ? ' (sponsorship may be available)' : ' (no sponsorship mentioned)'}` : 'Not required'}</dd></div>
        </dl>
        <h3>Required skills</h3>
        <div className="chips">{o.requiredSkills.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
        {o.preferredSkills?.length > 0 && (
          <>
            <h3>Nice to have</h3>
            <div className="chips">{o.preferredSkills.map((s) => <span className="chip chip-soft" key={s}>{s}</span>)}</div>
          </>
        )}
        <h3>Responsibilities</h3>
        <ul>{(o.responsibilities || []).map((r) => <li key={r}>{r}</li>)}</ul>
      </section>

      <section className="card shortlist-box">
        <h2>{shortlisted ? 'On your shortlist' : 'Save this opportunity'}</h2>
        <div className="field">
          <label htmlFor="note">Private note (optional)</label>
          <input id="note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Check visa rules, deadline next month" />
        </div>
        <div className="actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{!shortlisted && <Icon name="star" size={15} />}{shortlisted ? 'Update note' : 'Add to shortlist'}</button>
          {shortlisted && <button type="button" className="btn btn-secondary" disabled={busy} onClick={remove}>Remove</button>}
        </div>
        {saved && <p className="hint" role="status">{saved}</p>}
      </section>
    </div>
  );
}
