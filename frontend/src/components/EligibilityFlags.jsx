import Icon from './Icon.jsx';

const ICON = { critical: 'block', verify: 'alert', info: 'info' };
const TITLE = { critical: 'Likely blocker', verify: 'Needs verification', info: 'Note' };

export default function EligibilityFlags({ eligibility }) {
  if (!eligibility.flags.length) return <p className="hint">No eligibility constraints listed for this role.</p>;
  return (
    <ul className="flags">
      {eligibility.flags.map((f) => (
        <li key={f.code} className={`flag flag-${f.severity}`}>
          <Icon name={ICON[f.severity]} size={18} className="flag-icon" />
          <div>
            <strong>{TITLE[f.severity]}</strong>
            <p>{f.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
