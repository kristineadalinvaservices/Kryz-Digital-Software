/**
 * Shortcut expander content script.
 *
 * Runs ONLY on sites the user switched on and granted access to (registered dynamically by the
 * background worker). Privacy rules enforced here:
 *  - Looks at no more than ~32 characters immediately before the caret, and only after an
 *    `input` event inside a field that passed the safety check.
 *  - Never stores, logs or sends what the user types. Only a matched shortcut name (for
 *    example "/intro") is sent to the background to fetch that template.
 *  - Never expands automatically: the user must press the expand key or click the prompt.
 *  - UI lives in a closed shadow root and is built with textContent only (no innerHTML).
 */
import { LIMITS, PRODUCT } from '../shared/constants';
import { classifyField, deepActiveElement } from '../shared/fieldSafety';
import type { GetShortcutsResponse, ResolveShortcutResponse } from '../shared/messages';
import { trailingShortcutToken } from '../shared/shortcuts';
import { defaultValues, extractVariables, missingVariables, renderTemplate, tokenize, wordCount } from '../shared/variables';

declare global {
  interface Window {
    __kqrExpanderLoaded?: boolean;
  }
}

type Editable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

interface Pending {
  el: Editable;
  token: string;
  /** For inputs/textareas: caret offset. For contenteditable: text node + offset. */
  caret: number;
  node: Text | null;
}

