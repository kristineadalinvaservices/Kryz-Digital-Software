import { PRODUCT } from '../../../shared/constants';
import { BrandLogo, ParentBadge } from '../../components/Brand';
import type { PageProps } from './types';

export function AboutPage(_props: PageProps) {
  const version = chrome.runtime.getManifest().version;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>About</h1>
        </div>
      </div>
      <div className="stack" style={{ gap: 20 }}>
        <section className="card stack">
          <BrandLogo variant="full" height={90} />
          <ParentBadge />
          <h2>
            {PRODUCT.name} <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>v{version}</span>
          </h2>
          <p>
            An official product of <strong>{PRODUCT.parentBrand}</strong>, part of the <strong>{PRODUCT.ecosystem}</strong> ecosystem.
          </p>
          <p className="accent-word" style={{ fontSize: 18 }}>{PRODUCT.tagline}</p>
          <p className="muted">Save the messages you send again and again, personalize them in seconds, and insert them where you work, with your data kept on your device.</p>
        </section>
        <section className="card">
          <h3>Known limitations</h3>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li>Shortcuts work in standard text inputs, text areas and most rich-text editors in the main page. Fields inside embedded frames are not supported yet.</li>
            <li>Some rich-text editors may not accept inserted text. When that happens the message is copied so you can paste it.</li>
            <li>Data stays in this browser profile. There is no sync between devices yet; use Export and Import to move your library.</li>
            <li>Compatibility has been tested on generic pages only. Gmail and LinkedIn have not yet been verified by a person with real accounts.</li>
          </ul>
        </section>
        <section className="card">
          <h3>Legal</h3>
          <div className="row wrap">
            <a className="btn" href="#/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>
            <a className="btn" href="#/legal/terms" target="_blank" rel="noopener">Terms of Use</a>
            <a className="btn" href="#/privacy">Privacy &amp; Security Center</a>
          </div>
        </section>
      </div>
    </>
  );
}
