/* =========================================================================
   FEATURES.JS — fitur interaktif tambahan
   1. Jam live Malang (footer)                       — semua halaman
   2. Menu bahasa (kiri bawah, Google Translate)     — semua halaman
   3. Countdown + form "Ask via WhatsApp"            — Home
   4. Pop-up data pengunjung (visitor gate)          — Home
   Semua teks dibaca dari CMS lewat window.IBMCMS.t(key, default).
   ========================================================================= */
(function () {
  'use strict';

  var doc = document;
  var CFG = window.IBM_CONFIG || {};
  var PAGE = doc.body.getAttribute('data-page') || '';

  function t(key, def) {
    return window.IBMCMS && window.IBMCMS.t ? window.IBMCMS.t(key, def) : def;
  }
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ===================================================================
     1. JAM LIVE MALANG (WIB, Asia/Jakarta)
     =================================================================== */
  var clockFmt = null;
  try {
    clockFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (e) { clockFmt = null; }

  function clockText() {
    if (!clockFmt) return '';
    var p = {};
    clockFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.weekday + ', ' + p.day + ' ' + p.month + ' ' + p.year + ' · ' + p.hour + ':' + p.minute + ':' + p.second + ' WIB';
  }
  function tickClock() {
    var txt = clockText();
    if (!txt) return;
    $$('[data-live-clock]').forEach(function (el) { el.textContent = txt; });
  }
  setInterval(tickClock, 1000);
  doc.addEventListener('cms:rendered', tickClock);
  tickClock();

  /* ===================================================================
     2. MENU BAHASA — Google Website Translator dengan UI sendiri
        Bahasa utama situs adalah English. Pilihan lain diterjemahkan otomatis.
        Pilihan disimpan di cookie "googtrans" (format /en/<kode>).
     =================================================================== */
  // Filipina → Filipino (kode Google "tl"). Timor-Leste → Português (bahasa resmi pendidikan
  // & pemerintahan di sana; terjemahan Google jauh lebih andal dibanding Tetum).
  var DEFAULT_LANGS = 'en:English|id:Bahasa Indonesia|ms:Bahasa Melayu|tl:Filipino|pt:Português|zh-CN:中文 (Chinese)|ja:日本語 (Japanese)|ko:한국어 (Korean)|ar:العربية (Arabic)';
  // Singkatan di tombol bila berbeda dari kode Google ("TL" mudah dikira Timor-Leste)
  var BADGE = { tl: 'FIL' };

  function parseLangs(str) {
    return String(str || DEFAULT_LANGS).split('|').map(function (x) {
      var i = x.indexOf(':');
      return i > 0 ? { code: x.slice(0, i).trim(), label: x.slice(i + 1).trim() } : null;
    }).filter(Boolean);
  }

  function getCookie(name) {
    var m = doc.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function currentLang() {
    var m = /^\/[^/]*\/([\w-]+)$/.exec(getCookie('googtrans'));
    return m ? m[1] : 'en';
  }
  function setLangCookie(code) {
    var host = location.hostname;
    var expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    // hapus dulu semua varian (path / domain) agar tidak ada cookie ganda
    ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
      doc.cookie = 'googtrans=; expires=' + expire + '; path=/' + d;
    });
    if (code !== 'en') {
      doc.cookie = 'googtrans=/en/' + code + '; path=/; max-age=31536000; SameSite=Lax';
    }
  }

  var gtLoaded = false;
  function loadTranslator() {
    if (gtLoaded) return;
    gtLoaded = true;
    var host = doc.createElement('div');
    host.id = 'google_translate_element';
    host.className = 'gt-host';
    host.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(host);
    window.ibmTranslateInit = function () {
      /* global google */
      try { new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element'); } catch (e) { /* abaikan */ }
    };
    var s = doc.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=ibmTranslateInit';
    s.async = true;
    doc.head.appendChild(s);
  }

  var GLOBE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function buildLangSwitch() {
    if ($('.lang-switch')) return;
    var langs = parseLangs(t('global.lang.options', DEFAULT_LANGS));
    var cur = currentLang();
    var curItem = langs.filter(function (l) { return l.code === cur; })[0] || langs[0];

    var wrap = doc.createElement('div');
    wrap.className = 'lang-switch notranslate';
    wrap.setAttribute('translate', 'no');
    wrap.innerHTML =
      '<button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="langMenu">' +
      GLOBE + '<span class="lang-current"></span></button>' +
      '<div class="lang-menu" id="langMenu" hidden>' +
      '<p class="lang-title"></p>' +
      '<ul role="menu"></ul>' +
      '<p class="lang-note"></p></div>';
    doc.body.appendChild(wrap);

    var ul = $('ul', wrap);
    langs.forEach(function (l) {
      var li = doc.createElement('li');
      li.setAttribute('role', 'none');
      var b = doc.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', l.code === cur ? 'true' : 'false');
      b.setAttribute('data-lang', l.code);
      b.innerHTML = '<span></span>' + CHECK;
      $('span', b).textContent = l.label;
      li.appendChild(b);
      ul.appendChild(li);
    });
    $('.lang-title', wrap).textContent = t('global.lang.label', 'Language');
    $('.lang-note', wrap).textContent = t('global.lang.note', 'Automatic translation by Google Translate');

    var btn = $('.lang-btn', wrap), menu = $('.lang-menu', wrap);
    $('.lang-current', wrap).textContent = BADGE[curItem.code] || curItem.code.split('-')[0].toUpperCase();
    btn.setAttribute('aria-label', t('global.lang.label', 'Language'));
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    function openMenu() { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu(); else close();
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (!b) return;
      var code = b.getAttribute('data-lang');
      if (code === currentLang()) { close(); return; }
      setLangCookie(code);
      location.reload();
    });
    doc.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { close(); btn.focus(); } });
  }

  buildLangSwitch();
  if (currentLang() !== 'en') loadTranslator();
  // Teks menu dari CMS baru tersedia setelah render pertama: perbarui label & daftar bahasa bila berubah
  doc.addEventListener('cms:rendered', function () {
    var sw = $('.lang-switch');
    if (!sw) return;
    var wanted = parseLangs(t('global.lang.options', DEFAULT_LANGS)).map(function (l) { return l.code + ':' + l.label; }).join('|');
    var have = $$('[data-lang]', sw).map(function (b) { return b.getAttribute('data-lang') + ':' + $('span', b).textContent; }).join('|');
    if (wanted !== have) { sw.remove(); buildLangSwitch(); return; }
    $('.lang-title', sw).textContent = t('global.lang.label', 'Language');
    $('.lang-note', sw).textContent = t('global.lang.note', 'Automatic translation by Google Translate');
  });

  if (PAGE !== 'home') return;

  /* ===================================================================
     3. COUNTDOWN
     =================================================================== */
  function parseTarget(v) {
    v = String(v || '').trim();
    if (!v) return NaN;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += 'T23:59:59+07:00';   // tanggal saja → akhir hari WIB
    return Date.parse(v);
  }

  function tickCountdown() {
    var box = $('[data-countdown]');
    if (!box) return;
    var target = parseTarget(t('home.join.countdown_target', '2026-12-31T23:59:59+07:00'));
    var ended = $('[data-countdown-ended]');
    if (isNaN(target)) { box.hidden = true; if (ended) ended.hidden = true; return; }
    box.hidden = false;
    var diff = Math.max(0, target - Date.now());
    var s = Math.floor(diff / 1000);
    var vals = { days: Math.floor(s / 86400), hours: Math.floor(s % 86400 / 3600), minutes: Math.floor(s % 3600 / 60), seconds: s % 60 };
    Object.keys(vals).forEach(function (u) {
      var el = $('[data-unit="' + u + '"]', box);
      if (el) el.textContent = pad(vals[u]);
    });
    if (ended) ended.hidden = diff > 0;
  }
  setInterval(tickCountdown, 1000);
  doc.addEventListener('cms:rendered', tickCountdown);
  tickCountdown();

  /* ===================================================================
     4. FORM "ASK VIA WHATSAPP"
     =================================================================== */
  var joinForm = $('#joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = joinForm.elements.name.value.trim();
      var school = joinForm.elements.school.value.trim();
      var message = joinForm.elements.message.value.trim();
      var err = $('#joinError');
      if (name.length < 2 || school.length < 2) {
        err.textContent = t('home.join.error_required', 'Please enter your full name and school of origin.');
        err.hidden = false;
        (name.length < 2 ? joinForm.elements.name : joinForm.elements.school).focus();
        return;
      }
      err.hidden = true;

      var number = String(t('global.contact.whatsapp', '6285174334514')).replace(/\D/g, '');
      var text = String(t('home.join.whatsapp_template',
        'Hello IBM Malang Asia Institute admissions team, my name is {name} from {school}. {message}I would like to ask about the scholarship.'))
        .replace('{name}', name).replace('{school}', school).replace('{message}', message ? message + ' ' : '');
      var url = 'https://wa.me/6285174334514?text=Halo%2C%20Kak%21%20Perkenalkan%2C%20saya%20baru%20saja%20mengunjungi%20website%20IBM%20Institut%20Asia%20Malang.%20Saya%20sangat%20tertarik%20untuk%20mendaftar%20dan%20menjadi%20bagian%20dari%20IBM%20nih%2C%20Kak.%20Kebetulan%20saya%20juga%20ingin%20bertanya%20lebih%20lanjut%20seputar%20program%20beasiswa%20yang%20tersedia.%20Boleh%20minta%20informasi%20lengkapnya%3F%20Terima%20kasih%20banyak%20sebelumnya%21' + encodeURIComponent(text);
      var w = window.open(url, '_blank', 'noopener');
      if (!w) location.href = url;     // pop-up diblokir → buka di tab yang sama
    });
  }

  /* ===================================================================
     5. VISITOR GATE — wajib isi data sebelum mengakses Home
        • Data dikirim ke tabel Supabase `visitor_leads` (hanya INSERT untuk publik).
        • Setelah berhasil, pengunjung diingat di browser (default 30 hari).
        • Bila server tidak terjangkau, data disimpan lokal & dikirim ulang nanti;
          pengunjung tetap boleh masuk agar tidak terkunci karena gangguan teknis.
     =================================================================== */
  var gate = $('#visitorGate');
  var gateForm = $('#gateForm');
  var OK_KEY = 'ibm_visitor_ok';
  var PENDING_KEY = 'ibm_visitor_pending';
  var gateDone = false;

  function isRemembered() {
    try {
      var v = JSON.parse(localStorage.getItem(OK_KEY) || 'null');
      return !!(v && v.exp > Date.now());
    } catch (e) { return false; }
  }
  function remember() {
    var days = parseInt(t('home.gate.remember_days', '30'), 10);
    if (!(days > 0)) days = 30;
    try { localStorage.setItem(OK_KEY, JSON.stringify({ exp: Date.now() + days * 86400000 })); } catch (e) { /* mode privat */ }
  }

  function lockPage(on) { doc.body.classList.toggle('is-gated', on); }

  function closeGate() {
    gateDone = true;
    lockPage(false);
    if (gate && gate.open) gate.close();
  }

  function leadsRequest(row) {
    var base = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
    var headers = { apikey: CFG.SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    if (/^eyJ/.test(CFG.SUPABASE_KEY || '')) headers.Authorization = 'Bearer ' + CFG.SUPABASE_KEY;
    return fetch(base + '/rest/v1/visitor_leads', { method: 'POST', headers: headers, body: JSON.stringify(row) });
  }

  function flushPending() {
    if (!window.IBMCMS || !window.IBMCMS.configured) return;
    var raw;
    try { raw = localStorage.getItem(PENDING_KEY); } catch (e) { return; }
    if (!raw) return;
    var row;
    try { row = JSON.parse(raw); } catch (e) { localStorage.removeItem(PENDING_KEY); return; }
    leadsRequest(row).then(function (res) {
      if (res.ok || (res.status >= 400 && res.status < 500)) localStorage.removeItem(PENDING_KEY);  // 4xx = data ditolak, jangan diulang
    }).catch(function () { /* coba lagi pada kunjungan berikutnya */ });
  }

  function gateError(msg) {
    var el = $('#gateError');
    el.textContent = msg;
    el.hidden = !msg;
  }

  if (gate && gateForm && typeof HTMLDialogElement !== 'undefined') {
    // Tidak bisa ditutup dengan Esc
    gate.addEventListener('cancel', function (e) { e.preventDefault(); });
    // Browser tertentu menutup dialog pada Esc kedua: buka kembali selama formulir belum diisi
    gate.addEventListener('close', function () {
      if (!gateDone) setTimeout(function () { if (!gateDone && !gate.open) gate.showModal(); }, 0);
    });

    if (!isRemembered()) {
      lockPage(true);
      gate.showModal();
      var first = $('input[name="full_name"]', gateForm);
      if (first) first.focus();
    }

    // Admin dapat mematikan gate dari CMS (home.gate.enabled = false)
    doc.addEventListener('cms:rendered', function () {
      if (String(t('home.gate.enabled', 'true')).trim().toLowerCase() === 'false' && !gateDone) closeGate();
      flushPending();
    });

    gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = gateForm.elements;
      var row = {
        full_name: f.full_name.value.trim(),
        school: f.school.value.trim(),
        phone: f.phone.value.trim(),
        email: f.email.value.trim(),
        page_url: location.href.split('#')[0].slice(0, 300),
        referrer: (doc.referrer || '').slice(0, 300)
      };

      if (row.full_name.length < 2) { gateError(t('home.gate.error_name', 'Please enter your full name.')); f.full_name.focus(); return; }
      if (row.school.length < 2) { gateError(t('home.gate.error_school', 'Please enter your school name.')); f.school.focus(); return; }
      if (!/^[0-9+()\-\s]{8,20}$/.test(row.phone) || row.phone.replace(/\D/g, '').length < 8) {
        gateError(t('home.gate.error_phone', 'Please enter a valid phone number.')); f.phone.focus(); return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) { gateError(t('home.gate.error_email', 'Please enter a valid email address.')); f.email.focus(); return; }
      gateError('');

      // Honeypot: bot mengisi kolom tersembunyi → tampak sukses tanpa mengirim apa pun
      if (f.website && f.website.value) { remember(); closeGate(); return; }

      var btn = $('button[type="submit"]', gateForm);
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('home.gate.saving', 'Saving…');

      function enter() { remember(); closeGate(); }
      function restore() { btn.disabled = false; btn.textContent = label; }

      if (!window.IBMCMS || !window.IBMCMS.configured) { enter(); return; }

      leadsRequest(row).then(function (res) {
        if (res.ok) { enter(); return; }
        if (res.status >= 400 && res.status < 500) {          // data ditolak oleh aturan database
          restore();
          gateError(t('home.gate.error_rejected', 'We could not save your details. Please check them and try again.'));
          return;
        }
        throw new Error('server ' + res.status);              // 5xx → perlakukan seperti gangguan jaringan
      }).catch(function () {
        try { localStorage.setItem(PENDING_KEY, JSON.stringify(row)); } catch (e) { /* abaikan */ }
        enter();
      });
    });
  }
})();