(function main() {
  if (window.__kqrExpanderLoaded) return;
  window.__kqrExpanderLoaded = true;

  let shortcuts = new Map<string, string>(); // shortcut -> title
  let enabled = false;
  let expandKey: 'Tab' | 'Enter' = 'Tab';
  let lastRefresh = 0;
  let pending: Pending | null = null;
  let dismissedToken: string | null = null;
  let formOpen = false;

  // ---------- UI (closed shadow root) ----------
  const host = document.createElement('kryz-quick-reply');
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.top = '0';
  host.style.left = '0';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .chip, .panel, .toast { position: fixed; background: #141012; color: #F3E9EC; border: 1px solid #3a2f34;
      border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.35); font-size: 13px; line-height: 1.4; }
    .chip { display: flex; align-items: center; gap: 8px; padding: 6px 10px; cursor: pointer; max-width: 360px; }
    .chip:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid #FFD23F; outline-offset: 2px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#FF3D9A,#FFD23F); flex: none; }
    .title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    kbd { background: #2a2226; border: 1px solid #4a3d43; border-radius: 4px; padding: 0 5px; font-size: 12px; color: #FFD23F; font-family: inherit; }
    .muted { color: #c9bcc2; }
    .panel { width: 360px; max-width: calc(100vw - 16px); padding: 14px; }
    .panel h2 { margin: 0 0 2px; font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
    .brand { font-size: 11px; color: #c9bcc2; margin-bottom: 10px; }
    label { display: block; font-size: 12px; font-weight: 600; margin: 8px 0 3px; }
    input { width: 100%; padding: 7px 9px; border-radius: 7px; border: 1px solid #4a3d43; background: #1e181b; color: #F3E9EC; font-size: 13px; }
    .preview { margin-top: 10px; padding: 8px; background: #1e181b; border-radius: 7px; max-height: 140px; overflow: auto; white-space: pre-wrap; font-size: 12px; }
    .var { background: rgba(255,61,154,.18); color: #ff8cc4; border-radius: 3px; padding: 0 2px; }
    .var.filled { background: rgba(255,210,63,.16); color: #FFD23F; }
    .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    button { font: inherit; font-weight: 700; border-radius: 8px; padding: 7px 12px; cursor: pointer; border: 1px solid #4a3d43; background: transparent; color: #F3E9EC; }
    button.primary { background: #FF3D9A; color: #141012; border-color: #FF3D9A; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .err { color: #ffb4b4; font-size: 12px; margin-top: 6px; min-height: 1em; }
    .toast { padding: 8px 12px; }
    @media (prefers-reduced-motion: no-preference) { .chip, .panel, .toast { animation: in .12s ease-out; } }
    @keyframes in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  `;
  // Constructed stylesheets are not blocked by the host page's style CSP; fall back to <style>.
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style.textContent ?? '');
    root.adoptedStyleSheets = [sheet];
  } catch {
    root.appendChild(style);
  }
  let mounted = false;
  function mount() {
    if (!mounted) {
      document.documentElement.appendChild(host);
      mounted = true;
    }
  }

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function place(node: HTMLElement, anchor: Element, width: number, height: number) {
    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = r.bottom + 6;
    if (top + height > vh - 8) top = Math.max(8, r.top - height - 6);
    const left = Math.min(Math.max(8, r.left), Math.max(8, vw - width - 8));
    node.style.top = `${Math.round(top)}px`;
    node.style.left = `${Math.round(left)}px`;
  }

  let chip: HTMLElement | null = null;
  function hideChip() {
    chip?.remove();
    chip = null;
  }
  function showChip(p: Pending) {
    mount();
    hideChip();
    const c = el('div', 'chip');
    c.setAttribute('role', 'status');
    c.setAttribute('aria-live', 'polite');
    c.tabIndex = -1;
    c.append(el('span', 'dot'));
    const title = el('span', 'title', shortcuts.get(p.token) ?? p.token);
    const hint = el('span', 'muted');
    hint.append(document.createTextNode('Press '), el('kbd', undefined, expandKey), document.createTextNode(' to insert · '), el('kbd', undefined, 'Esc'));
    c.append(title, hint);
    c.addEventListener('mousedown', (e) => {
      e.preventDefault(); // keep focus in the field
      void expand();
    });
    root.appendChild(c);
    chip = c;
    place(c, p.el, 360, 34);
  }

  let toastTimer: number | undefined;
  function toast(message: string) {
    mount();
    root.querySelector('.toast')?.remove();
    const t = el('div', 'toast', message);
    t.setAttribute('role', 'status');
    t.style.bottom = '16px';
    t.style.right = '16px';
    root.appendChild(t);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => t.remove(), 4000);
  }

  // ---------- data from background ----------
  async function refresh(force = false) {
    if (!force && Date.now() - lastRefresh < 3000) return;
    lastRefresh = Date.now();
    try {
      const res = (await chrome.runtime.sendMessage({ type: 'kqr/getShortcuts' })) as GetShortcutsResponse | undefined;
      enabled = !!res?.enabled;
      expandKey = res?.expandKey === 'Enter' ? 'Enter' : 'Tab';
      shortcuts = new Map((res?.shortcuts ?? []).map((s) => [s.shortcut, s.title]));
    } catch {
      enabled = false; // extension reloaded or access revoked
      shortcuts = new Map();
    }
    if (!enabled) {
      pending = null;
      hideChip();
    }
  }

  // ---------- caret helpers (read only a short window before the caret) ----------
  function readBeforeCaret(target: Editable): Pending | null {
    const verdict = classifyField(target);
    if (!verdict.safe) return null;
    if (verdict.kind === 'input' || verdict.kind === 'textarea') {
      const f = target as HTMLInputElement | HTMLTextAreaElement;
      if (f.selectionStart === null || f.selectionStart !== f.selectionEnd) return null;
      const caret = f.selectionStart;
      const before = f.value.slice(Math.max(0, caret - LIMITS.expanderLookbehind - 1), caret);
      const token = trailingShortcutToken(before);
      return token ? { el: target, token, caret, node: null } : null;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE || !target.contains(node)) return null;
    const text = node as Text;
    const caret = sel.anchorOffset;
    const before = text.data.slice(Math.max(0, caret - LIMITS.expanderLookbehind - 1), caret);
    const token = trailingShortcutToken(before);
    return token ? { el: target, token, caret, node: text } : null;
  }

  function tokenStillThere(p: Pending): boolean {
    if (!p.el.isConnected) return false;
    if (p.node) return p.node.isConnected && p.node.data.slice(p.caret - p.token.length, p.caret).toLowerCase() === p.token;
    const f = p.el as HTMLInputElement | HTMLTextAreaElement;
    return f.value.slice(p.caret - p.token.length, p.caret).toLowerCase() === p.token;
  }

  function replaceToken(p: Pending, text: string): boolean {
    if (!tokenStillThere(p)) return false;
    const start = p.caret - p.token.length;
    if (!p.node) {
      const f = p.el as HTMLInputElement | HTMLTextAreaElement;
      f.focus();
      f.setSelectionRange(start, p.caret);
      let ok = false;
      try {
        ok = document.execCommand('insertText', false, text); // preserves native undo
      } catch {
        ok = false;
      }
      if (!ok || f.value.slice(start, start + text.length) !== text) {
        f.setRangeText(text, start, p.caret, 'end');
        f.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
      return true;
    }
    (p.el as HTMLElement).focus();
    const range = document.createRange();
    range.setStart(p.node, start);
    range.setEnd(p.node, p.caret);
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      return document.execCommand('insertText', false, text);
    } catch {
      return false;
    }
  }

  async function fallbackCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${PRODUCT.name}: this field could not be filled automatically. The message was copied — paste it with Ctrl+V / Cmd+V.`);
    } catch {
      toast(`${PRODUCT.name}: this field could not be filled automatically. Open the extension to copy the message.`);
    }
  }

  async function finish(p: Pending, templateId: string, text: string) {
    const ok = replaceToken(p, text);
    if (!ok) await fallbackCopy(text);
    try {
      await chrome.runtime.sendMessage({ type: 'kqr/recordUse', templateId, words: wordCount(text) });
    } catch {
      /* analytics are best-effort and local */
    }
  }

  async function expand() {
    const p = pending;
    if (!p) return;
    hideChip();
    pending = null;
    let res: ResolveShortcutResponse | undefined;
    try {
      res = (await chrome.runtime.sendMessage({ type: 'kqr/resolveShortcut', shortcut: p.token })) as ResolveShortcutResponse;
    } catch {
      res = undefined;
    }
    if (!res || !res.found) {
      toast(`${PRODUCT.name}: shortcut is no longer available here.`);
      return;
    }
    const vars = extractVariables(res.body);
    if (!vars.length) {
      await finish(p, res.templateId, res.body);
      return;
    }
    openForm(p, res);
  }

  // ---------- personalization panel ----------
  function openForm(p: Pending, res: Extract<ResolveShortcutResponse, { found: true }>) {
    mount();
    formOpen = true;
    const vars = extractVariables(res.body);
    const values = defaultValues(vars, { senderName: res.senderName, meetingLink: res.meetingLink });
    const panel = el('div', 'panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', `Personalize ${res.title}`);
    panel.append(el('h2', undefined, res.title), el('div', 'brand', `${PRODUCT.name} · fill in the details, then review`));
    const form = el('form');
    const inputs: HTMLInputElement[] = [];
    vars.forEach((v, i) => {
      const id = `kqr-v-${i}`;
      const lab = el('label', undefined, v.label);
      lab.htmlFor = id;
      const inp = el('input');
      inp.id = id;
      inp.autocomplete = 'off';
      inp.spellcheck = true;
      inp.maxLength = LIMITS.variableValueChars;
      inp.value = values[v.key] ?? '';
      if (v.placeholder) inp.placeholder = v.placeholder;
      inp.addEventListener('input', () => {
        values[v.key] = inp.value;
        update();
      });
      inputs.push(inp);
      form.append(lab, inp);
    });
    const preview = el('div', 'preview');
    preview.setAttribute('aria-label', 'Preview');
    const err = el('div', 'err');
    err.setAttribute('aria-live', 'polite');
    const row = el('div', 'row');
    const cancel = el('button', undefined, 'Cancel');
    cancel.type = 'button';
    const insert = el('button', 'primary', 'Insert');
    insert.type = 'submit';
    row.append(cancel, insert);
    form.append(preview, err, row);
    panel.append(form);

    function update() {
      preview.textContent = '';
      for (const part of tokenize(res.body, values)) {
        if (part.variable) preview.append(el('span', part.filled ? 'var filled' : 'var', part.text));
        else preview.append(document.createTextNode(part.text));
      }
      const missing = missingVariables(vars, values);
      insert.disabled = missing.length > 0;
      err.textContent = missing.length ? `Still needed: ${missing.map((m) => m.label).join(', ')}` : '';
    }
    function close() {
      formOpen = false;
      panel.remove();
      document.removeEventListener('keydown', onEsc, true);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        (p.el as HTMLElement).focus();
      }
    }
    cancel.addEventListener('click', () => {
      close();
      (p.el as HTMLElement).focus();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (missingVariables(vars, values).length) return;
      const text = renderTemplate(res.body, values);
      close();
      void finish(p, res.templateId, text);
    });
    // Keep our panel's keystrokes from reaching page handlers where we can (bubble phase).
    for (const t of ['keydown', 'keyup', 'keypress', 'input'] as const) panel.addEventListener(t, (e) => e.stopPropagation());
    document.addEventListener('keydown', onEsc, true);
    update();
    root.appendChild(panel);
    place(panel, p.el, 360, Math.min(520, 200 + vars.length * 52));
    inputs.find((i) => !i.value)?.focus() ?? inputs[0]?.focus();
  }

  // ---------- event wiring ----------
  document.addEventListener(
    'focusin',
    () => {
      const t = deepActiveElement(document);
      if (t && classifyField(t).safe) void refresh();
    },
    true,
  );

  document.addEventListener(
    'input',
    () => {
      if (formOpen) return;
      const t = deepActiveElement(document) as Editable | null;
      if (!enabled || !t || !shortcuts.size) {
        hideChip();
        pending = null;
        return;
      }
      const p = readBeforeCaret(t);
      if (p && shortcuts.has(p.token) && p.token !== dismissedToken) {
        pending = p;
        showChip(p);
      } else {
        if (!p) dismissedToken = null;
        pending = null;
        hideChip();
      }
    },
    true,
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (!pending || !chip || formOpen) return;
      if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === 'Escape') {
        dismissedToken = pending.token;
        pending = null;
        hideChip();
        return;
      }
      if (e.key === expandKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        void expand();
      }
    },
    true,
  );

  document.addEventListener('focusout', () => {
    // Defer so a click on the chip can still run.
    window.setTimeout(() => {
      if (!formOpen && deepActiveElement(document) !== pending?.el) {
        pending = null;
        hideChip();
      }
    }, 150);
  });

  void refresh(true);
})();
