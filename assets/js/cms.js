/* =========================================================================
   CMS.JS — mengambil data dari Supabase (REST/PostgREST) dan menampilkannya.

   Cara kerja singkat
   1. Teks/gambar/tautan tunggal   → atribut di HTML:
        data-cms="home.hero.title"        isi teks
        data-cms-src="home.hero.image"    atribut src (+ alt dari kolom alt_text)
        data-cms-href="home.hero.cta_url" atribut href
        data-cms-content="..."            atribut content (meta tag)
        data-cms-bg="..."                 background-image
      Nilainya diambil dari tabel `site_content`. Nilai kosong = elemen disembunyikan.
   2. Daftar berulang (dosen, FAQ, berita, dll) → atribut data-collection="nama".
      Definisi tiap koleksi ada di objek COLLECTIONS di bawah.
   3. Kecepatan & ketahanan:
        - Cache localStorage (stale-while-revalidate): kunjungan berikutnya tampil instan,
          lalu diperbarui diam-diam dari Supabase.
        - Bila Supabase tidak terjangkau, tampil data bawaan (fallback-data.js).
        - Semua teks di-escape; HTML kaya disaring (sanitizer) → aman dari XSS.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.IBM_CONFIG || {};
  var FALLBACK = window.IBM_FALLBACK || { content: [], collections: {} };
  var root = document.documentElement;
  var PAGE = document.body.getAttribute('data-page') || 'home';

  var CONFIGURED = !!(CFG.SUPABASE_URL && CFG.SUPABASE_KEY) &&
    !/YOUR-/i.test(CFG.SUPABASE_URL + CFG.SUPABASE_KEY);

  /* ----------------------------- Utilitas ----------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Hanya izinkan http(s), mailto, tel, jalur relatif, dan #anchor. Menolak javascript:, data:, dll.
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    return /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|[\w\-\/]+(\.\w+)?(\?[^\s]*)?(#[^\s]*)?$)/i.test(u) ? u : '';
  }

  function isExternal(u) { return /^https?:\/\//i.test(u); }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    if (!m) return '';
    return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }

  function fmtRp(n) {
    n = Number(n);
    if (!isFinite(n)) return '';
    return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // HTML kaya: hanya tag aman yang dipertahankan
  var ALLOWED_TAGS = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, A: 1, P: 1, UL: 1, OL: 1, LI: 1, SPAN: 1, SMALL: 1 };
  var ARTICLE_TAGS = { H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, IMG: 1 };
  function cleanInto(src, dest, article) {
    Array.prototype.forEach.call(src.childNodes, function (c) {
      if (c.nodeType === 3) {
        dest.appendChild(document.createTextNode(c.nodeValue));
      } else if (c.nodeType === 1) {
        if (article && c.tagName === 'IMG') {
          var iu = safeUrl(c.getAttribute('src'));
          if (iu) {
            var im = document.createElement('img');
            im.setAttribute('src', iu);
            im.setAttribute('alt', c.getAttribute('alt') || '');
            im.setAttribute('loading', 'lazy');
            dest.appendChild(im);
          }
        } else if (ALLOWED_TAGS[c.tagName] || (article && ARTICLE_TAGS[c.tagName])) {
          var n = document.createElement(c.tagName.toLowerCase());
          if (c.tagName === 'A') {
            var h = safeUrl(c.getAttribute('href'));
            if (h) {
              n.setAttribute('href', h);
              if (isExternal(h)) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
            }
          }
          cleanInto(c, n, article);
          dest.appendChild(n);
        } else if (c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') {
          cleanInto(c, dest, article); // buka bungkus tag tak dikenal, simpan teksnya
        }
      }
    });
  }
  function setRich(el, html, article) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    el.textContent = '';
    cleanInto(doc.body, el, article);
  }

  // Isi artikel: teks biasa (paragraf dipisah baris kosong) ATAU HTML terbatas. Hasil selalu disaring.
  function articleHTML(raw) {
    raw = String(raw || '').replace(/\r\n?/g, '\n').trim();
    if (!raw) return '';
    var html = /<\/?[a-z][^>]*>/i.test(raw) ? raw : raw.split(/\n{2,}/).map(function (p) {
      return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    var tmp = document.createElement('div');
    setRich(tmp, html, true);
    return tmp.innerHTML;
  }

  // Parameter ?slug= (divalidasi ketat)
  var SLUG = (function () {
    var m = /[?&]slug=([^&#]*)/.exec(location.search), v = '';
    try { v = decodeURIComponent(m ? m[1] : ''); } catch (e) { v = ''; }
    v = v.toLowerCase();
    return v.length <= 120 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? v : '';
  })();

  /* --------------------------- Lapisan data --------------------------- */
  function qs(params) {
    return Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }

  function rest(table, params) {
    var base = String(CFG.SUPABASE_URL).replace(/\/+$/, '');
    var headers = { apikey: CFG.SUPABASE_KEY, Accept: 'application/json' };
    // Key legacy (JWT) boleh dikirim sebagai Bearer; key "publishable" cukup lewat header apikey.
    if (/^eyJ/.test(CFG.SUPABASE_KEY)) headers.Authorization = 'Bearer ' + CFG.SUPABASE_KEY;

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, CFG.REQUEST_TIMEOUT_MS || 6000);

    return fetch(base + '/rest/v1/' + table + '?' + qs(params), { method: 'GET', headers: headers, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error(table + ' → HTTP ' + res.status);
        return res.json();
      }, function (err) { clearTimeout(timer); throw err; });
  }

  function cacheKey() {
    var u = String(CFG.SUPABASE_URL || '').replace(/^https?:\/\//, '');
    return 'ibmcms:v' + (CFG.CACHE_VERSION || 1) + ':' + u + ':' + PAGE + (PAGE === 'news_detail' ? ':' + SLUG : '');
  }
  function readCache() {
    try { return JSON.parse(localStorage.getItem(cacheKey()) || 'null'); } catch (e) { return null; }
  }
  function writeCache(payload) {
    try { localStorage.setItem(cacheKey(), JSON.stringify(payload)); } catch (e) { /* kuota penuh / mode privat: abaikan */ }
  }

  /* ------------------------ Definisi koleksi ------------------------- */
  var SORT = 'sort_order.asc,id.asc';
  var NEWS_LIST = 'id,title,excerpt,image_url,published_at,is_featured,link_url,slug,has_content';
  // Koleksi yang dibutuhkan di setiap halaman karena dipakai footer (bukan lewat atribut data-collection)
  var ALWAYS = ['footer_links', 'opening_hours'];
  var COLLECTIONS = {
    hero_stats:           { table: 'list_items', filter: { group_key: 'eq.home.hero_stats' }, order: SORT, render: rStats },
    double_degree_points: { table: 'list_items', filter: { group_key: 'eq.home.double_degree' }, order: SORT, render: rPlainList },
    glimpse_facts:        { table: 'list_items', filter: { group_key: 'eq.about.glimpse_facts' }, order: SORT, render: rFacts },
    opening_hours:        { table: 'list_items', filter: { group_key: 'eq.global.opening_hours' }, order: SORT, render: rPlainList },
    why_items:            { table: 'why_items', order: SORT, render: rWhy },
    partners:             { table: 'partners', order: 'is_official.desc,sort_order.asc,id.asc', render: rPartners },
    home_lecturers:       { table: 'people', filter: { kind: 'eq.lecturer', is_featured: 'eq.true' }, order: SORT, limit: 24, render: rLecturerHome },
    lecturers:            { table: 'people', filter: { kind: 'eq.lecturer' }, order: SORT, render: rLecturers },
    students:             { table: 'people', filter: { kind: 'eq.student' }, order: 'batch.asc.nullsfirst,sort_order.asc,id.asc', render: rStudents },
    testimonials:         { table: 'testimonials', order: SORT, render: rTestimonials },
    footer_links:         { table: 'footer_links', order: 'group_no.asc,sort_order.asc,id.asc', render: function () { return ''; } },
    simaka_buttons:       { table: 'buttons', filter: { group_key: 'eq.home.simaka' }, order: SORT, render: rButtons },
    scholarship_registration_buttons: { table: 'buttons', filter: { group_key: 'eq.admission.scholarship_registration' }, order: SORT, render: rButtons },
    scholarship_test_buttons:         { table: 'buttons', filter: { group_key: 'eq.admission.scholarship_test' }, order: SORT, render: rButtons },
    home_news:            { table: 'news', select: NEWS_LIST, order: 'is_featured.desc,published_at.desc,id.desc', limit: 4, render: rNewsHome },
    news_all:             { table: 'news', select: NEWS_LIST, order: 'published_at.desc,id.desc', limit: 60, render: rNewsAll },
    news_related:         { table: 'news', select: NEWS_LIST, order: 'published_at.desc,id.desc', limit: 5, render: rNewsRelated },
    news_detail:          { table: 'news', order: 'id.asc', limit: 1, render: rNewsDetail,
                            filter: function () { return SLUG ? { slug: 'eq.' + SLUG } : null; },
                            fallback: function (c) { return (c.news_all || []).filter(function (r) { return r.slug === SLUG; }).slice(0, 1); } },
    faqs:                 { table: 'faqs', order: SORT, render: rFaq },
    curriculum:           { table: 'curriculum_courses', order: 'semester.asc,sort_order.asc,id.asc', render: rCurriculum },
    calendar:             { table: 'academic_calendar', order: 'sort_order.asc,start_date.asc,id.asc', render: rCalendar },
    steps_online:         { table: 'admission_steps', filter: { track: 'eq.online' }, order: SORT, render: rSteps },
    steps_offline:        { table: 'admission_steps', filter: { track: 'eq.offline' }, order: SORT, render: rSteps },
    documents:            { table: 'admission_documents', order: SORT, render: rDocs },
    scholarships:         { table: 'scholarships', order: SORT, render: rScholarships },
    reregistration:       { table: 'reregistration_fees', order: SORT, render: rRereg },
    gallery_activities:   { table: 'gallery_items', filter: { gallery: 'eq.activities' }, order: SORT, render: rGallery },
    gallery_facilities:   { table: 'gallery_items', filter: { gallery: 'eq.facilities' }, order: SORT, render: rGallery }
  };

  /* --------------------------- Ikon "Why" ---------------------------- */
  var ICONS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    book: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17a3 3 0 0 1 3-3h12"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.4 0 4 1.8 4 4.5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5L7 21l5-3 5 3-1.5-7.5"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    graduate: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.2V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.8"/><path d="M22 9v6"/>',
    languages: '<path d="M4 6h9M8.5 4v2M6 6c.4 3 2.6 5.4 5.5 6.6M11 6c-.5 3-3 5.8-6.5 7"/><path d="M12.5 20l4.2-9.5 4.2 9.5M14 17h5.4"/>',
    sparkles: '<path d="M10 3l1.7 4.6L16 9.3l-4.3 1.7L10 15.6 8.3 11 4 9.3l4.3-1.7z"/><path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z"/>',
    plane: '<path d="M10.5 13.5L3 11l1.2-1.6 8 .8L16.5 6a1.8 1.8 0 1 1 2.5 2.5l-4.2 4.3.8 8-1.6 1.2-2.5-7.5-3.6 3.5-.9-2.6z"/>',
    'badge-check': '<path d="M12 3l2.4 1.7 2.9-.1.9 2.8 2.3 1.8-.9 2.8.9 2.8-2.3 1.8-.9 2.8-2.9-.1L12 21l-2.4-1.7-2.9.1-.9-2.8-2.3-1.8.9-2.8-.9-2.8 2.3-1.8.9-2.8 2.9.1z"/><path d="M8.7 12.2l2.2 2.2 4.4-4.5"/>'
  };
  ICONS['graduation-cap'] = ICONS.graduate;
  function iconHTML(v) {
    v = String(v || '').trim();
    if (/^(https?:\/\/|\/|assets\/)/i.test(v)) return '<img src="' + esc(safeUrl(v)) + '" alt="" loading="lazy">';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[v] || ICONS.star) + '</svg>';
  }

  var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg>';
  var ARROW_UR = '<svg class="icon-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17L17 7M8 7h9v9"/></svg>';

  /* Carousel generik: scroll-snap native + tombol + titik. Perilakunya ada di ui.js. */
  function carousel(slides, cls, s) {
    return '<div class="carousel ' + cls + '" data-carousel>' +
      '<div class="carousel-viewport" tabindex="0" role="group" aria-roledescription="carousel" aria-label="' + esc(s.t('global.a11y.carousel_label', 'Carousel')) + '">' +
      '<ul class="carousel-track">' + slides + '</ul></div>' +
      '<div class="carousel-controls">' +
      '<button class="carousel-btn" type="button" data-carousel-prev aria-label="' + esc(s.t('global.a11y.carousel_prev', 'Previous')) + '">' + ARROW_L + '</button>' +
      '<div class="carousel-dots" data-carousel-dots></div>' +
      '<button class="carousel-btn" type="button" data-carousel-next aria-label="' + esc(s.t('global.a11y.carousel_next', 'Next')) + '">' + ARROW_R + '</button>' +
      '</div></div>';
  }

  /* ----------------------------- Renderer ---------------------------- */
  function imgTag(url, alt, extra) {
    var u = safeUrl(url);
    return u ? '<img src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="lazy"' + (extra || '') + '>' : '';
  }

  function rStats(rows) {
    return rows.map(function (r) {
      return '<div class="stat"><dt>' + esc(r.title) + '</dt><dd>' + esc(r.body) + '</dd></div>';
    }).join('');
  }

  function rPlainList(rows) {
    return rows.map(function (r) { return '<li>' + esc(r.body || r.title) + '</li>'; }).join('');
  }

  function rFacts(rows) {
    return rows.map(function (r) {
      return '<div><dt>' + esc(r.title) + '</dt><dd>' + esc(r.body) + '</dd></div>';
    }).join('');
  }

  // "Why IBM Asia?" → carousel kartu (ikon, judul, deskripsi)
  function rWhy(rows, s) {
    var slides = rows.map(function (r) {
      return '<li class="carousel-slide"><article class="why-card"><span class="why-icon">' + iconHTML(r.icon) + '</span>' +
        '<h3>' + esc(String(r.title || '').trim()) + '</h3><p>' + esc(r.description) + '</p></article></li>';
    }).join('');
    return carousel(slides, 'carousel-why', s);
  }

  function partnerItem(r, hidden, cls) {
    var img = imgTag(r.logo_url, hidden ? '' : r.name, ' height="44"');
    if (!img) return '';
    var url = safeUrl(r.website_url);
    var attrs = hidden ? ' tabindex="-1"' : '';
    var c = 'partner' + (cls ? ' ' + cls : '');
    return url
      ? '<a class="' + c + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + attrs + (hidden ? '' : ' aria-label="' + esc(r.name) + '"') + '>' + img + '</a>'
      : '<span class="' + c + '">' + img + '</span>';
  }
  // Partner resmi dikunci di kiri; partner lain bergulir otomatis di kanan.
  function rPartners(rows, s, el) {
    var official = rows.filter(function (r) { return r.is_official; });
    var others = rows.filter(function (r) { return !r.is_official; });
    var h = '';
    if (official.length) {
      h += '<div class="partner-official"><span class="partner-label">' + esc(s.t('global.partners_strip.official_label', 'Official Partner')) + '</span>' +
        '<div class="partner-official-logos">' + official.map(function (r) {
          return partnerItem(r, false, 'partner-lg') +
            '<span class="partner-official-name"><strong>' + esc(r.name) + '</strong>' +
            '<small>' + esc(s.t('global.partners_strip.official_location', 'Singapore')) + '</small></span>';
        }).join('') + '</div></div>';
    }
    if (others.length) {
      el.style.setProperty('--marquee-duration', Math.max(24, others.length * 6) + 's');
      var a = others.map(function (r) { return partnerItem(r, false); }).join('');
      var b = others.map(function (r) { return partnerItem(r, true); }).join('');
      h += '<div class="marquee"><div class="marquee-group">' + a + '</div><div class="marquee-group" aria-hidden="true">' + b + '</div></div>';
    }
    return h;
  }

  /* ---------- Profil dosen & mahasiswa ---------- */
  var PEOPLE = {};   // id → baris, dipakai pop-up profil (ui.js)

  function personTitle(r) { return String(r.position || r.program || '').trim(); }
  function personSub(r) { return String(r.specialty || r.detail || '').trim(); }

  // Beranda: carousel dosen (4 kartu per tampilan), klik membuka pop-up profil
  function rLecturerHome(rows, s) {
    var pre = s.t('global.a11y.photo_prefix', 'Photo');
    var slides = rows.map(function (r) {
      PEOPLE[r.id] = r;
      return '<li class="carousel-slide"><button class="lecturer-card" type="button" data-person-id="' + esc(r.id) + '" aria-haspopup="dialog">' +
        '<span class="lecturer-photo">' + imgTag(r.photo_url, pre + ' ' + r.name, ' width="320" height="400"') + '</span>' +
        '<span class="lecturer-body"><strong>' + esc(r.name) + '</strong>' +
        (personTitle(r) ? '<span class="lecturer-role">' + esc(personTitle(r)) + '</span>' : '') +
        '<span class="lecturer-cta">' + esc(s.t('global.profile_modal.view_label', 'View profile')) + ARROW_UR + '</span></span></button></li>';
    }).join('');
    return carousel(slides, 'carousel-lecturers', s);
  }

  function personCard(r, s) {
    var pre = s.t('global.a11y.photo_prefix', 'Photo');
    var lect = r.kind === 'lecturer';
    if (lect) PEOPLE[r.id] = r;
    var title = personTitle(r), sub = personSub(r);
    return '<article class="person' + (lect ? ' is-clickable' : '') + '" tabindex="0"' +
      (lect ? ' role="button" aria-haspopup="dialog" data-person-id="' + esc(r.id) + '"' : '') + '>' +
      imgTag(r.photo_url, pre + ' ' + r.name, ' width="400" height="500"') +
      '<div class="person-info"><h3>' + esc(r.name) + '</h3>' +
      (title ? '<p class="person-program">' + esc(title) + '</p>' : '') +
      (sub ? '<p class="person-detail">' + esc(sub) + '</p>' : '') +
      (lect ? '<span class="person-cta">' + esc(s.t('global.profile_modal.view_label', 'View profile')) + ARROW_UR + '</span>' : '') +
      '</div></article>';
  }

  function rLecturers(rows, s) {
    return rows.map(function (r) { return personCard(r, s); }).join('');
  }

  // Mahasiswa dikelompokkan per angkatan (Batch) menjadi tab; Batch terendah tampil lebih dulu.
  function rStudents(rows, s) {
    var by = {};
    rows.forEach(function (r) {
      var b = Number(r.batch) || 1;
      (by[b] = by[b] || []).push(r);
    });
    var nums = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
    var label = s.t('students.batch_label', 'Batch');
    var nav = '<div class="tabs-nav" role="tablist" aria-label="' + esc(s.t('students.tabs_label', 'Student batches')) + '">' +
      nums.map(function (n, i) {
        return '<button class="tab-btn" type="button" role="tab" id="batch-tab-' + n + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '"' +
          ' aria-controls="batch-panel-' + n + '"' + (i ? ' tabindex="-1"' : '') + '>' + esc(label + ' ' + n) + '</button>';
      }).join('') + '</div>';
    var panels = nums.map(function (n, i) {
      return '<div role="tabpanel" id="batch-panel-' + n + '" aria-labelledby="batch-tab-' + n + '"' + (i ? ' hidden' : '') + '>' +
        '<div class="people-grid">' + by[n].map(function (r) { return personCard(r, s); }).join('') + '</div></div>';
    }).join('');
    return nav + panels;
  }

  /* ---------- Testimoni ---------- */
  var QUOTE_ICON = '<svg class="testi-quote-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 7H5.5A1.5 1.5 0 0 0 4 8.5V13a1.5 1.5 0 0 0 1.5 1.5H8c0 2-1 3-3 3.5M20 7h-3.5A1.5 1.5 0 0 0 15 8.5V13a1.5 1.5 0 0 0 1.5 1.5H19c0 2-1 3-3 3.5"/></svg>';
  // Beranda: carousel kartu testimoni — kiri foto; kanan atas kutipan, kanan bawah nama & batch.
  // Autoplay-loop dari ui.js.
  // Foto dari layanan placeholder (mis. placehold.co "Student 15 Photo") bukan foto asli:
  // diganti placeholder inisial agar teksnya tidak terpotong oleh object-fit: cover.
  var PLACEHOLDER_HOST = /^https?:\/\/(?:[\w-]+\.)*(?:placehold\.co|placeholder\.com|dummyimage\.com|placekitten\.com|picsum\.photos)\//i;
  function initials(name) {
    var w = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '';
    var first = Array.from(w[0])[0] || '';
    var last = w.length > 1 ? (Array.from(w[w.length - 1])[0] || '') : '';
    return (first + last).toUpperCase();
  }
  // Gambar gagal dimuat (404, offline): tampilkan placeholder inisial. Event "error" tidak bubbling → pakai capture.
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.parentNode && el.parentNode.classList.contains('testi-photo')) {
      el.parentNode.classList.add('is-broken');
    }
  }, true);

  function rTestimonials(rows, s) {
    var slides = rows.map(function (r) {
      var batch = String(r.batch || r.school || '').trim();   // "school" = kolom lama, dipakai bila batch kosong
      var url = safeUrl(r.photo_url);
      // alt kosong: nama sudah tertulis di samping foto, jadi foto bersifat dekoratif
      var photo = url && !PLACEHOLDER_HOST.test(url) ? imgTag(url, '', ' width="400" height="500"') : '';
      var ini = initials(r.name);
      return '<li class="carousel-slide"><article class="testi-card">' +
        '<div class="testi-photo" aria-hidden="true">' + (ini ? '<span class="testi-initials">' + esc(ini) + '</span>' : '') + photo + '</div>' +
        '<div class="testi-body">' +
        '<div class="testi-quote">' + QUOTE_ICON + '<blockquote>' + esc(r.quote) + '</blockquote></div>' +
        '<p class="testi-author"><strong title="' + esc(r.name) + '">' + esc(r.name) + '</strong>' +
        (batch ? '<span class="testi-batch" title="' + esc(batch) + '">' + esc(batch) + '</span>' : '') +
        '</p></div></article></li>';
    }).join('');
    return carousel(slides, 'carousel-testi', s);
  }

  /* ---------- Tombol aksi (tabel buttons) ---------- */
  var BTN = { gold: 'btn-gold', navy: 'btn-navy', outline: 'btn-outline', light: 'btn-outline-light' };
  function rButtons(rows, s) {
    return rows.map(function (r) {
      var cls = 'btn btn-lg ' + (BTN[r.variant] || 'btn-navy');
      var url = safeUrl(r.url);
      if (url) {
        return '<a class="' + cls + '" href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(r.label) + '</a>';
      }
      return '<span class="' + cls + ' is-disabled" aria-disabled="true" title="' + esc(s.t('global.buttons.coming_soon', 'Link coming soon')) + '">' + esc(r.label) + '</span>';
    }).join('');
  }

  // Kartu berita membuka halaman detail bila berita punya isi (content); jika tidak, memakai link_url.
  function newsHref(r) {
    if (r.slug && r.has_content) return 'news-detail.html?slug=' + encodeURIComponent(r.slug);
    return r.link_url;
  }
  function newsCard(url, cls, inner) {
    var u = safeUrl(url);
    return u
      ? '<a class="news-card ' + cls + '" href="' + esc(u) + '"' + (isExternal(u) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + inner + '</a>'
      : '<div class="' + cls + '">' + inner + '</div>';
  }
  function newsDate(r) {
    var d = fmtDate(r.published_at);
    return d ? '<time class="news-date" datetime="' + esc(r.published_at) + '">' + esc(d) + '</time>' : '';
  }
  function rNewsHome(rows) {
    if (!rows.length) return '';
    var feat = rows.filter(function (r) { return r.is_featured; })[0] || rows[0];
    var rest = rows.filter(function (r) { return r !== feat; }).slice(0, 3);
    var h = '<article class="news-feature">' + newsCard(newsHref(feat), 'news-feature-link',
      imgTag(feat.image_url, '', ' width="720" height="450"') + newsDate(feat) +
      '<h3>' + esc(feat.title) + '</h3>' + (feat.excerpt ? '<p>' + esc(feat.excerpt) + '</p>' : '')) + '</article>';
    h += '<div class="news-list">' + rest.map(function (r) {
      return '<article>' + newsCard(newsHref(r), 'news-item',
        imgTag(r.image_url, '', ' width="248" height="186"') +
        '<div>' + newsDate(r) + '<h3>' + esc(r.title) + '</h3></div>') + '</article>';
    }).join('') + '</div>';
    return h;
  }

  var NEWS_PAGE = 6;
  function newsTile(r, hidden, flag) {
    var img = imgTag(r.image_url, '', ' width="640" height="400"');
    return '<article class="news-tile"' + (hidden ? ' hidden' : '') + '>' + newsCard(newsHref(r), 'news-tile-link',
      '<div class="news-tile-media">' + img + (r.is_featured && flag ? '<span class="news-flag">' + esc(flag) + '</span>' : '') + '</div>' +
      '<div class="news-tile-body">' + newsDate(r) + '<h3>' + esc(r.title) + '</h3>' +
      (r.excerpt ? '<p>' + esc(r.excerpt) + '</p>' : '') + '</div>') + '</article>';
  }
  function rNewsAll(rows, s) {
    var flag = s.t('news.flag_featured', "Editor's Pick");
    var h = rows.map(function (r, i) { return newsTile(r, i >= NEWS_PAGE, flag); }).join('');
    if (rows.length > NEWS_PAGE) {
      h += '<div class="news-more"><button class="btn btn-outline" type="button" data-load-more="' + NEWS_PAGE + '">' +
        esc(s.t('news.load_more', 'Show more news')) + '</button></div>';
    }
    return h;
  }
  function rNewsRelated(rows, s) {
    var flag = s.t('news.flag_featured', "Editor's Pick");
    return rows.filter(function (r) { return r.slug !== SLUG; }).slice(0, 3).map(function (r) { return newsTile(r, false, flag); }).join('');
  }

  function setMeta(sel, val) {
    var m = document.querySelector(sel);
    if (m && val != null) m.setAttribute('content', val);
  }
  function rNewsDetail(rows, s) {
    var r = rows[0];
    var brand = s.t('global.brand.name', 'IBM Institut Asia');
    var url = location.href.split('#')[0];
    document.title = r.title + ' — ' + brand;
    setMeta('meta[name="description"]', r.excerpt || r.title);
    setMeta('meta[property="og:title"]', r.title);
    setMeta('meta[property="og:description"]', r.excerpt || r.title);
    if (safeUrl(r.image_url)) setMeta('meta[property="og:image"]', safeUrl(r.image_url));

    var body = articleHTML(r.content);
    var src = safeUrl(r.link_url);
    var d = fmtDate(r.published_at);

    var h = '<section class="page-hero article-hero"><div class="container narrow">' +
      '<nav class="breadcrumb" aria-label="' + esc(s.t('news_detail.breadcrumb_label', 'Breadcrumb navigation')) + '">' +
      '<a href="index.html">' + esc(s.t('global.nav.home', 'Home')) + '</a><span aria-hidden="true">›</span>' +
      '<a href="news.html">' + esc(s.t('global.nav.news', 'News')) + '</a></nav>' +
      (d ? '<time class="article-date" datetime="' + esc(r.published_at) + '">' + esc(d) + '</time>' : '') +
      '<h1>' + esc(r.title) + '</h1>' +
      (r.excerpt ? '<p class="page-hero-desc">' + esc(r.excerpt) + '</p>' : '') +
      '</div></section>';

    h += '<section class="section section-white article-section"><div class="container narrow">' +
      (safeUrl(r.image_url) ? '<figure class="article-cover">' + imgTag(r.image_url, r.title, ' width="1200" height="675"').replace(' loading="lazy"', '') + '</figure>' : '') +
      '<div class="prose">' + body + '</div>' +
      '<div class="article-foot">' +
      (src ? '<a class="btn btn-outline" href="' + esc(src) + '"' + (isExternal(src) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        esc(s.t('news_detail.source_label', 'Read original source')) + '</a>' : '') +
      '<div class="share"><span class="share-label">' + esc(s.t('news_detail.share_label', 'Share:')) + '</span>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://wa.me/?text=' + encodeURIComponent(r.title + ' ' + url)) + '">WhatsApp</a>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)) + '">Facebook</a>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url)) + '">LinkedIn</a>' +
      '<button class="share-btn" type="button" data-copy-link data-copied="' + esc(s.t('news_detail.copied_label', 'Link copied ✓')) + '">' +
      esc(s.t('news_detail.copy_label', 'Copy link')) + '</button></div></div>' +
      '</div></section>';
    return h;
  }

  function accItem(id, title, meta, bodyHTML, open) {
    return '<div class="acc-item' + (open ? ' is-open' : '') + '">' +
      '<h3><button class="acc-trigger" type="button" id="' + id + '-btn" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + id + '-panel">' +
      '<span>' + esc(title) + '</span>' + (meta ? '<span class="acc-meta">' + esc(meta) + '</span>' : '') +
      '<span class="acc-icon" aria-hidden="true"></span></button></h3>' +
      '<div class="acc-panel" id="' + id + '-panel" role="region" aria-labelledby="' + id + '-btn"><div><div class="acc-body">' + bodyHTML + '</div></div></div></div>';
  }

  function rFaq(rows) {
    return rows.map(function (r, i) {
      return accItem('faq-' + i, r.question, '', '<p>' + esc(r.answer) + '</p>', i === 0);
    }).join('');
  }

  function rCurriculum(rows, s) {
    var by = {};
    rows.forEach(function (r) { (by[r.semester] = by[r.semester] || []).push(r); });
    var sems = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
    var label = s.t('about.curriculum.semester_label', 'Semester');
    var unit = s.t('about.curriculum.credit_unit', 'credits');
    return sems.map(function (n, i) {
      var list = by[n];
      var total = list.reduce(function (a, r) { return a + (Number(r.credits) || 0); }, 0);
      var body = '<ul class="course-list">' + list.map(function (r) {
        return '<li><span>' + esc(r.course_name) + '</span><span>' + (r.credits ? esc(r.credits + ' ' + unit) : '') + '</span></li>';
      }).join('') + '</ul>';
      return accItem('sem-' + n, label + ' ' + n, total ? total + ' ' + unit : '', body, i === 0);
    }).join('');
  }

  function rCalendar(rows, s) {
    if (!rows.length) return '';
    var c1 = s.t('about.calendar.col_activity', 'Activity');
    var c2 = s.t('about.calendar.col_start', 'Start Date');
    var c3 = s.t('about.calendar.col_end', 'End Date');
    return '<table class="data-table"><thead><tr><th scope="col">' + esc(c1) + '</th><th scope="col">' + esc(c2) + '</th><th scope="col">' + esc(c3) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td data-label="' + esc(c1) + '">' + esc(r.activity) + '</td>' +
          '<td data-label="' + esc(c2) + '">' + esc(fmtDate(r.start_date) || '—') + '</td>' +
          '<td data-label="' + esc(c3) + '">' + esc(fmtDate(r.end_date) || '—') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  // Langkah pendaftaran; bila link_url terisi, muncul tombol tautan di bawah deskripsi.
  function rSteps(rows) {
    return rows.map(function (r, i) {
      var url = safeUrl(r.link_url);
      var link = url && r.link_label
        ? '<a class="btn btn-gold btn-sm step-link" href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(r.link_label) + ARROW_UR + '</a>'
        : '';
      return '<li><span class="step-no">' + (i + 1) + '</span><div><h3>' + esc(r.title) + '</h3><p>' + esc(r.description) + '</p>' + link + '</div></li>';
    }).join('');
  }

  function rDocs(rows) {
    return rows.map(function (r) { return '<li class="doc-card">' + esc(r.document_name) + '</li>'; }).join('');
  }

  function toArray(v) {
    if (Array.isArray(v)) return v;
    try { var p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
  }
  // Kartu beasiswa (informasi saja, tanpa tombol); animasi hover ringan lewat CSS.
  function rScholarships(rows) {
    return rows.map(function (r, i) {
      var pts = toArray(r.points);
      return '<article class="scholarship">' +
        '<span class="scholarship-no" aria-hidden="true">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
        (r.label ? '<p class="eyebrow">' + esc(r.label) + '</p>' : '') +
        '<h3>' + esc(r.title) + '</h3>' +
        (r.description ? '<p>' + esc(r.description) + '</p>' : '') +
        (pts.length ? '<ul class="bullets">' + pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
        '</article>';
    }).join('');
  }

  // Tabel biaya daftar ulang (re-registration): periode + biaya. Biaya 0 ditampilkan sebagai "To be announced".
  function rRereg(rows, s) {
    if (!rows.length) return '';
    var c1 = s.t('admission.tuition.col_period', 'Period');
    var c2 = s.t('admission.tuition.col_fee', 'Re-Registration Fee');
    var tba = s.t('admission.tuition.tba', 'To be announced');
    var body = rows.map(function (r) {
      var fee = Number(r.fee) > 0 ? fmtRp(r.fee) : tba;
      return '<tr><td data-label="' + esc(c1) + '">' + esc(r.period_label) + '</td>' +
        '<td class="num total" data-label="' + esc(c2) + '">' + esc(fee) + '</td></tr>';
    }).join('');
    return '<table class="data-table"><thead><tr><th scope="col">' + esc(c1) + '</th><th scope="col" class="num">' + esc(c2) + '</th></tr></thead><tbody>' + body + '</tbody></table>';
  }

  function rGallery(rows, s) {
    var zoom = s.t('global.a11y.zoom_image', 'Enlarge photo');
    return rows.map(function (r) {
      var img = imgTag(r.image_url, r.alt_text || r.caption, ' width="500" height="375"');
      return '<figure class="shot"><button class="shot-btn" type="button" data-lightbox aria-label="' + esc(zoom + ': ' + (r.caption || '')) + '">' + img + '</button>' +
        (r.caption ? '<figcaption>' + esc(r.caption) + '</figcaption>' : '') + '</figure>';
    }).join('');
  }

  /* ----------------------- Penyimpanan & binding ---------------------- */
  var store = null;      // data yang sedang tampil
  var sigs = {};         // tanda tangan render terakhir (hindari render ulang yang sia-sia)
  var revealed = false;

  function indexContent(rows) {
    var m = {};
    (rows || []).forEach(function (r) { if (r && r.content_key) m[r.content_key] = r; });
    return m;
  }

  function buildStore(payload) {
    var content = indexContent(FALLBACK.content);
    var fresh = indexContent(payload && payload.content);
    Object.keys(fresh).forEach(function (k) { content[k] = fresh[k]; });

    var cols = (payload && payload.collections) || {};
    return {
      content: content,
      t: function (key, def) {
        var r = content[key];
        return r && r.value != null ? r.value : (def === undefined ? '' : def);
      },
      collection: function (name) {
        if (Object.prototype.hasOwnProperty.call(cols, name) && Array.isArray(cols[name])) return cols[name];
        var d = COLLECTIONS[name];
        if (d && d.fallback) return d.fallback(FALLBACK.collections || {});
        return (FALLBACK.collections && FALLBACK.collections[name]) || [];
      }
    };
  }

  function bindContent(s) {
    all('[data-cms]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms')];
      if (!row || row.kind === 'image') return;
      var v = row.value == null ? '' : String(row.value);
      if (row.kind === 'richtext') setRich(el, v); else el.textContent = v;
      if (el.tagName !== 'TITLE') el.hidden = v.trim() === '';
    });

    all('[data-cms-src]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms-src')];
      if (!row) return;
      var u = safeUrl(row.value);
      if (u) {
        if (el.getAttribute('src') !== u) el.setAttribute('src', u);
        if (row.alt_text) el.setAttribute('alt', row.alt_text);
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    all('[data-cms-href]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms-href')];
      if (!row) return;
      var u = safeUrl(row.value);
      if (u) {
        el.setAttribute('href', u);
        if (isExternal(u)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
        else { el.removeAttribute('target'); el.removeAttribute('rel'); }
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    all('[data-cms-content]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms-content')];
      if (row) el.setAttribute('content', row.value || '');
    });

    all('[data-cms-placeholder]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms-placeholder')];
      if (row && row.value != null) el.setAttribute('placeholder', row.value);
    });

    all('[data-cms-bg]').forEach(function (el) {
      var row = s.content[el.getAttribute('data-cms-bg')];
      var u = row ? safeUrl(row.value) : '';
      if (u) el.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")';
    });
  }

  function renderCollections(s) {
    var uiSig = Object.keys(s.content).map(function (k) { return s.content[k].value; }).join('\u0001');
    all('[data-collection]').forEach(function (el) {
      var name = el.getAttribute('data-collection');
      var def = COLLECTIONS[name];
      if (!def) return;
      var rows = s.collection(name);
      var sig = JSON.stringify(rows) + '|' + uiSig;
      if (el._ibmSig === sig) return;
      el._ibmSig = sig;

      var out = rows.length ? def.render(rows, s, el) : '';
      el.innerHTML = out;

      // data-empty="hide": sembunyikan seluruh <section> bila tidak ada yang bisa ditampilkan
      if (el.getAttribute('data-empty') === 'hide') {
        var sec = el.closest('section');
        if (sec) sec.hidden = !out;
      }
    });
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.remove('cms-pending');
  }

  function render(payload) {
    store = buildStore(payload);
    if (window.IBMLayout) window.IBMLayout.render(store, sigs);
    bindContent(store);
    renderCollections(store);
    reveal();
    document.dispatchEvent(new CustomEvent('cms:rendered'));
  }

  /* ------------------------------ Fetch ------------------------------ */
  function neededCollections() {
    var seen = {}, out = [];
    all('[data-collection]').forEach(function (el) {
      var n = el.getAttribute('data-collection');
      if (COLLECTIONS[n] && !seen[n]) { seen[n] = 1; out.push(n); }
    });
    ALWAYS.forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } });
    return out;
  }

  function fetchAll(names, previous) {
    var jobs = [rest('site_content', { select: 'content_key,kind,value,alt_text', page: 'in.(global,' + PAGE + ')' })];
    names.forEach(function (n) {
      var d = COLLECTIONS[n];
      var flt = typeof d.filter === 'function' ? d.filter() : d.filter;
      if (flt === null) { jobs.push(Promise.resolve([])); return; }   // mis. slug tidak valid
      var p = { select: d.select || '*', order: d.order, is_published: 'eq.true' };
      Object.keys(flt || {}).forEach(function (k) { p[k] = flt[k]; });
      if (d.limit) p.limit = d.limit;
      var job = rest(d.table, p);
      // Database lama (belum dimigrasi) tak punya kolom baru → ulangi dengan select=*
      if (d.select) job = job.catch(function () { p.select = '*'; return rest(d.table, p); });
      jobs.push(job);
    });

    var settle = function (p) { return p.then(function (v) { return { ok: true, v: v }; }, function () { return { ok: false }; }); };
    return Promise.all(jobs.map(settle)).then(function (res) {
      if (!res.some(function (r) { return r.ok; })) throw new Error('Supabase tidak terjangkau');
      var prev = previous || {};
      var out = { content: res[0].ok ? res[0].v : prev.content, collections: {} };
      names.forEach(function (n, i) {
        var r = res[i + 1];
        if (r.ok) out.collections[n] = r.v;
        else if (prev.collections && prev.collections[n]) out.collections[n] = prev.collections[n];
      });
      return out;
    });
  }

  function start() {
    if (!CONFIGURED) {            // belum diisi: pakai data bawaan (mode uji coba lokal)
      render(null);
      return;
    }
    var names = neededCollections();
    var cached = readCache();
    var timer = null;

    if (cached) {
      render(cached);             // tampil instan dari cache
    } else {
      timer = setTimeout(function () { if (!store) render(null); }, CFG.REVEAL_TIMEOUT_MS || 2200);
    }

    fetchAll(names, cached).then(function (payload) {
      clearTimeout(timer);
      writeCache(payload);
      render(payload);            // lalu perbarui dengan data terbaru
    }).catch(function () {
      clearTimeout(timer);
      if (!store) render(null);   // gagal total & belum ada tampilan: data bawaan
    });
  }

  window.IBMCMS = {
    refresh: start,
    config: CFG,
    configured: CONFIGURED,
    // Ambil teks CMS (dipakai features.js / ui.js untuk label dinamis)
    t: function (key, def) { return store ? store.t(key, def) : (def === undefined ? '' : def); },
    // Ambil data dosen untuk pop-up profil
    person: function (id) { return PEOPLE[id] || null; }
  };
  start();
})();
