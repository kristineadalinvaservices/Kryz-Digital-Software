// Runs synchronously before first paint to apply the saved theme (no wrong-theme flash).
// Reads only the theme/motion preference mirrored by the app. No user content.
(function () {
  var root = document.documentElement;
  try {
    var pref = localStorage.getItem('kqr-theme') || 'system';
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = pref === 'system' ? (dark ? 'signature' : 'light') : pref === 'signature' ? 'signature' : 'light';
    root.dataset.motion = localStorage.getItem('kqr-motion') || 'system';
  } catch (e) {
    root.dataset.theme = 'light';
  }
})();
