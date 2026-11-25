import { useEffect, useState } from 'react';
import { PRODUCT } from '../../shared/constants';
import { consentIsCurrent } from '../../storage/repository';
import { BrandLockup, ParentBadge } from '../components/Brand';
import { Icon, type IconName } from '../components/icons';
import { ErrorState, Loading } from '../components/ui';
import { useStore } from '../hooks/useStore';
import { AboutPage } from './pages/About';
import { AnalyticsPage } from './pages/Analytics';
import { EditorPage } from './pages/Editor';
import { ImportExportPage } from './pages/ImportExport';
import { LegalPage } from './pages/Legal';
import { OnboardingPage } from './pages/Onboarding';
import { PrivacyPage } from './pages/Privacy';
import { SettingsPage } from './pages/Settings';
import { TemplatesPage } from './pages/Templates';
import type { PageProps } from './pages/types';

export interface Route {
  path: string;
  params: URLSearchParams;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/templates';
  const [path, qs] = raw.split('?');
  return { path: path || '/templates', params: new URLSearchParams(qs ?? '') };
}

export function navigate(hash: string) {
  window.location.hash = hash;
}

const NAV: Array<{ path: string; label: string; icon: IconName }> = [
  { path: '/templates', label: 'Templates', icon: 'folder' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/import-export', label: 'Import & Export', icon: 'transfer' },
  { path: '/settings', label: 'Settings', icon: 'gear' },
  { path: '/privacy', label: 'Privacy & Security', icon: 'shield' },
  { path: '/about', label: 'About', icon: 'info' },
];

export function App() {
  const { store, error, adapter, reload } = useStore();
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = { '/welcome': 'Welcome', '/analytics': 'Analytics', '/settings': 'Settings', '/privacy': 'Privacy & Security', '/about': 'About', '/import-export': 'Import & Export' };
    const key = Object.keys(titles).find((k) => route.path.startsWith(k));
    document.title = `${key ? titles[key] + ' · ' : ''}${PRODUCT.name}`;
  }, [route.path]);

  if (error) return <main style={{ padding: 32 }}><ErrorState message={error} onRetry={reload} /></main>;
  if (!store) return <Loading />;

  const isLegal = route.path.startsWith('/legal/');
  if (isLegal) return <LegalPage doc={route.path === '/legal/terms' ? 'terms' : 'privacy'} />;

  // Not onboarded (or policies changed) → welcome. Onboarded users can still revisit #/welcome.
  if (!consentIsCurrent(store.consent) || route.path === '/welcome') {
    return <OnboardingPage store={store} adapter={adapter} route={route} />;
  }

  const props: PageProps = { store, adapter, route };
  let page;
  if (route.path === '/templates/new') page = <EditorPage {...props} />;
  else if (route.path.startsWith('/templates/')) page = <EditorPage {...props} id={route.path.split('/')[2]} />;
  else if (route.path === '/trash') page = <TemplatesPage {...props} trash />;
  else if (route.path === '/analytics') page = <AnalyticsPage {...props} />;
  else if (route.path === '/import-export') page = <ImportExportPage {...props} />;
  else if (route.path === '/settings') page = <SettingsPage {...props} />;
  else if (route.path === '/privacy') page = <PrivacyPage {...props} />;
  else if (route.path === '/about') page = <AboutPage {...props} />;
  else page = <TemplatesPage {...props} />;

  return (
    <div className="shell">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <BrandLockup />
        </div>
        <nav>
          <ul>
            {NAV.map((n) => {
              const active = route.path === n.path || (n.path === '/templates' && (route.path.startsWith('/templates') || route.path === '/trash'));
              return (
                <li key={n.path}>
                  <a href={`#${n.path}`} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}>
                    <Icon name={n.icon} /> {n.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sidebar-foot">
          <ParentBadge />
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            {PRODUCT.ecosystem}
            <br />
            {PRODUCT.tagline}
          </p>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="main">
        {page}
      </main>
    </div>
  );
}
