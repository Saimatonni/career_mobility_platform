import Icon from './Icon.jsx';

export default function Banner({ kind = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon name={kind === 'error' ? 'alert' : 'info'} size={18} className="banner-icon" />
      <div className="banner-text">{children}</div>
      {onClose && (
        <button type="button" className="banner-close" onClick={onClose} aria-label="Dismiss">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
