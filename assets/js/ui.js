/* =========================================================================
   UI.JS — interaksi antarmuka (menu, dropdown, accordion, tab, lightbox).
   Semua memakai event delegation di `document`, sehingga tetap bekerja
   untuk elemen yang dirender belakangan oleh cms.js.
   ========================================================================= */
(function () {
  'use strict';

  var doc = document;
  var MOBILE_BP = 960;

  /* ---------- Menu mobile & dropdown ---------- */
  function nav() { return doc.getElementById('primaryNav'); }
  function toggleBtn() { return doc.getElementById('navToggle'); }

  function closeMobileNav() {
    var n = nav(), b = toggleBtn();
    if (n) n.classList.remove('is-open');
    if (b) b.setAttribute('aria-expanded', 'false');
    doc.body.classList.remove('nav-locked');
  }

  function closeDropdown(item) {
    item.removeAttribute('data-open');
    var b = item.querySelector('.nav-dropdown-toggle');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  function closeAllDropdowns(except) {
    doc.querySelectorAll('.has-dropdown').forEach(function (it) { if (it !== except) closeDropdown(it); });
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;

    // Tombol hamburger
    var tog = t.closest('.nav-toggle');
    if (tog) {
      var n = nav();
      var open = n.classList.toggle('is-open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.classList.toggle('nav-locked', open);
      return;
    }

    // Tombol dropdown (Profile, Gallery)
    var dd = t.closest('.nav-dropdown-toggle');
    if (dd) {
      var item = dd.closest('.has-dropdown');
      var isOpen = item.getAttribute('data-open') === 'true';
      closeAllDropdowns(item);
      if (isOpen) closeDropdown(item);
      else { item.setAttribute('data-open', 'true'); dd.setAttribute('aria-expanded', 'true'); }
      return;
    }

    // Klik di luar: tutup dropdown & menu mobile
    if (!t.closest('.has-dropdown')) closeAllDropdowns();
    if (nav() && nav().classList.contains('is-open') && !t.closest('.primary-nav')) closeMobileNav();

    // Klik tautan di dalam menu mobile: tutup menu
    if (t.closest('.primary-nav a')) closeMobileNav();
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openItem = doc.querySelector('.has-dropdown[data-open="true"]');
    closeAllDropdowns();
    if (nav() && nav().classList.contains('is-open')) {
      closeMobileNav();
      if (toggleBtn()) toggleBtn().focus();
    } else if (openItem) {
      var b = openItem.querySelector('.nav-dropdown-toggle');
      if (b) b.focus();
    }
  });

  // Desktop: dropdown yang dibuka lewat klik ikut menutup saat kursor pergi
  doc.addEventListener('mouseout', function (e) {
    var item = e.target.closest && e.target.closest('.has-dropdown');
    if (item && !item.contains(e.relatedTarget) && window.matchMedia('(hover: hover)').matches && window.innerWidth > MOBILE_BP) {
      closeDropdown(item);
    }
  });

  // Fokus keyboard keluar dari dropdown: tutup
  doc.addEventListener('focusout', function (e) {
    var item = e.target.closest && e.target.closest('.has-dropdown');
    if (item && e.relatedTarget && !item.contains(e.relatedTarget) && window.innerWidth > MOBILE_BP) closeDropdown(item);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > MOBILE_BP) closeMobileNav();
  });

  /* ---------- Bayangan header saat scroll ---------- */
  function onScroll() {
    var h = doc.getElementById('siteHeader');
    if (h) h.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Accordion (FAQ = satu terbuka; Kurikulum = banyak terbuka) ---------- */
  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest('.acc-trigger');
    if (!trigger) return;
    var item = trigger.closest('.acc-item');
    var wrap = trigger.closest('.accordion');
    var willOpen = !item.classList.contains('is-open');

    if (wrap && wrap.getAttribute('data-accordion') !== 'multi') {
      wrap.querySelectorAll('.acc-item.is-open').forEach(function (o) {
        o.classList.remove('is-open');
        o.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
      });
    }
    item.classList.toggle('is-open', willOpen);
    trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });

  /* ---------- Tab (Admission: online / offline) ---------- */
  function selectTab(tab) {
    var list = tab.closest('[role="tablist"]');
    var root = tab.closest('.tabs');
    if (!list || !root) return;
    list.querySelectorAll('[role="tab"]').forEach(function (b) {
      var on = b === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('[role="tabpanel"]').forEach(function (p) {
      p.hidden = p.id !== tab.getAttribute('aria-controls');
    });
  }
  doc.addEventListener('click', function (e) {
    var tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(tab);
  });
  doc.addEventListener('keydown', function (e) {
    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab) return;
    var tabs = Array.prototype.slice.call(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(tab), next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) { e.preventDefault(); next.focus(); selectTab(next); }
  });

  /* ---------- Lightbox galeri ---------- */
  var box = null, boxImg = null, boxCap = null, shots = [], idx = 0;

  function buildBox() {
    box = doc.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Galeri foto');
    box.innerHTML =
      '<button class="lightbox-btn lightbox-close" type="button" aria-label="Tutup">&times;</button>' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Foto sebelumnya">&#8249;</button>' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="Foto berikutnya">&#8250;</button>' +
      '<figure class="lightbox-figure"><img alt=""><figcaption></figcaption></figure>';
    doc.body.appendChild(box);
    boxImg = box.querySelector('img');
    boxCap = box.querySelector('figcaption');

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox-close')) box.close();
      else if (e.target.closest('.lightbox-prev')) show(idx - 1);
      else if (e.target.closest('.lightbox-next')) show(idx + 1);
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  function show(i) {
    if (!shots.length) return;
    idx = (i + shots.length) % shots.length;
    var fig = shots[idx];
    var img = fig.querySelector('img');
    var cap = fig.querySelector('figcaption');
    boxImg.src = img ? img.currentSrc || img.src : '';
    boxImg.alt = img ? img.alt : '';
    boxCap.textContent = cap ? cap.textContent : '';
    var multi = shots.length > 1;
    box.querySelector('.lightbox-prev').hidden = !multi;
    box.querySelector('.lightbox-next').hidden = !multi;
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-lightbox]');
    if (!btn || typeof HTMLDialogElement === 'undefined') return;
    if (!box) buildBox();
    var fig = btn.closest('.shot');
    shots = Array.prototype.slice.call(fig.parentElement.querySelectorAll('.shot'));
    show(shots.indexOf(fig));
    box.showModal();
  });
})();

/* ---------- Tombol "tampilkan lainnya" (daftar berita) ---------- */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-load-more]');
    if (!btn) return;
    var step = parseInt(btn.getAttribute('data-load-more'), 10) || 9;
    var scope = btn.parentElement.parentElement;
    var hidden = scope.querySelectorAll('.news-tile[hidden]');
    for (var i = 0; i < hidden.length && i < step; i++) hidden[i].hidden = false;
    if (hidden.length <= step) btn.parentElement.remove();
  });
})();

/* ---------- Tombol "Salin tautan" (halaman detail berita) ---------- */
(function () {
  'use strict';
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* abaikan */ }
    document.body.removeChild(ta);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-link]');
    if (!btn) return;
    var url = location.href.split('#')[0];
    var done = function () {
      var orig = btn.getAttribute('data-orig') || btn.textContent;
      btn.setAttribute('data-orig', orig);
      btn.textContent = btn.getAttribute('data-copied') || orig;
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.textContent = orig; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
    } else { fallbackCopy(url); done(); }
  });
})();
