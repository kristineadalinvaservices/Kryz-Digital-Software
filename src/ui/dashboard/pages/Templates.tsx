import { useMemo, useState } from 'react';
import { LIMITS } from '../../../shared/constants';
import { findDuplicateShortcuts } from '../../../shared/shortcuts';
import type { Template } from '../../../shared/types';
import { extractVariables, wordCount } from '../../../shared/variables';
import {
  createFolder,
  deleteFolder,
  deleteFromTrash,
  duplicateTemplate,
  emptyTrash,
  patchTemplate,
  recordUsage,
  renameFolder,
  restoreTemplate,
  trashTemplate,
} from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { PersonalizeForm } from '../../components/Personalize';
import { ConfirmDialog, EmptyState, Modal, copyText, useToast } from '../../components/ui';
import { filterTemplates, sortTemplates, type SortKey } from '../../templateQuery';
import { navigate } from '../App';
import type { PageProps } from './types';

type FolderSel = 'all' | 'favorites' | 'pinned' | 'none' | string;

export function TemplatesPage({ store, adapter, route, trash = false }: PageProps & { trash?: boolean }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('smart');
  const folderParam = route.params.get('folder');
  const [folder, setFolderState] = useState<FolderSel>(folderParam ?? 'all');
  const [tag, setTag] = useState<string | null>(null);
  const [using, setUsing] = useState<Template | null>(null);
  const [folderModal, setFolderModal] = useState<{ id?: string; name: string } | null>(null);
  const [folderError, setFolderError] = useState('');
  const [confirm, setConfirm] = useState<null | { kind: 'folder'; id: string; name: string } | { kind: 'purge'; id: string; title: string } | { kind: 'empty' }>(null);

  const setFolder = (f: FolderSel) => {
    setFolderState(f);
    if (trash) navigate('#/templates');
  };

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of store.templates) m.set(t.folderId ?? 'none', (m.get(t.folderId ?? 'none') ?? 0) + 1);
    return m;
  }, [store.templates]);

  const allTags = useMemo(() => [...new Set(store.templates.flatMap((t) => t.tags))].sort(), [store.templates]);
  const duplicates = useMemo(() => findDuplicateShortcuts(store.templates), [store.templates]);

  const list = useMemo(() => {
    const f = filterTemplates(store.templates, {
      query,
      tag,
      favoritesOnly: folder === 'favorites',
      pinnedOnly: folder === 'pinned',
      folderId: folder === 'favorites' || folder === 'pinned' ? 'all' : folder,
    });
    return sortTemplates(f, sort, store.usage);
  }, [store.templates, store.usage, query, tag, folder, sort]);

  async function copy(t: Template, text: string) {
    if (await copyText(text)) {
      await recordUsage(adapter, t.id, wordCount(text));
      toast('Copied to clipboard.');
      setUsing(null);
    } else toast('Could not copy to the clipboard.', { kind: 'error' });
  }

  async function remove(t: Template) {
    await trashTemplate(adapter, t.id);
    toast(`Moved “${t.title}” to Recently deleted.`, {
      action: {
        label: 'Undo',
        run: () => void restoreTemplate(adapter, t.id),
      },
    });
  }

  async function saveFolder() {
    if (!folderModal) return;
    try {
      if (folderModal.id) await renameFolder(adapter, folderModal.id, folderModal.name);
      else {
        const f = await createFolder(adapter, folderModal.name);
        setFolder(f.id);
      }
      setFolderModal(null);
      setFolderError('');
    } catch (e) {
      setFolderError(e instanceof Error ? e.message : 'Could not save folder.');
    }
  }

  const currentFolder = store.folders.find((f) => f.id === folder);
  const heading = trash ? 'Recently deleted' : folder === 'favorites' ? 'Favorites' : folder === 'pinned' ? 'Pinned' : folder === 'none' ? 'No folder' : currentFolder?.name ?? 'All templates';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Your <span className="accent-word">templates</span>
          </h1>
          <p className="lede">Write it once. Personalize it in seconds. You always review before sending.</p>
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => navigate('#/templates/new')}>
          <Icon name="plus" /> New template
        </button>
      </div>

      {duplicates.size > 0 && (
        <div className="callout" role="alert" style={{ marginBottom: 16 }}>
          Some shortcuts are used more than once ({[...duplicates.keys()].join(', ')}). Edit those templates so each shortcut is unique.
        </div>
      )}

      <div className="tpl-layout">
        <nav className="folder-nav" aria-label="Folders">
          <FolderButton current={!trash && folder === 'all'} onClick={() => setFolder('all')} icon="folder" label="All templates" count={store.templates.length} />
          <FolderButton current={!trash && folder === 'favorites'} onClick={() => setFolder('favorites')} icon="star" label="Favorites" count={store.templates.filter((t) => t.favorite).length} />
          <FolderButton current={!trash && folder === 'pinned'} onClick={() => setFolder('pinned')} icon="pin" label="Pinned" count={store.templates.filter((t) => t.pinned).length} />
          <div className="section">Folders</div>
          {store.folders.map((f) => (
            <FolderButton key={f.id} current={!trash && folder === f.id} onClick={() => setFolder(f.id)} icon="folder" label={f.name} count={counts.get(f.id) ?? 0} />
          ))}
          <FolderButton current={!trash && folder === 'none'} onClick={() => setFolder('none')} icon="folder" label="No folder" count={counts.get('none') ?? 0} />
          <button onClick={() => setFolderModal({ name: '' })}>
            <Icon name="plus" /> New folder
          </button>
          <div className="section">Recovery</div>
          <FolderButton current={trash} onClick={() => navigate('#/trash')} icon="trash" label="Recently deleted" count={store.trash.length} />
        </nav>

        <section aria-labelledby="list-h">
          <div className="row" style={{ marginBottom: 10 }}>
            <h2 id="list-h">{heading}</h2>
            {currentFolder && !trash && (
              <>
                <button className="btn ghost sm" onClick={() => setFolderModal({ id: currentFolder.id, name: currentFolder.name })}>
                  <Icon name="edit" /> Rename
                </button>
                <button className="btn ghost sm" onClick={() => setConfirm({ kind: 'folder', id: currentFolder.id, name: currentFolder.name })}>
                  <Icon name="trash" /> Delete folder
                </button>
              </>
            )}
          </div>

          {trash ? (
            <TrashList store={store} onRestore={async (id) => {
              const r = await restoreTemplate(adapter, id);
              toast(r.shortcutCleared ? 'Restored. Its shortcut was already in use, so it was removed.' : 'Template restored.');
            }} onPurge={(id, title) => setConfirm({ kind: 'purge', id, title })} onEmpty={() => setConfirm({ kind: 'empty' })} />
          ) : (
            <>
              <div className="toolbar">
                <label className="search">
                  <Icon name="search" />
                  <span className="sr-only">Search templates</span>
                  <input className="input" type="search" placeholder="Search titles, messages, tags and shortcuts" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
                <label className="row small">
                  <span>Sort</span>
                  <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                    <option value="smart">Pinned & favorites first</option>
                    <option value="name">Name (A to Z)</option>
                    <option value="updated">Recently updated</option>
                    <option value="created">Newest</option>
                    <option value="usage">Most used</option>
                  </select>
                </label>
                {allTags.length > 0 && (
                  <label className="row small">
                    <span>Tag</span>
                    <select className="select" style={{ width: 'auto' }} value={tag ?? ''} onChange={(e) => setTag(e.target.value || null)}>
                      <option value="">Any</option>
                      {allTags.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {store.templates.length === 0 ? (
                <EmptyState title="Your library is empty" action={<div className="row" style={{ justifyContent: 'center' }}><button className="btn primary" onClick={() => navigate('#/templates/new')}><Icon name="plus" /> Create your first template</button><button className="btn" onClick={() => navigate('#/settings')}>Add starter templates</button></div>}>
                  Templates you create are saved on this device.
                </EmptyState>
              ) : list.length === 0 ? (
                <EmptyState title="Nothing matches">Try another search, folder or tag.</EmptyState>
              ) : (
                <ul className="tpl-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {list.map((t) => (
                    <li key={t.id} className="tpl">
                      <div className="row wrap">
                        <span className="tpl-title">{t.title}</span>
                        {t.shortcut && <span className="badge shortcut">{t.shortcut}</span>}
                        {extractVariables(t.body).length > 0 && <span className="badge">{extractVariables(t.body).length} variable{extractVariables(t.body).length === 1 ? '' : 's'}</span>}
                        {t.tags.map((g) => (
                          <span key={g} className="badge">#{g}</span>
                        ))}
                        <span className="spacer" />
                        <span className="small muted">used {store.usage.byTemplate[t.id]?.count ?? 0}×</span>
                      </div>
                      {t.description && <div className="small">{t.description}</div>}
                      <div className="tpl-body">{t.body}</div>
                      <div className="tpl-actions">
                        <button className="btn sm primary" onClick={() => (extractVariables(t.body).length ? setUsing(t) : void copy(t, t.body))}>
                          <Icon name="copy" /> {extractVariables(t.body).length ? 'Personalize & copy' : 'Copy'}
                        </button>
                        <button className="btn sm" onClick={() => navigate(`#/templates/${t.id}`)}>
                          <Icon name="edit" /> Edit
                        </button>
                        <button className="btn sm" onClick={async () => { await duplicateTemplate(adapter, t.id); toast('Duplicated. Shortcut was not copied, so it stays unique.'); }}>
                          <Icon name="duplicate" /> Duplicate
                        </button>
                        <button className="btn sm ghost star" aria-pressed={t.favorite} aria-label={t.favorite ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`} onClick={() => void patchTemplate(adapter, t.id, { favorite: !t.favorite })}>
                          <Icon name="star" />
                        </button>
                        <button className="btn sm ghost pin" aria-pressed={t.pinned} aria-label={t.pinned ? `Unpin ${t.title}` : `Pin ${t.title}`} onClick={() => void patchTemplate(adapter, t.id, { pinned: !t.pinned })}>
                          <Icon name="pin" />
                        </button>
                        <span className="spacer" />
                        <button className="btn sm ghost" aria-label={`Delete ${t.title}`} onClick={() => void remove(t)}>
                          <Icon name="trash" /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      {using && (
        <Modal title={`Personalize: ${using.title}`} onClose={() => setUsing(null)}>
          <PersonalizeForm template={using} profile={store.settings.profile} onCancel={() => setUsing(null)} onCopy={(text) => void copy(using, text)} />
        </Modal>
      )}

      {folderModal && (
        <Modal
          title={folderModal.id ? 'Rename folder' : 'New folder'}
          onClose={() => { setFolderModal(null); setFolderError(''); }}
          footer={
            <>
              <button className="btn" onClick={() => { setFolderModal(null); setFolderError(''); }}>Cancel</button>
              <button className="btn primary" onClick={() => void saveFolder()}>Save</button>
            </>
          }
        >
          <form onSubmit={(e) => { e.preventDefault(); void saveFolder(); }}>
            <label className="field">
              <span className="label">Folder name</span>
              <input className="input" data-autofocus maxLength={LIMITS.folderNameChars} value={folderModal.name} aria-invalid={folderError ? 'true' : undefined} onChange={(e) => setFolderModal({ ...folderModal, name: e.target.value })} />
              {folderError && <span className="error" role="alert">{folderError}</span>}
            </label>
          </form>
        </Modal>
      )}

      {confirm?.kind === 'folder' && (
        <ConfirmDialog
          title={`Delete folder “${confirm.name}”?`}
          body={<p>The folder is removed. Its templates are kept and moved to “No folder”.</p>}
          confirmLabel="Delete folder"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { await deleteFolder(adapter, confirm.id); setFolder('all'); setConfirm(null); toast('Folder deleted. Templates kept.'); }}
        />
      )}
      {confirm?.kind === 'purge' && (
        <ConfirmDialog
          title="Delete permanently?"
          body={<p>“{confirm.title}” and its usage statistics will be erased from this device. This cannot be undone.</p>}
          confirmLabel="Delete permanently"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { await deleteFromTrash(adapter, confirm.id); setConfirm(null); toast('Deleted permanently.'); }}
        />
      )}
      {confirm?.kind === 'empty' && (
        <ConfirmDialog
          title="Empty Recently deleted?"
          body={<p>All {store.trash.length} deleted templates will be erased from this device. This cannot be undone.</p>}
          confirmLabel="Empty"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { await emptyTrash(adapter); setConfirm(null); toast('Recently deleted is now empty.'); }}
        />
      )}
    </>
  );
}

function FolderButton({ current, onClick, icon, label, count }: { current: boolean; onClick: () => void; icon: 'folder' | 'star' | 'pin' | 'trash'; label: string; count: number }) {
  return (
    <button aria-current={current ? 'true' : undefined} onClick={onClick}>
      <Icon name={icon} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span className="count">{count}</span>
    </button>
  );
}

function TrashList({ store, onRestore, onPurge, onEmpty }: { store: PageProps['store']; onRestore: (id: string) => void; onPurge: (id: string, title: string) => void; onEmpty: () => void }) {
  if (!store.trash.length) return <EmptyState title="Nothing here">Deleted templates stay here for {LIMITS.trashRetentionDays} days so you can restore them.</EmptyState>;
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0 }}>Kept for {LIMITS.trashRetentionDays} days, then erased automatically.</p>
        <span className="spacer" />
        <button className="btn sm danger" onClick={onEmpty}>Empty now</button>
      </div>
      <ul className="tpl-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {store.trash.map(({ template: t, deletedAt }) => {
          const daysLeft = Math.max(0, LIMITS.trashRetentionDays - Math.floor((Date.now() - deletedAt) / 86400000));
          return (
            <li key={t.id} className="tpl">
              <div className="row">
                <span className="tpl-title">{t.title}</span>
                <span className="spacer" />
                <span className="small muted">Deleted {new Date(deletedAt).toLocaleDateString()} · {daysLeft} days left</span>
              </div>
              <div className="tpl-body">{t.body}</div>
              <div className="tpl-actions">
                <button className="btn sm primary" onClick={() => onRestore(t.id)}>
                  <Icon name="restore" /> Restore
                </button>
                <button className="btn sm danger" onClick={() => onPurge(t.id, t.title)}>
                  Delete permanently
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
