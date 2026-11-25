import { useState } from 'react';
import { LIMITS } from '../../../shared/constants';
import { parseLibraryImport, type ParsedLibrary } from '../../../shared/validation';
import { applyImport, exportLibrary } from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { ConfirmDialog, downloadJson, useToast } from '../../components/ui';
import type { PageProps } from './types';

export function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ImportExportPage({ store, adapter }: PageProps) {
  const toast = useToast();
  const [parsed, setParsed] = useState<ParsedLibrary | null>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [readError, setReadError] = useState('');

  async function onFile(file: File | undefined) {
    setParsed(null);
    setReadError('');
    if (!file) return;
    setFileName(file.name);
    if (file.size > LIMITS.importBytes) {
      setReadError('That file is larger than 2 MB, so it was not opened.');
      return;
    }
    const text = await file.text();
    setParsed(parseLibraryImport(text));
  }

  async function apply() {
    if (!parsed) return;
    const r = await applyImport(adapter, parsed, mode);
    toast(mode === 'replace' ? `Library replaced with ${r.added} templates.` : `Imported: ${r.added} new, ${r.updated} updated${r.shortcutsCleared ? `, ${r.shortcutsCleared} duplicate shortcuts removed` : ''}.`);
    setParsed(null);
    setFileName('');
    setConfirmReplace(false);
  }

  const hasErrors = parsed?.issues.some((i) => i.level === 'error') ?? false;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Import &amp; <span className="accent-word">export</span></h1>
          <p className="lede">Move your library between browsers or keep a backup. Files are created and read on your device.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <section className="card stack" aria-labelledby="exp-h">
          <h2 id="exp-h"><Icon name="download" /> Export library</h2>
          <p className="muted">Downloads your {store.templates.length} templates and {store.folders.length} folders as a JSON file.</p>
          <div className="callout small">Exported files are ordinary files on your computer. They are not encrypted and are not deleted when you delete data in the extension, so store or remove them carefully.</div>
          <div>
            <button className="btn primary" disabled={!store.templates.length} onClick={async () => downloadJson(await exportLibrary(adapter), `kryz-quick-reply-library-${stamp()}.json`)}>
              <Icon name="download" /> Export templates
            </button>
          </div>
        </section>

        <section className="card stack" aria-labelledby="imp-h">
          <h2 id="imp-h"><Icon name="upload" /> Import library</h2>
          <p className="muted">Accepts Kryz Quick Reply export files up to 2 MB. Content is checked and treated as plain text; nothing in the file is run.</p>
          <label className="field">
            <span className="label">Choose file</span>
            <input className="input" type="file" accept="application/json,.json" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          {readError && <div className="callout danger" role="alert">{readError}</div>}
          {parsed && (
            <div className="stack" aria-live="polite">
              <div className="callout">
                <strong>{fileName}</strong>: {parsed.templates.length} templates, {parsed.folders.length} folders found.
              </div>
              {parsed.issues.length > 0 && (
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                  {parsed.issues.map((i, n) => (
                    <li key={n} style={{ color: i.level === 'error' ? 'var(--danger)' : undefined }}>{i.message}</li>
                  ))}
                </ul>
              )}
              {!hasErrors && (
                <>
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                    <legend className="label" style={{ fontWeight: 700, fontSize: 12.5 }}>How should it be added?</legend>
                    <label className="check"><input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} /> <span><strong>Merge:</strong> add new templates, update ones with the same ID, keep everything else.</span></label>
                    <label className="check"><input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> <span><strong>Replace:</strong> remove current templates and folders, then import.</span></label>
                  </fieldset>
                  <div className="row">
                    <button className="btn primary" onClick={() => (mode === 'replace' ? setConfirmReplace(true) : void apply())}>Import</button>
                    <button className="btn" onClick={() => setParsed(null)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      {confirmReplace && (
        <ConfirmDialog
          title="Replace your library?"
          body={<p>Your current {store.templates.length} templates and {store.folders.length} folders will be replaced. Export a backup first if you might need them.</p>}
          confirmLabel="Replace library"
          onCancel={() => setConfirmReplace(false)}
          onConfirm={apply}
        />
      )}
    </>
  );
}
