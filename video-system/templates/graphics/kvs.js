// Fills a template from window.KVS (set by render_graphics.mjs) or URL ?p=<json>.
// Uses textContent only. Accent words: wrap in [brackets] -> serif italic pink. Keywords: wrap in *stars* -> yellow.
(function () {
  const q = new URLSearchParams(location.search).get('p');
  const P = Object.assign({}, window.KVS_DEFAULTS || {}, q ? JSON.parse(q) : {}, window.KVS || {});
  window.P = P;
  const dur = Number(P.duration || 4);
  document.documentElement.style.setProperty('--exit-at', (dur - 0.35) + 's');
  function rich(el, text) {
    el.textContent = '';
    String(text).split(/(\[[^\]]+\]|\*[^*]+\*)/).forEach(function (part) {
      if (!part) return;
      const s = document.createElement('span');
      if (part[0] === '[') { s.className = 'accent'; s.textContent = part.slice(1, -1); }
      else if (part[0] === '*') { s.className = 'kw'; s.textContent = part.slice(1, -1); }
      else { s.textContent = part; }
      el.appendChild(s);
    });
  }
  document.querySelectorAll('[data-field]').forEach(function (el) {
    const v = P[el.dataset.field];
    if (v === undefined || v === '') { if (el.dataset.optional !== undefined) el.style.display = 'none'; return; }
    if (el.tagName === 'IMG') el.src = v; else rich(el, v);
  });
  document.querySelectorAll('[data-style]').forEach(function (el) {
    el.dataset.style.split(';').forEach(function (pair) {
      const [prop, key] = pair.split(':'); if (P[key] !== undefined) el.style.setProperty(prop.trim(), P[key]);
    });
  });
})();
