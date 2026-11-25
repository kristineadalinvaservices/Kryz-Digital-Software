import { useEffect, useState } from 'react';
import { POLICY_VERSIONS, PRODUCT, SECURITY_CONTACT } from '../../../shared/constants';
import { clearUsage, deleteAllData, emptyTrash, exportAllData } from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { ConfirmDialog, downloadJson, useToast } from '../../components/ui';
import { clearThemeMirror } from '../../theme/theme';
import { disableSite, grantedSiteOrigins, revokeAllSites } from '../../sites';
import { navigate } from '../App';
import { stamp } from './ImportExport';
import { PrivacyCommitment } from './Onboarding';
import type { PageProps } from './types';

type Pending = 'usage' | 'trash' | 'all' | 'reset' | null;

/**
 * Every status shown here describes how this build actually behaves.
 * The "Off / None" values are enforced by the manifest (no network permissions, connect-src 'none')
 * and checked by scripts/security-scan.mjs and the e2e network test.
 */
export function PrivacyPage({ store, adapter }: PageProps) {
  const toast = useToast();
  const [granted, setGranted] = useState<string[]>([]);
  const [bytes, setBytes] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const version = chrome.runtime.getManifest().version;

  useEffect(() => {
    void grantedSiteOrigins().then(setGranted);
    void adapter.bytesInUse().then(setBytes);
  }, [store, adapter]);

  async function wipe(thenWelcome: boolean) {
    await revokeAllSites(adapter);
    await deleteAllData(adapter);
    clearThemeMirror();
    setPending(null);
    if (thenWelcome) navigate('#/welcome');
    toast('All extension data on this device has been deleted.');
  }

  const status: Array<{ k: string; v: string; good: boolean; note: string }> = [
    { k: 'Where your data lives', v: 'This device only', good: true, note: 'Chrome local extension storage' },
    { k: 'Cloud synchronization', v: 'Off', good: true, note: 'Not built into this version' },
    { k: 'External analytics', v: 'None', good: true, note: 'Usage is counted on-device' },
    { k: 'Advertising trackers', v: 'None', good: true, note: 'No third-party scripts' },
    { k: 'AI processing', v: 'None', good: true, note: 'No content is sent to AI services' },
    { k: 'Website access', v: granted.length ? `${granted.length} site${granted.length > 1 ? 's' : ''}` : 'None', good: true, note: 'Only sites you approved' },
    { k: 'Integrations', v: 'None', good: true, note: 'No accounts or connected services' },
    { k: 'Version', v: version, good: true, note: `Privacy ${POLICY_VERSIONS.privacy}` },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Privacy &amp; <span className="accent-word">Security</span>
          </h1>
          <p className="lede">{PRODUCT.privacyCommitment} What the extension does, what it can access, and the controls to change it.</p>
        </div>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <section aria-labelledby="status-h">
          <h2 id="status-h" className="sr-only">Current status</h2>
          <div className="status-grid">
            {status.map((s) => (
              <div className="status-item" key={s.k}>
                <span className="k">{s.k}</span>
                <span className="v">
                  <Icon name="shield" size={14} /> {s.v}
                </span>
                <span className="small muted">{s.note}</span>
              </div>
            ))}
          </div>
        </section>

        <PrivacyCommitment />

        <section className="card" aria-labelledby="perm-h">
          <h2 id="perm-h">Permissions</h2>
          <div className="perm">
            <div><strong>Storage</strong> <code>storage</code><div className="small muted">Saves your templates, folders, settings and usage counts on this device.</div></div>
            <span className="badge good">Required</span>
          </div>
          <div className="perm">
            <div><strong>Current tab, when you click</strong> <code>activeTab</code> + <code>scripting</code><div className="small muted">Lets the toolbar popup place a message into the field you selected, only after you click the icon and choose Insert. Also used to enable shortcuts on a site you approve.</div></div>
            <span className="badge good">Required</span>
          </div>
          <div className="perm">
            <div>
              <strong>Website access for shortcuts</strong> <code>optional host permissions</code>
              <div className="small muted">Requested one site at a time, only when you turn shortcuts on for that site.</div>
              {granted.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                  {granted.map((o) => (
                    <li key={o} className="row" style={{ padding: '4px 0' }}>
                      <Icon name="globe" /> {o}
                      <span className="spacer" />
                      <button className="btn sm danger" onClick={async () => { await disableSite(adapter, o); toast(`Access to ${o} revoked.`); }}>Revoke</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="small" style={{ marginTop: 6 }}>No websites have access.</div>
              )}
            </div>
            <span className="badge">Optional</span>
          </div>
        </section>

        <section className="card stack" aria-labelledby="data-h">
          <h2 id="data-h">Your data</h2>
          <p className="muted">
            Stored now: {store.templates.length} templates, {store.folders.length} folders, {store.trash.length} recently deleted, usage statistics and settings{bytes !== null ? ` (about ${(bytes / 1024).toFixed(1)} KB)` : ''}.
          </p>
          <div className="row wrap">
            <button className="btn" onClick={async () => downloadJson(await exportAllData(adapter), `kryz-quick-reply-all-data-${stamp()}.json`)}>
              <Icon name="download" /> Export all my data
            </button>
            <a className="btn" href="#/templates">Delete individual templates</a>
            <button className="btn" onClick={() => setPending('usage')}>Clear usage statistics</button>
            <button className="btn" onClick={() => setPending('trash')} disabled={!store.trash.length}>Empty recently deleted</button>
          </div>
          <div className="row wrap">
            <button className="btn danger" onClick={() => setPending('all')}>Delete all extension data</button>
            <button className="btn danger" onClick={() => setPending('reset')}>Reset extension</button>
          </div>
          <div className="callout small">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Browser storage is <strong>not encrypted</strong> by this extension. Anyone with access to your computer profile may be able to read it. Do not save passwords, private keys, API keys or other highly sensitive information in templates.</li>
              <li>Files you exported earlier are not deleted by these controls. Delete them from your computer yourself.</li>
              <li>If you uninstall the extension, Chrome removes the data it stored on this device. Exported files remain.</li>
            </ul>
          </div>
        </section>

        <section className="card stack" aria-labelledby="legal-h">
          <h2 id="legal-h">Policies &amp; reporting</h2>
          <div className="row wrap">
            <a className="btn" href="#/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>
            <a className="btn" href="#/legal/terms" target="_blank" rel="noopener">Terms of Use</a>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            You acknowledged privacy version {store.consent.privacyAckVersion ?? 'not recorded'} on {store.consent.privacyAckAt ? new Date(store.consent.privacyAckAt).toLocaleString() : 'not recorded'} and accepted terms version {store.consent.termsAcceptedVersion ?? 'not recorded'} on {store.consent.termsAcceptedAt ? new Date(store.consent.termsAcceptedAt).toLocaleString() : 'not recorded'}.
          </p>
          <div>
            <h3>Report a security concern</h3>
            {SECURITY_CONTACT ? (
              <p>Contact <a href={`mailto:${SECURITY_CONTACT}`}>{SECURITY_CONTACT}</a>. Please do not include private template content in your report.</p>
            ) : (
              <p className="muted">A dedicated security contact has not been published for this pre-release build yet. It will be listed here and in the Chrome Web Store listing before public release.</p>
            )}
          </div>
        </section>
      </div>

      {pending === 'usage' && (
        <ConfirmDialog title="Clear usage statistics?" body={<p>Usage counts and daily activity are erased. Templates are kept.</p>} confirmLabel="Clear" onCancel={() => setPending(null)} onConfirm={async () => { await clearUsage(adapter); setPending(null); toast('Usage statistics cleared.'); }} />
      )}
      {pending === 'trash' && (
        <ConfirmDialog title="Empty recently deleted?" body={<p>{store.trash.length} deleted templates are erased permanently.</p>} confirmLabel="Empty" onCancel={() => setPending(null)} onConfirm={async () => { await emptyTrash(adapter); setPending(null); toast('Recently deleted emptied.'); }} />
      )}
      {(pending === 'all' || pending === 'reset') && (
        <ConfirmDialog
          title={pending === 'all' ? 'Delete all extension data?' : 'Reset the extension?'}
          body={
            <>
              <p>This permanently erases, from this device: all templates, folders, recently deleted items, usage statistics, settings, your saved details, your privacy and terms acknowledgments, and every website permission you granted.</p>
              <p>{pending === 'reset' ? 'The welcome screen opens afterwards so you can start fresh.' : 'You will be asked to accept the Terms again before using the extension.'} This cannot be undone. Exported files are not affected.</p>
            </>
          }
          confirmLabel={pending === 'all' ? 'Delete everything' : 'Reset'}
          typeToConfirm="DELETE"
          onCancel={() => setPending(null)}
          onConfirm={() => wipe(pending === 'reset')}
        />
      )}
    </>
  );
}
