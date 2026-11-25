import { useMemo, useRef, useState } from 'react';
import { LIMITS } from '../../../shared/constants';
import { validateShortcut } from '../../../shared/shortcuts';
import { BUILT_IN_VARIABLES, extractVariables } from '../../../shared/variables';
import { ValidationError, saveTemplate, trashTemplate } from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { Preview } from '../../components/Personalize';
import { EmptyState, Modal, useToast } from '../../components/ui';
import { navigate } from '../App';
import type { PageProps } from './types';

/** Light check for content that looks like a secret. Advisory only; we never block or read beyond the form. */
const SECRET_HINT = /(password\s*[:=]|passwd|api[_-]?key|secret[_-]?key|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:\d[ -]?){13,19}\b)/i;

export function EditorPage({ store, adapter, id }: PageProps & { id?: string }) {
  const toast = useToast();
  const existing = id ? store.templates.find((t) => t.id === id) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [shortcut, setShortcut] = useState(existing?.shortcut ?? '');
  const [folderId, setFolderId] = useState<string>(existing?.folderId ?? '');
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [error, setError] = useState('');
  const [customVar, setCustomVar] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const shortcutCheck = useMemo(() => validateShortcut(shortcut, store.templates, existing?.id), [shortcut, store.templates, existing?.id]);
  const vars = useMemo(() => extractVariables(body), [body]);
  const looksSecret = SECRET_HINT.test(body);

  if (id && !existing) {
    return <EmptyState title="Template not found" action={<a className="btn" href="#/templates">Back to templates</a>}>It may have been deleted.</EmptyState>;
  }

  function insertVariable(key: string) {
    const ta = bodyRef.current;
    const token = `{{${key}}}`;
    if (!ta) return setBody((b) => b + token);
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    try {
      await saveTemplate(
        adapter,
        { title, description, body, shortcut, folderId: folderId || null, tags: tags.split(','), favorite, pinned },
        existing?.id,
      );
      toast(existing ? 'Template saved.' : 'Template created.');
      navigate('#/templates');
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : 'Could not save the template.');
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <a href="#/templates" className="small">
            <Icon name="back" size={12} /> Templates
          </a>
          <h1>{existing ? 'Edit template' : 'New template'}</h1>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="editor-grid"
        noValidate
      >
        <div className="card stack">
          <label className="field">
            <span className="label">Title</span>
            <input className="input" required maxLength={LIMITS.titleChars} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Discovery call invitation" />
          </label>
          <label className="field">
            <span className="label">Description <span className="muted">(optional)</span></span>
            <input className="input" maxLength={LIMITS.descriptionChars} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to use it" />
          </label>
          <div className="field">
            <label className="label" htmlFor="body">Message</label>
            <textarea id="body" ref={bodyRef} className="textarea" required maxLength={LIMITS.bodyChars} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Hi {{first_name}},\n\n…'} aria-describedby="body-help" />
            <span className="help" id="body-help">
              {body.length.toLocaleString()} / {LIMITS.bodyChars.toLocaleString()} characters. Variables look like <code>{'{{first_name}}'}</code> and are filled in each time you use the template.
            </span>
          </div>
          {looksSecret && (
            <div className="callout danger" role="alert">
              This message looks like it may contain a password, key or card number. Templates are stored in browser storage, which is not encrypted. Please remove sensitive information.
            </div>
          )}
          <div className="field">
            <span className="label">Insert a variable</span>
            <div className="var-buttons">
              {BUILT_IN_VARIABLES.map((v) => (
                <button type="button" key={v.key} className="btn sm" onClick={() => insertVariable(v.key)}>
                  {v.label}
                </button>
              ))}
              <button type="button" className="btn sm" onClick={() => setCustomVar('')}>
                <Icon name="plus" /> Custom…
              </button>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card stack">
            <label className="field">
              <span className="label">Shortcut <span className="muted">(optional)</span></span>
              <input className="input" value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="/intro" spellCheck={false} autoComplete="off" aria-invalid={!shortcutCheck.ok ? 'true' : undefined} aria-describedby="sc-help" />
              {!shortcutCheck.ok ? (
                <span className="error" role="alert">{shortcutCheck.error}</span>
              ) : (
                <span className="help" id="sc-help">
                  Type it on sites where you turned shortcuts on, then press <span className="kbd">{store.settings.expandKey}</span> to insert.
                </span>
              )}
            </label>
            <label className="field">
              <span className="label">Folder</span>
              <select className="select" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                <option value="">No folder</option>
                {store.folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Tags</span>
              <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sales, follow-up" />
              <span className="help">Separate with commas.</span>
            </label>
            <div className="row wrap" style={{ gap: 16 }}>
              <label className="check"><input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} /> Favorite</label>
              <label className="check"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pinned</label>
            </div>
          </div>
          <div className="card">
            <h3>Preview</h3>
            {body.trim() ? <Preview body={body} /> : <p className="muted">Your message preview appears here.</p>}
            {vars.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>Variables: {vars.map((v) => v.label).join(', ')}</p>}
          </div>
          {error && <div className="callout danger" role="alert">{error}</div>}
          <div className="row wrap">
            <button type="submit" className="btn primary" disabled={!shortcutCheck.ok}>
              {existing ? 'Save changes' : 'Create template'}
            </button>
            <a className="btn" href="#/templates">Cancel</a>
            <span className="spacer" />
            {existing && (
              <button
                type="button"
                className="btn ghost"
                onClick={async () => {
                  await trashTemplate(adapter, existing.id);
                  toast('Moved to Recently deleted.');
                  navigate('#/templates');
                }}
              >
                <Icon name="trash" /> Delete
              </button>
            )}
          </div>
        </div>
      </form>

      {customVar !== null && (
        <Modal
          title="Custom variable"
          onClose={() => setCustomVar(null)}
          footer={
            <>
              <button className="btn" onClick={() => setCustomVar(null)}>Cancel</button>
              <button
                className="btn primary"
                disabled={!/^[a-z][a-z0-9_]{0,39}$/.test(customVar.trim().toLowerCase().replace(/\s+/g, '_'))}
                onClick={() => {
                  insertVariable(customVar.trim().toLowerCase().replace(/\s+/g, '_'));
                  setCustomVar(null);
                }}
              >
                Insert
              </button>
            </>
          }
        >
          <label className="field">
            <span className="label">Variable name</span>
            <input className="input" data-autofocus value={customVar} onChange={(e) => setCustomVar(e.target.value)} placeholder="project name" />
            <span className="help">Letters, numbers and spaces. It becomes {'{{project_name}}'}.</span>
          </label>
        </Modal>
      )}
    </>
  );
}
