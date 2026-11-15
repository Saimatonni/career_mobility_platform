import { useState } from 'react';

/** Type a value and press Enter or comma to add it; click × to remove. Optional suggestions via <datalist>. */
export default function TagInput({ id, label, values, onChange, placeholder, suggestions = [], max = 40, error, hint }) {
  const [draft, setDraft] = useState('');
  const listId = `${id}-list`;

  const add = (raw) => {
    const v = raw.trim().replace(/\s+/g, ' ');
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase()) || values.length >= max) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="tag-box">
        {values.map((v) => (
          <span className="tag" key={v}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          list={suggestions.length ? listId : undefined}
          placeholder={values.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="error-text" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
