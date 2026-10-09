/* =========================================================================
   LAYOUT.JS — header & footer dibangun dari data CMS (key diawali "global.")
   Dengan begini menu, logo, alamat, dan kontak cukup diubah di database
   dan otomatis berlaku di semua halaman.
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

  function headerHTML(t, current) {
    var logo = safeUrl(t('global.brand.logo', 'assets/img/logo-mark.svg'));
    var simaka = safeUrl(t('global.simaka.url', ''));
    var h = '';
    h += '<div class="container header-inner">';
    h += '<a href="index.html" class="brand">' +
      (logo ? '<img class="brand-mark" src="' + esc(logo) + '" alt="' + esc(t('global.brand.logo_alt', 'Logo')) + '" width="44" height="44">' : '') +
      '<span class="brand-text"><strong>' + esc(t('global.brand.name', 'IBM Institut Asia')) + '</strong>' +
      '<small>' + esc(t('global.brand.subname', 'Malang')) + '</small></span></a>';
    h += '<button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="' +
      esc(t('global.nav.menu_label', 'Buka menu navigasi')) + '">' +
      '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span></button>';
    h += '<nav class="primary-nav" id="primaryNav" aria-label="' + esc(t('global.nav.aria_label', 'Navigasi utama')) + '"><ul class="nav-list">';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.home', 'Home', 'index.html', 'home') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.about', 'About IBM', 'about.html', 'about') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.admission', 'Admission', 'admission.html', 'admission') + '</li>';
    h += '<li class="nav-item">' + link(t, null, current, 'global.nav.news', 'News', 'news.html', 'news') + '</li>';
    h += '<li class="nav-item has-dropdown">' + dropdown(t, current, 'profile', 'global.nav.profile', 'Profile', [
      { key: 'global.nav.profile_lecturers', def: 'Profil Dosen', href: 'profile-lecturers.html', page: 'lecturers' },
      { key: 'global.nav.profile_students', def: 'Profil Mahasiswa', href: 'profile-students.html', page: 'students' }
    ]) + '</li>';
    h += '<li class="nav-item has-dropdown">' + dropdown(t, current, 'gallery', 'global.nav.gallery', 'Gallery', [
      { key: 'global.nav.gallery_activities', def: 'Kegiatan Mahasiswa', href: 'gallery-activities.html', page: 'gallery_activities' },
      { key: 'global.nav.gallery_facilities', def: 'Fasilitas Belajar', href: 'gallery-facilities.html', page: 'gallery_facilities' }
    ]) + '</li>';
    if (simaka) {
      h += '<li class="nav-item nav-item-cta"><a class="btn btn-gold btn-sm" href="' + esc(simaka) +
        '" target="_blank" rel="noopener noreferrer">' + esc(t('global.nav.simaka', 'SIMAKA')) + '</a></li>';
    }
    h += '</ul></nav></div>';
    return h;
  }

  var SOCIALS = [
    ['global.social.instagram', 'Instagram'],
    ['global.social.facebook', 'Facebook'],
    ['global.social.youtube', 'YouTube'],
    ['global.social.linkedin', 'LinkedIn'],
    ['global.social.tiktok', 'TikTok']
  ];

  function footerHTML(t) {
    var logo = safeUrl(t('global.brand.logo', 'assets/img/logo-mark.svg'));
    var email = String(t('global.footer.email', '')).trim();
    var phone = String(t('global.footer.phone', '')).trim();
    var address = String(t('global.footer.address', '')).trim();
    var tagline = String(t('global.footer.tagline', '')).trim();
    var copy = String(t('global.footer.copyright', '')).replace('{year}', new Date().getFullYear());

    var h = '<div class="container footer-grid">';
    h += '<div class="footer-brand"><a href="index.html" class="brand">' +
      (logo ? '<img class="brand-mark" src="' + esc(logo) + '" alt="' + esc(t('global.brand.logo_alt', 'Logo')) + '" width="44" height="44">' : '') +
      '<span class="brand-text"><strong>' + esc(t('global.brand.name', 'IBM Institut Asia')) + '</strong>' +
      '<small>' + esc(t('global.brand.subname', 'Malang')) + '</small></span></a>' +
      (tagline ? '<p>' + esc(tagline) + '</p>' : '') +
      (address ? '<address>' + esc(address) + '</address>' : '') + '</div>';

    h += '<nav aria-label="' + esc(t('global.footer.nav_title', 'Navigasi')) + '"><h2 class="footer-title">' + esc(t('global.footer.nav_title', 'Navigasi')) + '</h2><ul class="footer-list">' +
      '<li><a href="about.html">' + esc(t('global.nav.about', 'About IBM')) + '</a></li>' +
      '<li><a href="admission.html">' + esc(t('global.nav.admission', 'Admission')) + '</a></li>' +
      '<li><a href="news.html">' + esc(t('global.nav.news', 'News')) + '</a></li>' +
      '<li><a href="profile-lecturers.html">' + esc(t('global.nav.profile', 'Profile')) + '</a></li>' +
      '<li><a href="gallery-activities.html">' + esc(t('global.nav.gallery', 'Gallery')) + '</a></li></ul></nav>';

    h += '<div><h2 class="footer-title">' + esc(t('global.footer.contact_title', 'Kontak')) + '</h2><ul class="footer-list">';
    if (email) h += '<li><a href="mailto:' + esc(email) + '">' + esc(email) + '</a></li>';
    if (phone) h += '<li><a href="tel:' + esc(phone.replace(/[^\d+]/g, '')) + '">' + esc(phone) + '</a></li>';
    h += '</ul>';
    var social = '';
    SOCIALS.forEach(function (s) {
      var u = safeUrl(t(s[0], ''));
      if (u) social += '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + s[1] + '</a>';
    });
    if (social) h += '<div class="footer-social">' + social + '</div>';
    h += '</div></div>';
    h += '<div class="footer-bottom"><div class="container"><p>' + esc(copy) + '</p></div></div>';
    return h;
  }

  window.IBMLayout = {
    /**
     * @param store  objek { t(key, default) } dari cms.js
     * @param sigs   penyimpan "tanda tangan" agar tidak render ulang bila data sama
     */
    render: function (store, sigs) {
      var current = document.body.getAttribute('data-page') || '';
      if (current === 'news_detail') current = 'news';
      var header = document.getElementById('siteHeader');
      var footer = document.getElementById('siteFooter');
      var t = store.t;

      var keys = Object.keys(store.content).filter(function (k) { return k.indexOf('global.') === 0; }).sort();
      var sig = current + '|' + keys.map(function (k) { return store.content[k].value; }).join('\u0001');
      if (sigs.layout === sig) return;
      sigs.layout = sig;

      // Pertahankan menu mobile yang sedang terbuka (jika ada) saat render ulang
      var wasOpen = document.body.classList.contains('nav-locked');
      if (header) header.innerHTML = headerHTML(t, current);
      if (footer) footer.innerHTML = footerHTML(t);
      if (wasOpen) document.body.classList.remove('nav-locked');
    }
  };
})();
