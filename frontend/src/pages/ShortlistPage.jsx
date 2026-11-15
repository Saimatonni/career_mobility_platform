import { useEffect, useState } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import Banner from '../components/Banner.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';
import { go } from '../utils/useHashRoute.js';

export default function ShortlistPage({ profileId }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .shortlist(profileId)
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, [profileId]);

  const remove = async (oppId) => {
    setBusyId(oppId);
    try {
      await api.removeShortlist(profileId, oppId);
      setItems((list) => list.filter((i) => i.opportunity.id !== oppId));
    } catch (e) {
      setError(`Could not remove: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Your shortlist</h1>
          <p className="muted">Opportunities you saved, with their current match score for your profile.</p>
        </div>
      </div>
      <Banner kind="error" onClose={() => setError(null)}>{error}</Banner>
      {!items && !error && <p className="loading">Loading shortlist…</p>}
      {items && items.length === 0 && (
        <div className="empty">
          <Icon name="star" size={28} />
          <p>You haven't shortlisted anything yet.</p>
          <button type="button" className="btn btn-primary" onClick={() => go('/matches')}>Browse matches</button>
        </div>
      )}
      {items && items.length > 0 && (
        <div className="list">
          {items.map((i) => (
            <div key={i.opportunity.id}>
              <MatchCard
                item={{ ...i, shortlisted: true }}
                showRank={false}
                busy={busyId === i.opportunity.id}
                onOpen={(id) => go(`/opportunity/${id}`)}
                onToggleShortlist={(id) => remove(id)}
              />
              {i.note && (
                <p className="note">
                  <Icon name="note" size={16} />
                  <span>{i.note}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
