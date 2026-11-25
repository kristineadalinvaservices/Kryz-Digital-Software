import { useState } from 'react';
import { POLICY_VERSIONS, PRODUCT } from '../../../shared/constants';
import { addStarterTemplates, consentIsCurrent, recordConsent } from '../../../storage/repository';
import { BrandLogo } from '../../components/Brand';
import { Icon } from '../../components/icons';
import { useToast } from '../../components/ui';
import { navigate } from '../App';
import type { PageProps } from './types';

export const PRIVACY_COMMITMENT = [
  'We do not sell your personal information.',
  'We do not use your private content to train AI models.',
  'We do not collect unrelated browsing activity.',
  'We do not access your passwords or payment credentials.',
  'Your saved templates and personalizations remain in your browser in the local-only version.',
  'We do not transmit your saved content to our servers in the local-only version.',
  'We request only permissions necessary for the features you choose to use.',
  'You can export or delete your saved information.',
];

export function PrivacyCommitment() {
  return (
    <section className="card" aria-labelledby="commit-h">
      <h2 id="commit-h" style={{ marginBottom: 6 }}>
        {PRODUCT.privacyCommitment.split('.')[0]}. <span className="accent-word">Your Control.</span>
      </h2>
      <p className="muted">
        At {PRODUCT.ecosystem}, we believe productivity should never come at the expense of privacy. Our software is designed with privacy and security in mind.
      </p>
      <ul className="commit-list">
        {PRIVACY_COMMITMENT.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="small muted" style={{ marginTop: 12 }}>
        Future cloud synchronization, AI processing or third-party integrations will be clearly disclosed and appropriately authorized before activation. Your information belongs to you.
      </p>
    </section>
  );
}

export function OnboardingPage({ store, adapter }: PageProps) {
  const toast = useToast();
  const already = consentIsCurrent(store.consent);
  const policyChanged = !already && store.consent.onboardingCompletedAt !== null;
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [starters, setStarters] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      await recordConsent(adapter, { privacy, terms });
      if (starters) {
        const r = await addStarterTemplates(adapter);
        toast(`Added ${r.added} starter templates. Edit them to match your voice.`);
      }
      navigate('#/templates');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save.', { kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="welcome">
      <section className="welcome-hero" aria-labelledby="welcome-h">
        <div className="hero-logo">
          <BrandLogo variant="full" height={150} on="dark" />
        </div>
        <p className="eyebrow">{PRODUCT.name}</p>
        <h1 id="welcome-h">
          Reply faster.
          <br />
          Stay <span className="accent-word">in control.</span>
        </h1>
        <p style={{ fontSize: 17, maxWidth: 560, marginTop: 16 }}>
          {PRODUCT.name} saves the messages you write again and again (intros, follow ups, invoices, interview invites) so you can personalize and insert them in seconds.
        </p>
        <p className="tag" style={{ margin: 0 }}>{PRODUCT.tagline}</p>
      </section>

      {already && (
        <div className="callout" style={{ marginBottom: 20 }}>
          You have already completed setup. <a href="#/templates">Go to your templates</a>.
        </div>
      )}
      {policyChanged && (
        <div className="callout" style={{ marginBottom: 20 }} role="alert">
          Our Privacy Policy or Terms of Use changed since you last accepted them. Please review and confirm to continue.
        </div>
      )}

      <div className="stack" style={{ gap: 16 }}>
        <PrivacyCommitment />

        <section className="card" aria-labelledby="how-h">
          <h2 id="how-h">What this extension can access, and why</h2>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <div>
              <h3><Icon name="folder" /> Storage on this device</h3>
              <p className="muted">Your templates, folders, settings and usage counts are saved in Chrome’s local extension storage on this computer. Nothing is uploaded. Browser storage is <strong>not</strong> the same as encryption, so please do not save passwords, private keys, API keys or other highly sensitive information in templates.</p>
            </div>
            <div>
              <h3><Icon name="insert" /> The page you are on, only when you click</h3>
              <p className="muted">When you click <em>Insert</em> in the toolbar popup, Chrome lets the extension place your message into the field you selected on that tab. It does not read the page, and it refuses password, payment and security-code fields.</p>
            </div>
            <div>
              <h3><Icon name="bolt" /> Shortcuts on websites you choose (optional)</h3>
              <p className="muted">Typing shortcuts like <span className="kbd">/intro</span> needs access to a specific website. Nothing is requested now. If you switch shortcuts on for a site later, Chrome will ask you first, and you can revoke it at any time.</p>
            </div>
            <div>
              <h3><Icon name="shield" /> No tracking</h3>
              <p className="muted">No accounts, no advertising trackers, no external analytics and no AI processing. Usage statistics are counted on this device only and you can clear them.</p>
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="agree-h">
          <h2 id="agree-h">Before you start</h2>
          <p className="muted">
            Please read the <a href="#/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a> and the <a href="#/legal/terms" target="_blank" rel="noopener">Terms of Use</a>. Each needs its own confirmation. Versions: privacy {POLICY_VERSIONS.privacy}, terms {POLICY_VERSIONS.terms}.
          </p>
          <div className="stack">
            <label className="check">
              <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
              <span>I have read the Privacy Policy and understand how my information is stored and used.</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>I accept the Terms of Use.</span>
            </label>
            {!already && (
              <label className="check">
                <input type="checkbox" checked={starters} onChange={(e) => setStarters(e.target.checked)} />
                <span>
                  Optional: add 13 editable starter templates (LinkedIn, recruitment, sales, onboarding, invoices, support and more).
                </span>
              </label>
            )}
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn primary" disabled={!privacy || !terms || busy} onClick={() => void start()}>
              Get started
            </button>
            {(!privacy || !terms) && <span className="small muted">Confirm both statements to continue.</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
