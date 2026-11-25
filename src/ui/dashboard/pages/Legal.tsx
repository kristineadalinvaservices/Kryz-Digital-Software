/**
 * Renders the bundled legal drafts (docs/legal/*.md) as React elements.
 * A tiny, safe Markdown subset: headings, paragraphs, lists, bold, links to https/mailto/#.
 * No HTML from the file is ever interpreted.
 */
import type { ReactNode } from 'react';
import privacyMd from '../../../../docs/legal/PRIVACY-POLICY.md?raw';
import termsMd from '../../../../docs/legal/TERMS-OF-USE.md?raw';
import { BrandLockup } from '../../components/Brand';

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyBase}-${i++}`}>{m[1]}</strong>);
    else if (m[2] && m[3]) {
      const href = m[3];
      const safe = /^(https:\/\/|mailto:|#)/.test(href);
      out.push(safe ? <a key={`${keyBase}-${i++}`} href={href} target={href.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">{m[2]}</a> : m[2]);
    } else if (m[4]) out.push(<code key={`${keyBase}-${i++}`}>{m[4]}</code>);
    else if (m[5]) out.push(<em key={`${keyBase}-${i++}`}>{m[5]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;
  const flush = () => {
    if (para.length) blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>);
    if (list.length) blocks.push(<ul key={k++}>{list.map((l, i) => <li key={i}>{inline(l, `l${k}-${i}`)}</li>)}</ul>);
    para = [];
    list = [];
  };
  for (const line of lines) {
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const li = /^\s*[-*]\s+(.*)$/.exec(line) ?? /^\s*\d+\.\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const level = h[1]!.length;
      const content = inline(h[2]!, `h${k}`);
      blocks.push(level === 1 ? <h1 key={k++}>{content}</h1> : level === 2 ? <h2 key={k++}>{content}</h2> : <h3 key={k++}>{content}</h3>);
    } else if (li) {
      if (para.length) flush();
      list.push(li[1]!);
    } else if (!line.trim()) flush();
    else if (/^>\s?/.test(line)) para.push(line.replace(/^>\s?/, ''));
    else {
      if (list.length) flush();
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  return (
    <main className="legal" id="main">
      <div className="row" style={{ marginBottom: 24 }}>
        <BrandLockup />
        <span className="spacer" />
        <a className="small" href="#/privacy">Privacy &amp; Security Center</a>
      </div>
      <article>{renderMarkdown(doc === 'privacy' ? privacyMd : termsMd)}</article>
    </main>
  );
}
