/* =========================================================================
   THEME.JS — mode terang / gelap.
   • Dimuat di <head> (sinkron, file kecil) agar tema terpasang SEBELUM halaman dicat → tanpa "kedip".
   • Pilihan pengunjung disimpan di localStorage ("ibm_theme": "light" | "dark").
   • DEFAULT_THEME: 'light' = selalu mulai terang (identitas desain), 'system' = ikuti pengaturan perangkat.
   • Tombol di header memakai atribut [data-theme-toggle] (dirender oleh layout.js).
   ========================================================================= */
(function () {
  'use strict';
  var KEY = 'ibm_theme';
  var DEFAULT_THEME = 'light';           // ganti ke 'system' bila ingin mengikuti pengaturan perangkat
  var root = document.documentElement;
  var COLORS = { light: '#173671', dark: '#0A1124' };

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; }
  }
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function initial() {
    var v = stored();
    if (v) return v;
    return DEFAULT_THEME === 'system' && systemDark() ? 'dark' : 'light';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[theme]);
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  apply(initial());
  // meta[name=theme-color] baru ada setelah <head> selesai di-parse
  document.addEventListener('DOMContentLoaded', function () { apply(root.getAttribute('data-theme') || 'light'); });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim');                    // transisi halus sesaat
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* mode privat: abaikan */ }
    setTimeout(function () { root.classList.remove('theme-anim'); }, 380);
  });

  // Sinkron antar-tab; dan (bila DEFAULT_THEME = 'system' & belum memilih) ikuti perubahan sistem
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(initial()); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (!stored() && DEFAULT_THEME === 'system') apply(initial()); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
})();
