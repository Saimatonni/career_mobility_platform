import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import Banner from '../components/Banner.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';
import { go } from '../utils/useHashRoute.js';

const TIERS = [
  ['strong', 'strong'],
  ['partial', 'partial'],
  ['weak', 'weak'],
  ['critical_gap', 'with a critical gap'],
];

export default function MatchesPage({ profileId }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [country, setCountry] = useState('all');
  const [tier, setTier] = useState('all');
  const [query, setQuery] = useState('');

  const load = () => {
    setError(null);
    api
      .matches(profileId)
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  };
  useEffect(load, [profileId]);

  const countries = useMemo(() => [...new Set((items || []).map((i) => i.opportunity.location.country))].sort(), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter(
      (i) =>
        (country === 'all' || i.opportunity.location.country === country) &&
        (tier === 'all' || i.match.tier === tier) &&
        (!q || `${i.opportunity.title} ${i.opportunity.organisation}`.toLowerCase().includes(q))
    );
  }, [items, country, tier, query]);

  const toggle = async (oppId, shouldSave) => {
    setBusyId(oppId);
    const prev = items;
    setItems((list) => list.map((i) => (i.opportunity.id === oppId ? { ...i, shortlisted: shouldSave } : i))); // optimistic
    try {
      if (shouldSave) await api.addShortlist(profileId, oppId);
      else await api.removeShortlist(profileId, oppId);
    } catch (e) {
      setItems(prev); // roll back
      setError(`Could not update your shortlist: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { strong: 0, partial: 0, weak: 0, critical_gap: 0 };
    (items || []).forEach((i) => (c[i.match.tier] += 1));
    return c;
  }, [items]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Your ranked matches</h1>
          <p className="muted">Ranked by a transparent, rule-based score out of 100. Open any role to see exactly why it scored the way it did.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => go('/profile')}>
          Edit profile
        </button>
      </div>

      <Banner kind="error" onClose={() => setError(null)}>
        {error}
      </Banner>

      {!items && !error && <p className="loading">Calculating your matches…</p>}
      {error && !items && (
        <button type="button" className="btn btn-primary" onClick={load}>
          Try again
        </button>
      )}

      {items && (
        <>
          <section className="card summary-card" aria-label="Match overview">
            <div className="dist-bar" aria-hidden="true">
              {TIERS.map(([t]) => counts[t] > 0 && <span key={t} className={`dist-seg tier-${t}`} style={{ flexGrow: counts[t] }} />)}
            </div>
            <ul className="dist-legend">
              {TIERS.map(([t, label]) => (
                <li key={t} className={`tier-${t}`}>
                  <span className="dot" aria-hidden="true" />
                  <strong>{counts[t]}</strong> {label}
                </li>
              ))}
            </ul>
          </section>

          <div className="filters card">
            <div className="field">
              <label htmlFor="q">Search</label>
              <div className="search-wrap">
                <Icon name="search" size={16} />
                <input id="q" type="search" placeholder="Title or organisation" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="fc">Country</label>
              <select id="fc" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="all">All countries</option>
                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ft">Match level</label>
              <select id="ft" value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="all">All</option>
                <option value="strong">Strong</option>
                <option value="partial">Partial</option>
                <option value="weak">Weak</option>
                <option value="critical_gap">Critical gap</option>
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="empty">No opportunities match these filters.</p>
          ) : (
            <div className="list">
              {visible.map((item) => (
                <MatchCard key={item.opportunity.id} item={item} busy={busyId === item.opportunity.id} onOpen={(id) => go(`/opportunity/${id}`)} onToggleShortlist={toggle} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
