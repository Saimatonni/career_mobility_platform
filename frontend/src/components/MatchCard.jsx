import ScoreBadge from './ScoreBadge.jsx';
import OpportunityMeta from './OpportunityMeta.jsx';
import Icon from './Icon.jsx';
import { eligibilityLabel, tierClass } from '../utils/format.js';

export default function MatchCard({ item, onOpen, onToggleShortlist, busy, showRank = true }) {
  const { opportunity: o, match: m, shortlisted, rank } = item;
  const topStrength = m.strengths[0];
  const topGap = m.gaps.find((g) => g.critical) || m.gaps.find((g) => !g.critical);

  return (
    <article className={`card match-card ${tierClass(m.tier)}`}>
      <div className="match-main">
        <div className="match-top">
          {showRank && rank && <span className="rank" aria-label={`Rank ${rank}`}>{rank}</span>}
          <div className="match-title">
            <h3>
              <button type="button" className="link" onClick={() => onOpen(o.id)}>
                {o.title}
              </button>
            </h3>
            <OpportunityMeta opportunity={o} />
          </div>
        </div>

        <div className="chips">
          <span className={`chip chip-tier ${tierClass(m.tier)}`}>{m.tierLabel}</span>
          <span className={`chip chip-elig elig-${m.eligibility.status}`}>{eligibilityLabel(m.eligibility.status)}</span>
          {m.capped && <span className="chip chip-warn">Score capped</span>}
        </div>

        <p className="summary-line">{m.summary}</p>

        <ul className="mini-list">
          {topStrength && (
            <li className="good">
              <Icon name="check" size={15} />
              <span>{topStrength}</span>
            </li>
          )}
          {topGap && (
            <li className={topGap.critical ? 'crit' : 'warn'}>
              <Icon name={topGap.critical ? 'x' : 'alert'} size={15} />
              <span>{topGap.text}</span>
            </li>
          )}
        </ul>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => onOpen(o.id)}>
            View details & explanation
          </button>
          <button
            type="button"
            className={`btn ${shortlisted ? 'btn-saved' : 'btn-primary'}`}
            disabled={busy}
            aria-pressed={shortlisted}
            onClick={() => onToggleShortlist(o.id, !shortlisted)}
          >
            <Icon name="star" size={15} filled={shortlisted} />
            {shortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
        </div>
      </div>
      <ScoreBadge score={m.score} tier={m.tier} label={m.tierLabel} />
    </article>
  );
}
