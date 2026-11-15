import { pct } from '../utils/format.js';

/** Transparent score breakdown: one bar per criterion with its weight, score and the reason. */
export default function FactorBars({ factors, confidence }) {
  return (
    <div className="factors">
      {factors.map((f) => (
        <div className="factor" key={f.key}>
          <div className="factor-head">
            <span className="factor-name">{f.label}</span>
            <span className="factor-meta">
              <span>Weight {f.weight}</span>
              <strong className={`factor-score status-text-${f.status}`}>{f.score === null ? 'Not assessed' : pct(f.score)}</strong>
            </span>
          </div>
          <div className="bar" role="img" aria-label={`${f.label}: ${f.score === null ? 'not assessed' : pct(f.score)}`}>
            <div className={`bar-fill status-${f.status}`} style={{ width: f.score === null ? '0%' : `${Math.round(f.score * 100)}%` }} />
          </div>
          <p className="factor-detail">{f.detail}</p>
        </div>
      ))}
      <p className="hint confidence">
        Score confidence: {Math.round(confidence * 100)}% of the scoring weight could be assessed from your profile. Missing data is left out, never assumed.
      </p>
    </div>
  );
}
