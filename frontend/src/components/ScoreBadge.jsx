import { tierClass } from '../utils/format.js';

const R = 44;
const C = 2 * Math.PI * R;

/** Circular score gauge. The arc length is the score out of 100; its colour is the match tier. */
export default function ScoreBadge({ score, tier, label, size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className={`score-badge ${tierClass(tier)} size-${size}`} role="img" aria-label={`${label}, score ${score} out of 100`}>
      <div className="ring">
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle className="ring-track" cx="50" cy="50" r={R} />
          <circle className="ring-arc" cx="50" cy="50" r={R} style={{ '--len': C, '--off': C * (1 - clamped / 100) }} />
        </svg>
        <div className="ring-text">
          <span className="score-num">{score}</span>
          <span className="score-of">out of 100</span>
        </div>
      </div>
      {size === 'lg' && <span className="score-label">{label}</span>}
    </div>
  );
}
