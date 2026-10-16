/* =========================================================================
   LAYOUT.JS — header, footer, dan section bersama yang dibangun dari data CMS.
   • Header & footer memakai kunci "global.*" (site_content) + tabel footer_links
     dan list_items (group_key = global.opening_hours).
   • Section "IBM News" dan "Our Partners" disisipkan otomatis sebelum footer di
     semua halaman KECUALI Home (Home memiliki versinya sendiri).
   Dengan begini menu, logo, alamat, kontak, tautan footer, dan jam buka cukup
   diubah di database dan otomatis berlaku di semua halaman.
   ========================================================================= */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    return /^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|[\w\-\/]+(\.\w+)?(\?[^\s]*)?(#[^\s]*)?$)/i.test(u) ? u : '';
  }
  function isExternal(u) { return /^https?:\/\//i.test(u); }

  // Halaman → grup menu (untuk menandai menu aktif)
  var PARENT = {
    lecturers: 'profile', students: 'profile',
    gallery_activities: 'gallery', gallery_facilities: 'gallery'
  };

  var CHEVRON = '<svg class="chevron" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1l5 5 5-5"/></svg>';

  function link(t, page, current, key, def, href, pageId) {
    var active = current === pageId;
    return '<a class="nav-link' + (active ? ' is-active' : '') + '" href="' + esc(href) + '"' +
      (active ? ' aria-current="page"' : '') + '>' + esc(t(key, def)) + '</a>';
  }

  function dropdown(t, current, id, labelKey, labelDef, items) {
    var parentActive = PARENT[current] === id;
    var html = '<button class="nav-link nav-dropdown-toggle' + (parentActive ? ' is-active' : '') + '" type="button"' +
      ' aria-expanded="false" aria-haspopup="true" aria-controls="dd-' + id + '">' +
      esc(t(labelKey, labelDef)) + CHEVRON + '</button>' +
      '<div class="dropdown" id="dd-' + id + '"><ul class="dropdown-panel">';
    items.forEach(function (it) {
      var active = current === it.page;
      html += '<li><a href="' + esc(it.href) + '"' + (active ? ' aria-current="page"' : '') + '>' +
        esc(t(it.key, it.def)) + '</a></li>';
    });
    return html + '</ul></div>';
  }

  function brandHTML(t) {
    var logo = safeUrl(t('global.brand.logo', 'assets/img/logo-mark.svg'));
    return '<a href="index.html" class="brand">' +
      (logo ? '<img class="brand-mark" src="' + esc(logo) + '" alt="' + esc(t('global.brand.logo_alt', 'Logo')) + '" width="44" height="44">' : '') +
      '<span class="brand-text" translate="no"><strong>' + esc(t('global.brand.name', 'IBM Institut Asia')) + '</strong>' +
      '<small>' + esc(t('global.brand.subname', 'Malang')) + '</small></span></a>';
  }

  function headerHTML(t, current) {
    var simaka = safeUrl(t('global.simaka.url', ''));
    var h = '';
    h += '<div class="container header-inner">';
    h += brandHTML(t);
    h += '<button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="' +
      esc(t('global.nav.menu_label', 'Open navigation menu')) + '">' +
      '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span></button>';
    h += '<nav class="primary-nav" id="primaryNav" aria-label="' + esc(t('global.nav.aria_label', 'Main navigation')) + '"><ul class="nav-list">';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.home', 'Home', 'index.html', 'home') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.about', 'About IBM', 'about.html', 'about') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.admission', 'Admission', 'admission.html', 'admission') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.news', 'News', 'news.html', 'news') + '</li>';
    h += '<li class="nav-item has-dropdown">' + dropdown(t, current, 'profile', 'global.nav.profile', 'Profile', [
      { key: 'global.nav.profile_lecturers', def: 'Lecturer Profiles', href: 'profile-lecturers.html', page: 'lecturers' },
      { key: 'global.nav.profile_students', def: 'Student Profiles', href: 'profile-students.html', page: 'students' }
    ]) + '</li>';
    h += '<li class="nav-item has-dropdown">' + dropdown(t, current, 'gallery', 'global.nav.gallery', 'Gallery', [
      { key: 'global.nav.gallery_activities', def: 'Student Activities', href: 'gallery-activities.html', page: 'gallery_activities' },
      { key: 'global.nav.gallery_facilities', def: 'Learning Facilities', href: 'gallery-facilities.html', page: 'gallery_facilities' }
    ]) + '</li>';
    if (simaka) {
      h += '<li class="nav-item nav-item-cta"><a class="btn btn-gold btn-sm" href="' + esc(simaka) +
        '" target="_blank" rel="noopener noreferrer">' + esc(t('global.nav.simaka', 'SIMAKA')) + '</a></li>';
    }
    h += '</ul></nav></div>';
    return h;
  }

  /* ----------------------------- Footer ----------------------------- */
  // Ikon garis sederhana (konsisten satu keluarga). Dipakai untuk kontak & media sosial.
  var I = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z"/><path d="M9 8.6c0 3.4 3 6.4 6.4 6.4l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r=".6"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3v11.2a3.7 3.7 0 1 1-3.7-3.7"/><path d="M14 3c.3 2.6 2 4.3 4.7 4.6"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.2 9.4v5.2l4.6-2.6z"/></svg>'
  };

  var SOCIALS = [
    ['global.social.whatsapp', 'WhatsApp', I.whatsapp],
    ['global.social.instagram', 'Instagram', I.instagram],
    ['global.social.tiktok', 'TikTok', I.tiktok],
    ['global.social.youtube', 'YouTube', I.youtube]
  ];

  var GROUP_DEFAULTS = { 1: 'New Student Admission', 2: 'Institutions/Agencies', 3: 'Student Services' };

  function footerLinksHTML(t, rows) {
    var h = '';
    for (var n = 1; n <= 8; n++) {
      var items = rows.filter(function (r) { return Number(r.group_no) === n; });
      if (!items.length) continue;
      var title = t('global.footer.group_' + n + '_title', GROUP_DEFAULTS[n] || '');
      h += '<div class="footer-group">' + (title ? '<h2 class="footer-title">' + esc(title) + '</h2>' : '') + '<ul class="footer-list">' +
        items.map(function (r) {
          var u = safeUrl(r.url);
          if (!u) return '<li><span>' + esc(r.label) + '</span></li>';
          return '<li><a href="' + esc(u) + '"' + (isExternal(u) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(r.label) + '</a></li>';
        }).join('') + '</ul></div>';
    }
    return h;
  }

  function mapSrc(t, address) {
    var u = String(t('global.footer.map_url', '')).trim();
    if (/^https:\/\/(www\.)?google\.com\/maps/i.test(u)) return u;
    return address ? 'https://www.google.com/maps?q=' + encodeURIComponent(address) + '&output=embed' : '';
  }

  function footerHTML(t, store) {
    var email = String(t('global.footer.email', '')).trim();
    var phone = String(t('global.footer.phone', '')).trim();
    var address = String(t('global.footer.address', '')).trim();
    // Mendukung {year} maupun {2026} (otomatis diganti tahun berjalan)
    var copy = String(t('global.footer.copyright', '© {year} IBM Malang Asia Institute. All rights reserved.'))
      .replace(/\{(?:year|\d{4})\}/gi, new Date().getFullYear());

    var hours = store.collection('opening_hours') || [];
    var map = mapSrc(t, address);

    var h = '<div class="container footer-grid">';

    // Kolom 1 — tautan
    h += '<nav class="footer-col footer-links" aria-label="' + esc(t('global.footer.nav_title', 'Footer links')) + '">' +
      footerLinksHTML(t, store.collection('footer_links') || []) + '</nav>';

    // Kolom 2 — peta + kontak
    h += '<div class="footer-col footer-contact"><h2 class="footer-title">' + esc(t('global.footer.contact_title', 'Contact')) + '</h2>';
    if (map) {
      h += '<div class="footer-map"><iframe src="' + esc(map) + '" title="' + esc(t('global.footer.map_title', 'Campus location map')) +
        '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>';
    }
    h += '<ul class="contact-list">';
    if (address) h += '<li>' + I.pin + '<address>' + esc(address) + '</address></li>';
    if (phone) h += '<li>' + I.phone + '<a href="tel:' + esc(phone.replace(/[^\d+]/g, '')) + '">' + esc(phone) + '</a></li>';
    if (email) h += '<li>' + I.mail + '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a></li>';
    h += '</ul></div>';

    // Kolom 3 — jam buka, jam live Malang, media sosial
    h += '<div class="footer-col footer-hours"><h2 class="footer-title">' + esc(t('global.footer.hours_title', 'Opening Hours')) + '</h2>';
    if (hours.length) {
      h += '<ul class="hours-list">' + hours.map(function (r) {
        return '<li><span>' + esc(r.title) + '</span><strong>' + esc(r.body) + '</strong></li>';
      }).join('') + '</ul>';
    }
    h += '<div class="live-clock">' + I.clock + '<div><span class="live-clock-label">' + esc(t('global.footer.clock_label', 'Current time in Malang')) + '</span>' +
      '<time class="live-clock-time" data-live-clock translate="no">--:--:--</time></div></div>';

    var social = '';
    SOCIALS.forEach(function (s) {
      var u = safeUrl(t(s[0], ''));
      social += u
        ? '<a class="social-btn" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" aria-label="' + s[1] + '" title="' + s[1] + '">' + s[2] + '</a>'
        : '<span class="social-btn is-empty" aria-hidden="true" title="' + s[1] + '">' + s[2] + '</span>';
    });
    h += '<h2 class="footer-title footer-title-spaced">' + esc(t('global.footer.social_title', 'Our Socials')) + '</h2><div class="footer-social">' + social + '</div></div>';

    h += '</div>';
    h += '<div class="footer-bottom"><div class="container"><p>' + esc(copy) + '</p></div></div>';
    return h;
  }

  /* ------------------- Section bersama (selain Home) ------------------- */
  // IBM News + Our Partners di atas footer. Halaman News sendiri tidak memuat strip berita
  // (isinya sudah daftar berita); halaman 404 dibiarkan bersih.
  var PARTNER_PAGES = { about: 1, admission: 1, lecturers: 1, students: 1, gallery_activities: 1, gallery_facilities: 1, news: 1, news_detail: 1 };
  var NEWS_PAGES = { about: 1, admission: 1, lecturers: 1, students: 1, gallery_activities: 1, gallery_facilities: 1 };

  var NEWS_STRIP =
    '<section class="section section-white" id="ibm-news" aria-labelledby="strip-news-title"><div class="container">' +
    '<div class="section-head section-head-row"><div>' +
    '<h2 id="strip-news-title" data-cms="global.news_strip.title">IBM News</h2>' +
    '<p class="lead" data-cms="global.news_strip.description">The latest updates on campus life, student achievements, and programs.</p></div>' +
    '<a class="text-link" href="news.html" data-cms="global.news_strip.more_label" data-cms-href="global.news_strip.more_url">View All News</a></div>' +
    '<div class="news-layout" data-collection="home_news" data-empty="hide"></div></div></section>';

  var PARTNER_STRIP =
    '<section class="section partners-strip" id="our-partners" aria-labelledby="strip-partners-title"><div class="container">' +
    '<div class="section-head section-head-center">' +
    '<h2 id="strip-partners-title" data-cms="global.partners_strip.title">Our Partners</h2>' +
    '<p class="lead" data-cms="global.partners_strip.description">We collaborate with educational institutions and industry partners, in Indonesia and around the world.</p></div>' +
    '<div class="partner-bar" data-collection="partners" data-empty="hide"></div></div></section>';

  // Dijalankan SEKARANG (sebelum cms.js) supaya koleksi di dalamnya ikut diambil dari Supabase.
  (function injectShared() {
    var page = document.body.getAttribute('data-page') || '';
    var footer = document.getElementById('siteFooter');
    if (!footer || !PARTNER_PAGES[page]) return;
    var html = (NEWS_PAGES[page] ? NEWS_STRIP : '') + PARTNER_STRIP;
    footer.insertAdjacentHTML('beforebegin', html);
  })();

  window.IBMLayout = {
    /**
     * @param store  objek { t(key, default), collection(name) } dari cms.js
     * @param sigs   penyimpan "tanda tangan" agar tidak render ulang bila data sama
     */
    render: function (store, sigs) {
      var current = document.body.getAttribute('data-page') || '';
      if (current === 'news_detail') current = 'news';
      var header = document.getElementById('siteHeader');
      var footer = document.getElementById('siteFooter');
      var t = store.t;

      var keys = Object.keys(store.content).filter(function (k) { return k.indexOf('global.') === 0; }).sort();
      var sig = current + '|' + keys.map(function (k) { return store.content[k].value; }).join('\u0001') +
        '|' + JSON.stringify(store.collection('footer_links') || []) + JSON.stringify(store.collection('opening_hours') || []);
      if (sigs.layout === sig) return;
      sigs.layout = sig;

      // Pertahankan menu mobile yang sedang terbuka (jika ada) saat render ulang
      var wasOpen = document.body.classList.contains('nav-locked');
      if (header) header.innerHTML = headerHTML(t, current);
      if (footer) footer.innerHTML = footerHTML(t, store);
      if (wasOpen) document.body.classList.remove('nav-locked');
    }
  };
})();
