import { useEffect, useState } from 'react';
import { PRODUCT } from '../../../shared/constants';
import { STARTER_TEMPLATES } from '../../../shared/starterTemplates';
import type { MotionPreference, ThemePreference } from '../../../shared/types';
import { isSafeHttpUrl, siteOriginFromUrl } from '../../../shared/validation';
import { addStarterTemplates, updateSettings } from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { Segmented, Switch, useToast } from '../../components/ui';
import { applyTheme } from '../../theme/theme';
import { activeSiteOrigins, disableSite, enableSite } from '../../sites';
import type { PageProps } from './types';

const THEMES: Array<{ value: ThemePreference; label: string; note: string }> = [
  { value: 'light', label: 'Light', note: 'Clean, minimal workspace.' },
  { value: 'signature', label: 'Kryz Signature', note: 'Our full brand: Kryz Black, Neon Pink and Bright Yellow.' },
  { value: 'system', label: 'System', note: 'Follows your device. Dark mode uses Kryz Signature.' },
];

export function SettingsPage({ store, adapter, route }: PageProps) {
  const toast = useToast();
  const s = store.settings;
  const [activeSites, setActiveSites] = useState<string[]>([]);
  const [theme, setThemeState] = useState(s.theme);
  const [motion, setMotionState] = useState(s.motion);
  const [newSite, setNewSite] = useState('');
  const [siteError, setSiteError] = useState('');
  const [name, setName] = useState(s.profile.senderName);
  const [link, setLink] = useState(s.profile.meetingLink);
  const requestedSite = route.params.get('site');
  const requestedOrigin = requestedSite ? siteOriginFromUrl(requestedSite) : null;

  useEffect(() => {
    setThemeState(s.theme);
    setMotionState(s.motion);
  }, [s.theme, s.motion]);

  useEffect(() => {
    const refresh = () => void activeSiteOrigins(s.expansionSites).then(setActiveSites);
    refresh();
    chrome.permissions.onAdded.addListener(refresh);
    chrome.permissions.onRemoved.addListener(refresh);
    return () => {
      chrome.permissions.onAdded.removeListener(refresh);
      chrome.permissions.onRemoved.removeListener(refresh);
    };
  }, [s.expansionSites]);

  async function setTheme(next: ThemePreference) {
    setThemeState(next);
    applyTheme(next, motion); // instant
    await updateSettings(adapter, { theme: next });
  }
  async function setMotion(next: MotionPreference) {
    setMotionState(next);
    applyTheme(theme, next);
    await updateSettings(adapter, { motion: next });
  }

  async function turnOn(origin: string) {
    setSiteError('');
    const ok = await enableSite(adapter, origin);
    if (ok) toast(`Shortcuts are on for ${new URL(origin).hostname}. Open tabs are ready; reload if they are not.`);
    else toast('Chrome did not grant access, so nothing changed.', { kind: 'error' });
  }


  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="lede">Everything here is saved on this device.</p>
        </div>
      </div>

      {requestedOrigin && !activeSites.includes(requestedOrigin) && (
        <section className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }} aria-labelledby="req-h">
          <h2 id="req-h">Turn on shortcuts for {new URL(requestedOrigin).hostname}?</h2>
          <p className="muted">
            Chrome will ask you to allow {PRODUCT.name} to run on <strong>{requestedOrigin}</strong>. On that site only, it watches for your shortcuts while you type in normal text fields. It never runs in password, payment or security-code fields, never stores what you type, and sends nothing over the network. You can turn it off at any time.
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => void turnOn(requestedOrigin)}>Allow on this site</button>
            <a className="btn" href="#/settings">Not now</a>
          </div>
        </section>
      )}

      <div className="stack" style={{ gap: 20 }}>
        <section className="card stack" aria-labelledby="look-h">
          <h2 id="look-h">Appearance</h2>
          <div className="grid grid-4" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <label key={t.value} className="card flat" style={{ cursor: 'pointer', padding: 14, borderColor: theme === t.value ? 'var(--accent)' : undefined, borderWidth: theme === t.value ? 2 : 1 }}>
                <span className="row">
                  <input type="radio" name="theme" aria-label={t.label} aria-describedby={`theme-note-${t.value}`} checked={theme === t.value} onChange={() => void setTheme(t.value)} />
                  <strong>{t.label}</strong>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    height: 44,
                    margin: '10px 0 6px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background:
                      t.value === 'light'
                        ? 'linear-gradient(90deg,#fff9f7 0 70%,#ff3d9a 70% 85%,#ffd23f 85%)'
                        : t.value === 'signature'
                          ? 'linear-gradient(90deg,#141012 0 70%,#ff3d9a 70% 85%,#ffd23f 85%)'
                          : 'linear-gradient(90deg,#fff9f7 0 35%,#141012 35% 70%,#ff3d9a 70% 85%,#ffd23f 85%)',
                  }}
                />
                <span className="small muted" id={`theme-note-${t.value}`}>{t.note}</span>
              </label>
            ))}
          </div>
          <div className="row wrap">
            <span className="label" style={{ fontWeight: 700 }}>Motion</span>
            <Segmented<MotionPreference>
              label="Motion"
              value={motion}
              onChange={(v) => void setMotion(v)}
              options={[
                { value: 'system', label: 'Follow system' },
                { value: 'reduce', label: 'Reduce motion' },
                { value: 'full', label: 'Full motion' },
              ]}
            />
          </div>
        </section>

        <section className="card stack" aria-labelledby="exp-h">
          <h2 id="exp-h">Text shortcuts on websites</h2>
          <p className="muted">
            Type a shortcut such as <span className="kbd">/followup</span> in a normal text box, then press the expand key to insert. Nothing expands unless you press it. Shortcuts only work on sites you add below.
          </p>
          <Switch checked={s.expansionEnabled} label="Shortcut expansion" onChange={(v) => void updateSettings(adapter, { expansionEnabled: v })} />
          <div className="row wrap">
            <span className="label" style={{ fontWeight: 700 }}>Expand key</span>
            <Segmented<'Tab' | 'Enter'>
              label="Expand key"
              value={s.expandKey}
              onChange={(v) => void updateSettings(adapter, { expandKey: v })}
              options={[
                { value: 'Tab', label: 'Tab' },
                { value: 'Enter', label: 'Enter' },
              ]}
            />
          </div>
          <div>
            <h3>Sites</h3>
            {activeSites.length === 0 ? (
              <p className="muted">No sites yet. Add one below, or use “Turn on” in the toolbar popup while you are on the site.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {activeSites.map((o) => (
                  <li key={o} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                    <Icon name="globe" /> <strong>{o}</strong>
                    {!s.expansionEnabled && <span className="badge">paused</span>}
                    <span className="spacer" />
                    <button className="btn sm danger" onClick={async () => { await disableSite(adapter, o); toast(`Access to ${o} removed.`); }}>
                      Remove &amp; revoke access
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="row wrap"
              style={{ marginTop: 12 }}
              onSubmit={(e) => {
                e.preventDefault();
                const candidate = /^https?:\/\//i.test(newSite.trim()) ? newSite.trim() : `https://${newSite.trim()}`;
                const origin = siteOriginFromUrl(candidate);
                if (!origin || !newSite.trim()) {
                  setSiteError('Enter a website address such as mail.google.com.');
                  return;
                }
                setNewSite('');
                void turnOn(origin);
              }}
            >
              <label className="field" style={{ flex: 1, minWidth: 220 }}>
                <span className="sr-only">Website address</span>
                <input className="input" placeholder="e.g. mail.google.com or www.linkedin.com" value={newSite} onChange={(e) => setNewSite(e.target.value)} aria-invalid={siteError ? 'true' : undefined} />
                {siteError && <span className="error" role="alert">{siteError}</span>}
              </label>
              <button className="btn" type="submit"><Icon name="plus" /> Add site</button>
            </form>
          </div>
        </section>

        <section className="card stack" aria-labelledby="me-h">
          <h2 id="me-h">Your details (optional)</h2>
          <p className="muted">Used to pre-fill <code>{'{{sender_name}}'}</code> and <code>{'{{meeting_link}}'}</code>. Recipient details are never pre-filled.</p>
          <form
            className="grid grid-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!isSafeHttpUrl(link.trim())) {
                toast('Meeting link must start with https:// or http://', { kind: 'error' });
                return;
              }
              await updateSettings(adapter, { profile: { senderName: name.trim().slice(0, 120), meetingLink: link.trim().slice(0, 500) } });
              toast('Details saved.');
            }}
          >
            <label className="field">
              <span className="label">Your name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
            </label>
            <label className="field">
              <span className="label">Meeting link</span>
              <input className="input" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://" inputMode="url" />
            </label>
            <div><button className="btn primary" type="submit">Save details</button></div>
          </form>
        </section>

        <section className="card stack" aria-labelledby="starter-h">
          <h2 id="starter-h">Starter library</h2>
          <p className="muted">Add {STARTER_TEMPLATES.length} editable templates for LinkedIn, recruitment, sales, client onboarding, invoices, support and everyday courtesy. Ones you already added are skipped.</p>
          <div>
            <button className="btn" onClick={async () => { const r = await addStarterTemplates(adapter); toast(r.added ? `Added ${r.added} starter templates.` : 'Starter templates are already in your library.'); }}>
              <Icon name="plus" /> Add starter templates
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
