import { useEffect, useMemo, useRef, useState } from 'react';
import { PRODUCT } from '../../shared/constants';
import type { Template } from '../../shared/types';
import { extractVariables, wordCount } from '../../shared/variables';
import { siteOriginFromUrl } from '../../shared/validation';
import { consentIsCurrent, recordUsage } from '../../storage/repository';
import { BrandLockup } from '../components/Brand';
import { Icon } from '../components/icons';
import { PersonalizeForm } from '../components/Personalize';
import { EmptyState, ErrorState, Loading, copyText, useToast } from '../components/ui';
import { useStore } from '../hooks/useStore';
import { activeTab, hasOriginPermission, insertIntoActiveTab } from '../tabActions';
import { filterTemplates, sortTemplates } from '../templateQuery';

function openDashboard(hash = '#/templates') {
  void chrome.tabs.create({ url: chrome.runtime.getURL(`dashboard.html${hash}`) });
  window.close();
}

export function Popup() {
  const { store, error, adapter, reload } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'pinned'>('all');
  const [active, setActive] = useState<Template | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [siteOn, setSiteOn] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const tab = await activeTab();
      const o = siteOriginFromUrl(tab?.url);
      setOrigin(o);
    })();
  }, []);

  useEffect(() => {
    if (!store || !origin) return;
    void (async () => {
      const granted = await hasOriginPermission(origin);
      setSiteOn(granted && store.settings.expansionEnabled && store.settings.expansionSites.includes(origin));
    })();
  }, [store, origin]);

  const list = useMemo(() => {
    if (!store) return [];
    const f = filterTemplates(store.templates, { query, favoritesOnly: filter === 'favorites', pinnedOnly: filter === 'pinned' });
    return sortTemplates(f, 'smart', store.usage);
  }, [store, query, filter]);

  if (error) return <div style={{ padding: 16 }}><ErrorState message={error} onRetry={reload} /></div>;
  if (!store) return <Loading />;

  if (!consentIsCurrent(store.consent)) {
    return (
      <div className="popup">
        <header className="popup-head"><BrandLockup compact /></header>
        <div className="popup-body">
          <EmptyState title="Finish setting up" action={<button className="btn primary" onClick={() => openDashboard('#/welcome')}>Open welcome screen</button>}>
            Review how {PRODUCT.name} handles your data, then accept the Terms of Use to start.
          </EmptyState>
        </div>
      </div>
    );
  }

  async function doCopy(t: Template, text: string) {
    const ok = await copyText(text);
    if (ok) {
      await recordUsage(adapter, t.id, wordCount(text));
      toast('Copied. Paste it where you need it.');
      setActive(null);
    } else toast('Could not copy to the clipboard.', { kind: 'error' });
  }

  async function doInsert(t: Template, text: string) {
    const res = await insertIntoActiveTab(text);
    if (res.ok) {
      await recordUsage(adapter, t.id, wordCount(text));
      window.close();
    } else toast(res.reason ?? 'Could not insert.', { kind: 'error' });
  }

  function start(t: Template, mode: 'copy' | 'insert') {
    if (extractVariables(t.body).length) setActive(t);
    else void (mode === 'copy' ? doCopy(t, t.body) : doInsert(t, t.body));
  }

  return (
    <div className="popup">
      <header className="popup-head">
        <BrandLockup compact />
        <span className="spacer" />
        <button className="btn ghost icon-btn" onClick={() => openDashboard('#/templates/new')} aria-label="New template" title="New template">
          <Icon name="plus" />
        </button>
        <button className="btn ghost icon-btn" onClick={() => openDashboard()} aria-label="Open dashboard" title="Open dashboard">
          <Icon name="external" />
        </button>
      </header>
      <div className="gradient-bar" style={{ borderRadius: 0, height: 3 }} />

      {active ? (
        <div className="popup-body">
          <button className="btn ghost sm" onClick={() => setActive(null)} style={{ marginBottom: 8 }}>
            <Icon name="back" /> Back
          </button>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>{active.title}</h2>
          <PersonalizeForm
            compact
            template={active}
            profile={store.settings.profile}
            onCancel={() => setActive(null)}
            onCopy={(text) => void doCopy(active, text)}
            onInsert={(text) => void doInsert(active, text)}
          />
        </div>
      ) : (
        <>
          <div className="popup-tools">
            <label className="search">
              <Icon name="search" />
              <span className="sr-only">Search templates</span>
              <input ref={searchRef} className="input" type="search" placeholder="Search templates, tags, shortcuts" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            </label>
            <div className="segmented" role="group" aria-label="Filter">
              {(['all', 'favorites', 'pinned'] as const).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'favorites' ? 'Favorites' : 'Pinned'}
                </button>
              ))}
            </div>
          </div>
          <div className="popup-body" role="region" aria-label="Templates">
            {store.templates.length === 0 ? (
              <EmptyState title="No templates yet" action={<button className="btn primary" onClick={() => openDashboard('#/templates/new')}><Icon name="plus" /> Create a template</button>}>
                Save a message once and reuse it anywhere.
              </EmptyState>
            ) : list.length === 0 ? (
              <EmptyState title="No matches">Try a different word, or clear the filter.</EmptyState>
            ) : (
              <ul className="tpl-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {list.map((t) => (
                  <li key={t.id} className="tpl">
                    <div className="row">
                      <span className="tpl-title">{t.title}</span>
                      {t.pinned && <span className="badge" title="Pinned"><Icon name="pin" size={11} /></span>}
                      <span className="spacer" />
                      {t.shortcut && <span className="badge shortcut">{t.shortcut}</span>}
                    </div>
                    <div className="tpl-body">{t.body}</div>
                    <div className="tpl-actions">
                      <button className="btn sm" onClick={() => start(t, 'copy')} aria-label={`Copy ${t.title}`}>
                        <Icon name="copy" /> Copy
                      </button>
                      <button className="btn sm primary" onClick={() => start(t, 'insert')} aria-label={`Insert ${t.title} into the page`}>
                        <Icon name="insert" /> Insert
                      </button>
                      {extractVariables(t.body).length > 0 && <span className="small muted">personalize first</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <footer className="popup-foot">
            {origin ? (
              <div className="row">
                <Icon name="bolt" />
                <span className="small">
                  Shortcuts on <strong>{new URL(origin).hostname}</strong>: {siteOn ? <span className="badge good">On</span> : <span className="badge">Off</span>}
                </span>
                <span className="spacer" />
                <button className="btn sm" onClick={() => openDashboard(`#/settings?site=${encodeURIComponent(origin)}`)}>
                  {siteOn ? 'Manage' : 'Turn on'}
                </button>
              </div>
            ) : (
              <span className="small muted">Shortcuts are not available on this page.</span>
            )}
            <div className="row small muted" style={{ marginTop: 6 }}>
              <Icon name="shield" size={14} />
              <span>Saved on this device only.</span>
              <span className="spacer" />
              <a href="#" onClick={(e) => { e.preventDefault(); openDashboard('#/privacy'); }}>Privacy &amp; Security</a>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
