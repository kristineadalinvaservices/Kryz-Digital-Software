/**
 * Personalization form + live preview. Values typed here are used once and never saved.
 * Recipient fields always start empty; only the user's own saved details and today's date
 * are suggested.
 */
import { useMemo, useState } from 'react';
import type { SenderProfile, Template } from '../../shared/types';
import { defaultValues, extractVariables, missingVariables, renderTemplate, tokenize } from '../../shared/variables';
import { LIMITS } from '../../shared/constants';
import { Icon } from './icons';

export function Preview({ body, values }: { body: string; values?: Record<string, string> }) {
  return (
    <div className="preview" aria-label="Message preview">
      {tokenize(body, values).map((p, i) =>
        p.variable ? (
          <span key={i} className={p.filled ? 'var-token filled' : 'var-token'}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </div>
  );
}

export function PersonalizeForm({
  template,
  profile,
  onCopy,
  onInsert,
  onCancel,
  compact = false,
}: {
  template: Template;
  profile: SenderProfile;
  onCopy: (text: string) => void;
  onInsert?: (text: string) => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const vars = useMemo(() => extractVariables(template.body), [template.body]);
  const [values, setValues] = useState(() => defaultValues(vars, profile));
  const missing = missingVariables(vars, values);
  const text = renderTemplate(template.body, values);
  const ready = missing.length === 0;

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) (onInsert ?? onCopy)(text);
      }}
    >
      {vars.length > 0 && (
        <div className={compact ? 'stack' : 'grid grid-2'} style={compact ? undefined : { gap: 12 }}>
          {vars.map((v, i) => (
            <label key={v.key} className="field">
              <span className="label">
                {v.label}
                {v.source === 'recipient' && <span className="muted small"> · recipient</span>}
              </span>
              <input
                className="input"
                value={values[v.key] ?? ''}
                maxLength={LIMITS.variableValueChars}
                placeholder={v.placeholder}
                autoFocus={i === 0}
                aria-invalid={!(values[v.key] ?? '').trim() ? 'true' : undefined}
                onChange={(e) => setValues((s) => ({ ...s, [v.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}
      <div>
        <div className="row" style={{ marginBottom: 6 }}>
          <strong className="small">Preview</strong>
          <span className="spacer" />
          {!ready && <span className="small muted">Still needed: {missing.map((m) => m.label).join(', ')}</span>}
        </div>
        <Preview body={template.body} values={values} />
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        Review the message before sending. Kryz Quick Reply never sends messages for you.
      </p>
      <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn" disabled={!ready} onClick={() => onCopy(text)}>
          <Icon name="copy" /> Copy
        </button>
        {onInsert && (
          <button type="submit" className="btn primary" disabled={!ready}>
            <Icon name="insert" /> Insert into page
          </button>
        )}
      </div>
    </form>
  );
}
