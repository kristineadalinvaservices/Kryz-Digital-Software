import { useMemo, useState } from 'react';
import { summarize } from '../../../shared/analytics';
import { clearUsage, updateSettings } from '../../../storage/repository';
import { Icon } from '../../components/icons';
import { ConfirmDialog, EmptyState, useToast } from '../../components/ui';
import type { PageProps } from './types';

function fmtMinutes(m: number): string {
  if (m < 1) return `${Math.round(m * 60)} sec`;
  if (m < 60) return `${Math.round(m)} min`;
  return `${(m / 60).toFixed(1)} h`;
}

export function AnalyticsPage({ store, adapter }: PageProps) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const s = useMemo(() => summarize(store.usage, store.templates, store.folders, store.settings.typingWpm), [store]);
  const max7 = Math.max(1, ...s.last7Days.map((d) => d.count));
  const maxFolder = Math.max(1, ...s.byFolder.map((f) => f.count));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Your <span className="accent-word">momentum</span>
          </h1>
          <p className="lede">Counted on this device only. Never sent anywhere.</p>
        </div>
        <span className="spacer" />
        <button className="btn danger" onClick={() => setConfirm(true)} disabled={s.totalUses === 0}>
          Clear statistics
        </button>
      </div>

      {s.totalUses === 0 ? (
        <EmptyState title="No activity yet">Copy, insert or expand a template and your stats will appear here.</EmptyState>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          <div className="grid grid-4">
            <div className="stat"><div className="value">{s.totalUses}</div><div className="label">Total template uses</div></div>
            <div className="stat"><div className="value">{s.last7Total}</div><div className="label">Last 7 days</div></div>
            <div className="stat"><div className="value">{s.last30Total}</div><div className="label">Last 30 days</div></div>
            <div className="stat">
              <div className="value">{fmtMinutes(s.estimatedMinutes)}</div>
              <div className="label">Estimated time saved <span className="badge warn">estimate</span></div>
            </div>
          </div>

          <section className="card" aria-labelledby="daily-h">
            <h3 id="daily-h">Daily activity, last 7 days</h3>
            <div className="bars" aria-hidden="true">
              {s.last7Days.map((d) => (
                <div className="bar" key={d.day}>
                  <div className="fill" style={{ height: `${(d.count / max7) * 100}%` }} />
                  <span className="n">{d.count}</span>
                  <span className="d">{new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Template uses per day</caption>
              <tbody>
                {s.last7Days.map((d) => (
                  <tr key={d.day}><th scope="row">{d.day}</th><td>{d.count}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="grid grid-2">
            <section className="card" aria-labelledby="top-h">
              <h3 id="top-h">Most-used templates</h3>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {s.topTemplates.map((t) => (
                  <li key={t.id} style={{ margin: '6px 0' }}>
                    <strong>{t.title}</strong> <span className="muted">— {t.count}×</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="card" aria-labelledby="cat-h">
              <h3 id="cat-h">Usage by folder</h3>
              {s.byFolder.map((f) => (
                <div className="hbar" key={f.name}>
                  <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span className="track" aria-hidden="true"><span style={{ width: `${(f.count / maxFolder) * 100}%` }} /></span>
                  <span className="small"><strong>{f.count}</strong></span>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}

      <section className="card" style={{ marginTop: 20 }} aria-labelledby="assume-h">
        <h3 id="assume-h"><Icon name="info" /> How time saved is estimated</h3>
        <p className="muted">
          Estimated minutes = words inserted ÷ your typing speed. It does not include time spent thinking or editing, so treat it as a rough guide, not a measurement. {s.totalWords.toLocaleString()} words inserted so far.
        </p>
        <label className="field" style={{ maxWidth: 260 }}>
          <span className="label">Your typing speed (words per minute)</span>
          <input
            className="input"
            type="number"
            min={5}
            max={200}
            value={store.settings.typingWpm}
            onChange={(e) => {
              const v = Math.round(Number(e.target.value));
              if (v >= 5 && v <= 200) void updateSettings(adapter, { typingWpm: v });
            }}
          />
        </label>
      </section>

      {confirm && (
        <ConfirmDialog
          title="Clear usage statistics?"
          body={<p>All usage counts and daily activity are erased from this device. Your templates are not affected.</p>}
          confirmLabel="Clear statistics"
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            await clearUsage(adapter);
            setConfirm(false);
            toast('Statistics cleared.');
          }}
        />
      )}
    </>
  );
}
