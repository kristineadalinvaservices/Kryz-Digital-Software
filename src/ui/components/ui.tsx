/** Reusable accessible building blocks shared by the popup and dashboard. */
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BrandLogo } from './Brand';
import { Icon } from './icons';

// ---------- Modal with focus trap ----------
export function Modal({ title, onClose, children, footer, describedBy }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; describedBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((e) => !e.hasAttribute('disabled'));
    (node?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const first = list[0]!;
        const last = list[list.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={describedBy} ref={ref}>
        <header>
          <h2 id={titleId} style={{ flex: 1 }}>
            {title}
          </h2>
          <button className="btn ghost icon-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </header>
        {children}
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

// ---------- Confirm dialog (destructive actions) ----------
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger = true,
  typeToConfirm,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  typeToConfirm?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyId = useId();
  const ok = !typeToConfirm || typed.trim() === typeToConfirm;
  return (
    <Modal
      title={title}
      onClose={onCancel}
      describedBy={bodyId}
      footer={
        <>
          <button className="btn" onClick={onCancel} data-autofocus>
            Cancel
          </button>
          <button
            className={danger ? 'btn danger solid' : 'btn primary'}
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div id={bodyId} className="stack">
        {body}
      </div>
      {typeToConfirm && (
        <label className="field" style={{ marginTop: 16 }}>
          <span className="label">
            Type <strong>{typeToConfirm}</strong> to confirm
          </span>
          <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
      )}
    </Modal>
  );
}

// ---------- Toasts ----------
interface ToastItem {
  id: number;
  text: string;
  kind: 'info' | 'error';
  action?: { label: string; run: () => void };
}
const ToastCtx = createContext<(text: string, opts?: { kind?: 'info' | 'error'; action?: ToastItem['action'] }) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, opts?: { kind?: 'info' | 'error'; action?: ToastItem['action'] }) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, text, kind: opts?.kind ?? 'info', action: opts?.action }]);
    window.setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), opts?.action ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            <span>{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  setItems((x) => x.filter((i) => i.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------- Empty / loading / error states ----------
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <BrandLogo variant="symbol" height={40} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="empty" role="status" aria-live="polite">
      <div className="gradient-bar" style={{ width: 80, margin: '0 auto 12px' }} />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="callout danger" role="alert">
      <strong>Something went wrong.</strong> {message}
      {onRetry && (
        <div style={{ marginTop: 8 }}>
          <button className="btn sm" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Download a JSON object as a file (local only; nothing is uploaded). */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for contexts where the async clipboard API is unavailable.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
