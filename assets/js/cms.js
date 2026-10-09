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

  var MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    if (!m) return '';
    return parseInt(m[3], 10) + ' ' + MONTHS_ID[parseInt(m[2], 10) - 1] + ' ' + m[1];
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
  var COLLECTIONS = {
    hero_stats:           { table: 'list_items', filter: { group_key: 'eq.home.hero_stats' }, order: SORT, render: rStats },
    double_degree_points: { table: 'list_items', filter: { group_key: 'eq.home.double_degree' }, order: SORT, render: rPlainList },
    glimpse_facts:        { table: 'list_items', filter: { group_key: 'eq.about.glimpse_facts' }, order: SORT, render: rFacts },
    why_items:            { table: 'why_items', order: SORT, render: rWhy },
    partners:             { table: 'partners', order: SORT, render: rPartners },
    home_lecturers:       { table: 'people', filter: { kind: 'eq.lecturer', is_featured: 'eq.true' }, order: SORT, limit: 4, render: rLecturerHome },
    lecturers:            { table: 'people', filter: { kind: 'eq.lecturer' }, order: SORT, render: rPerson },
    students:             { table: 'people', filter: { kind: 'eq.student' }, order: SORT, render: rPerson },
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
    tuition:              { table: 'tuition_programs', order: SORT, render: rTuition },
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
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
  };
  function iconHTML(v) {
    v = String(v || '').trim();
    if (/^(https?:\/\/|\/|assets\/)/i.test(v)) return '<img src="' + esc(safeUrl(v)) + '" alt="" loading="lazy">';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[v] || ICONS.star) + '</svg>';
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

  function rWhy(rows) {
    return rows.map(function (r) {
      return '<article class="why-item"><span class="why-icon">' + iconHTML(r.icon) + '</span>' +
        '<h3>' + esc(r.title) + '</h3><p>' + esc(r.description) + '</p></article>';
    }).join('');
  }

  function partnerItem(r, hidden) {
    var img = imgTag(r.logo_url, hidden ? '' : r.name, ' height="44"');
    if (!img) return '';
    var url = safeUrl(r.website_url);
    var attrs = hidden ? ' tabindex="-1"' : '';
    return url
      ? '<a class="partner" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + attrs + (hidden ? '' : ' aria-label="' + esc(r.name) + '"') + '>' + img + '</a>'
      : '<span class="partner">' + img + '</span>';
  }
  function rPartners(rows, s, el) {
    if (!rows.length) return '';
    el.style.setProperty('--marquee-duration', Math.max(24, rows.length * 7) + 's');
    var a = rows.map(function (r) { return partnerItem(r, false); }).join('');
    var b = rows.map(function (r) { return partnerItem(r, true); }).join('');
    return '<div class="marquee-group">' + a + '</div><div class="marquee-group" aria-hidden="true">' + b + '</div>';
  }

  function rLecturerHome(rows, s) {
    var pre = s.t('global.a11y.photo_prefix', 'Foto');
    return rows.map(function (r) {
      return '<article class="lecturer">' + imgTag(r.photo_url, pre + ' ' + r.name, ' width="320" height="400"') +
        '<h3>' + esc(r.name) + '</h3>' + (r.program ? '<p>' + esc(r.program) + '</p>' : '') + '</article>';
    }).join('');
  }

  function rPerson(rows, s) {
    var pre = s.t('global.a11y.photo_prefix', 'Foto');
    return rows.map(function (r) {
      return '<article class="person" tabindex="0">' + imgTag(r.photo_url, pre + ' ' + r.name, ' width="400" height="500"') +
        '<div class="person-info"><h3>' + esc(r.name) + '</h3>' +
        (r.program ? '<p class="person-program">' + esc(r.program) + '</p>' : '') +
        (r.detail ? '<p class="person-detail">' + esc(r.detail) + '</p>' : '') + '</div></article>';
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
    var flag = s.t('news.flag_featured', 'Pilihan Redaksi');
    var h = rows.map(function (r, i) { return newsTile(r, i >= NEWS_PAGE, flag); }).join('');
    if (rows.length > NEWS_PAGE) {
      h += '<div class="news-more"><button class="btn btn-outline" type="button" data-load-more="' + NEWS_PAGE + '">' +
        esc(s.t('news.load_more', 'Tampilkan berita lainnya')) + '</button></div>';
    }
    return h;
  }
  function rNewsRelated(rows, s) {
    var flag = s.t('news.flag_featured', 'Pilihan Redaksi');
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
      '<nav class="breadcrumb" aria-label="' + esc(s.t('news_detail.breadcrumb_label', 'Navigasi remah roti')) + '">' +
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
        esc(s.t('news_detail.source_label', 'Baca sumber asli')) + '</a>' : '') +
      '<div class="share"><span class="share-label">' + esc(s.t('news_detail.share_label', 'Bagikan:')) + '</span>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://wa.me/?text=' + encodeURIComponent(r.title + ' ' + url)) + '">WhatsApp</a>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)) + '">Facebook</a>' +
      '<a class="share-btn" target="_blank" rel="noopener noreferrer" href="' + esc('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url)) + '">LinkedIn</a>' +
      '<button class="share-btn" type="button" data-copy-link data-copied="' + esc(s.t('news_detail.copied_label', 'Tautan disalin ✓')) + '">' +
      esc(s.t('news_detail.copy_label', 'Salin tautan')) + '</button></div></div>' +
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
    var unit = s.t('about.curriculum.credit_unit', 'SKS');
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
    var c1 = s.t('about.calendar.col_activity', 'Kegiatan');
    var c2 = s.t('about.calendar.col_start', 'Tanggal Mulai');
    var c3 = s.t('about.calendar.col_end', 'Tanggal Selesai');
    return '<table class="data-table"><thead><tr><th scope="col">' + esc(c1) + '</th><th scope="col">' + esc(c2) + '</th><th scope="col">' + esc(c3) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td data-label="' + esc(c1) + '">' + esc(r.activity) + '</td>' +
          '<td data-label="' + esc(c2) + '">' + esc(fmtDate(r.start_date) || '—') + '</td>' +
          '<td data-label="' + esc(c3) + '">' + esc(fmtDate(r.end_date) || '—') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function rSteps(rows) {
    return rows.map(function (r, i) {
      return '<li><span class="step-no">' + (i + 1) + '</span><div><h3>' + esc(r.title) + '</h3><p>' + esc(r.description) + '</p></div></li>';
    }).join('');
  }

  function rDocs(rows) {
    return rows.map(function (r) { return '<li class="doc-card">' + esc(r.document_name) + '</li>'; }).join('');
  }

  function toArray(v) {
    if (Array.isArray(v)) return v;
    try { var p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
  }
  function rScholarships(rows) {
    return rows.map(function (r) {
      var pts = toArray(r.points);
      var url = safeUrl(r.button_url);
      return '<article class="scholarship">' +
        (r.label ? '<p class="eyebrow">' + esc(r.label) + '</p>' : '') +
        '<h3>' + esc(r.title) + '</h3>' +
        (r.description ? '<p>' + esc(r.description) + '</p>' : '') +
        (pts.length ? '<ul class="bullets">' + pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
        (url && r.button_label ? '<a class="btn btn-outline" href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(r.button_label) + '</a>' : '') +
        '</article>';
    }).join('');
  }

  function rTuition(rows, s) {
    if (!rows.length) return '';
    var sem = rows[0].semesters || 7;
    var cols = [
      s.t('admission.tuition.col_program', 'Program Studi'),
      s.t('admission.tuition.col_registration', 'Uang Pendaftaran'),
      s.t('admission.tuition.col_building', 'Uang Gedung (sekali)'),
      s.t('admission.tuition.col_spp', 'SPP / Semester'),
      String(s.t('admission.tuition.col_total', 'Estimasi Total ({semesters} Semester)')).replace('{semesters}', sem)
    ];
    var head = '<thead><tr>' + cols.map(function (c, i) {
      return '<th scope="col"' + (i ? ' class="num"' : '') + '>' + esc(c) + '</th>';
    }).join('') + '</tr></thead>';
    var body = rows.map(function (r) {
      return '<tr><td data-label="' + esc(cols[0]) + '">' + esc(r.program) + '</td>' +
        '<td class="num" data-label="' + esc(cols[1]) + '">' + esc(fmtRp(r.registration_fee)) + '</td>' +
        '<td class="num" data-label="' + esc(cols[2]) + '">' + esc(fmtRp(r.building_fee)) + '</td>' +
        '<td class="num" data-label="' + esc(cols[3]) + '">' + esc(fmtRp(r.tuition_per_semester)) + '</td>' +
        '<td class="num total" data-label="' + esc(cols[4]) + '">' + esc(fmtRp(r.total_estimate)) + '</td></tr>';
    }).join('');
    return '<table class="data-table">' + head + '<tbody>' + body + '</tbody></table>';
  }

  function rGallery(rows, s) {
    var zoom = s.t('global.a11y.zoom_image', 'Perbesar foto');
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

  window.IBMCMS = { refresh: start, config: CFG };
  start();
})();
