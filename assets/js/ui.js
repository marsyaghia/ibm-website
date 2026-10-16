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

/* ---------- Carousel (Why IBM Asia, The Lecturers, Testimonials) ----------
   Memakai scroll-snap bawaan browser: geser sentuh/trackpad bekerja tanpa JS.
   JS hanya menambah tombol prev/next (satu "halaman" = satu set kartu yang tampak),
   titik halaman, dan loop kembali ke awal.
   Autoplay: bergeser sendiri terus-menerus (loop tanpa henti). Jeda saat kursor di atas
   carousel, saat disentuh, saat fokus keyboard di dalamnya, saat tab tidak aktif, atau
   saat carousel tidak terlihat di layar. Interval bisa diatur lewat
   data-carousel-interval="ms" pada elemen [data-carousel] (default 5000). */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTO_DELAY = 3000;

  function behavior() { return reduce ? 'auto' : 'smooth'; }
  function slides(root) { return root.querySelectorAll('.carousel-slide'); }

  // Posisi scroll awal setiap "halaman" (jumlah kartu yang tampak = 1 halaman)
  function pageStops(vp) {
    var max = vp.scrollWidth - vp.clientWidth;
    if (max <= 2 || vp.clientWidth < 1) return [0];   // belum tampil / tidak perlu geser
    var stops = [], step = vp.clientWidth, x = 0;
    while (x < max - 2 && stops.length < 200) { stops.push(Math.round(x)); x += step; }
    stops.push(Math.round(max));
    return stops;
  }

  function currentPage(vp, stops) {
    var best = 0, d = Infinity;
    stops.forEach(function (s, i) {
      var diff = Math.abs(vp.scrollLeft - s);
      if (diff < d) { d = diff; best = i; }
    });
    return best;
  }

  function update(root) {
    var vp = root.querySelector('.carousel-viewport');
    var dots = root.querySelector('[data-carousel-dots]');
    var ctr = root.querySelector('.carousel-controls');
    if (!vp || !dots) return;
    var stops = pageStops(vp);
    root.classList.toggle('is-single', stops.length < 2);
    if (ctr) ctr.hidden = stops.length < 2;
    if (dots.children.length !== stops.length) {
      dots.innerHTML = '';
      stops.forEach(function (s, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'carousel-dot';
        b.setAttribute('data-carousel-dot', i);
        b.setAttribute('aria-label', (i + 1) + ' / ' + stops.length);
        dots.appendChild(b);
      });
    }
    var cur = currentPage(vp, stops);
    Array.prototype.forEach.call(dots.children, function (b, i) { b.classList.toggle('is-active', i === cur); });
  }

  function go(root, dir) {
    var vp = root.querySelector('.carousel-viewport');
    var stops = pageStops(vp);
    var cur = currentPage(vp, stops);
    var next = cur + dir;
    if (next >= stops.length) next = 0;                 // loop ke awal
    else if (next < 0) next = stops.length - 1;         // loop ke akhir
    vp.scrollTo({ left: stops[next], behavior: behavior() });
  }

  // Autoplay: setiap navigasi manual memanggil schedule() lagi agar hitungan waktu diulang
  function schedule(root) {
    clearTimeout(root._ibmTimer);
    var ms = parseInt(root.getAttribute('data-carousel-interval'), 10) || AUTO_DELAY;
    root._ibmTimer = setTimeout(function () {
      if (!doc.contains(root)) return;                  // carousel sudah di-render ulang
      var vp = root.querySelector('.carousel-viewport');
      var held = root._ibmHover || root._ibmFocus || root._ibmTouch;
      if (vp && !held && !doc.hidden && root._ibmInView !== false && pageStops(vp).length > 1) go(root, 1);
      schedule(root);
    }, ms);
  }

  function bindAutoplay(root) {
    root.addEventListener('mouseenter', function () { root._ibmHover = true; });
    root.addEventListener('mouseleave', function () { root._ibmHover = false; schedule(root); });
    root.addEventListener('touchstart', function () { root._ibmTouch = true; }, { passive: true });
    root.addEventListener('touchend', function () { root._ibmTouch = false; schedule(root); }, { passive: true });
    root.addEventListener('focusin', function (e) {
      // Jeda hanya untuk fokus keyboard, bukan fokus sisa klik mouse pada tombol
      var kb = true;
      try { kb = e.target.matches(':focus-visible'); } catch (err) { /* browser lama */ }
      root._ibmFocus = kb;
    });
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) { root._ibmFocus = false; schedule(root); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        root._ibmInView = entries[0].isIntersecting;
      }, { threshold: 0.25 }).observe(root);
    }
    schedule(root);
  }

  function init() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-carousel]'), function (root) {
      var vp = root.querySelector('.carousel-viewport');
      if (!vp) return;
      if (!root._ibmCarousel) {
        root._ibmCarousel = true;
        var ticking = false;
        vp.addEventListener('scroll', function () {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () { ticking = false; update(root); });
        }, { passive: true });
        vp.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(root, 1); schedule(root); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); go(root, -1); schedule(root); }
        });
        bindAutoplay(root);
      }
      update(root);
    });
  }

  doc.addEventListener('click', function (e) {
    var prev = e.target.closest('[data-carousel-prev]');
    var next = e.target.closest('[data-carousel-next]');
    var dot = e.target.closest('[data-carousel-dot]');
    var root = e.target.closest('[data-carousel]');
    if (!root) return;
    if (prev) go(root, -1);
    else if (next) go(root, 1);
    else if (dot) {
      var vp = root.querySelector('.carousel-viewport');
      var stops = pageStops(vp);
      vp.scrollTo({ left: stops[parseInt(dot.getAttribute('data-carousel-dot'), 10)] || 0, behavior: behavior() });
    }
    if (prev || next || dot) schedule(root);
  });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 150); });
  doc.addEventListener('cms:rendered', init);
  window.addEventListener('load', init);
  init();
})();

/* ---------- Pop-up profil dosen ---------- */
(function () {
  'use strict';
  var doc = document;
  var dlg = null, lastTrigger = null;

  function t(key, def) { return window.IBMCMS && window.IBMCMS.t ? window.IBMCMS.t(key, def) : def; }

  function build() {
    dlg = doc.createElement('dialog');
    dlg.className = 'person-modal';
    dlg.setAttribute('aria-labelledby', 'pmTitle');
    dlg.innerHTML =
      '<button class="modal-close" type="button" data-pm-close><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="pm-grid">' +
      '<div class="pm-photo"><img alt=""></div>' +
      '<div class="pm-body">' +
      '<h2 id="pmTitle"></h2>' +
      '<dl class="pm-facts"></dl>' +
      '<div class="pm-ach" hidden><h3></h3><ul></ul></div>' +
      '</div></div>';
    doc.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-pm-close]')) dlg.close();
    });
    dlg.addEventListener('close', function () {
      doc.body.classList.remove('modal-open');
      if (lastTrigger && doc.contains(lastTrigger)) lastTrigger.focus();
    });
  }

  function achievements(raw) {
    var v = raw;
    if (Array.isArray(v)) return v.map(String);
    v = String(v || '').trim();
    if (!v) return [];
    if (v.charAt(0) === '[') { try { var a = JSON.parse(v); if (Array.isArray(a)) return a.map(String); } catch (e) { /* teks biasa */ } }
    return v.split(/\r?\n/).map(function (l) { return l.replace(/^\s*[-•*]\s*/, '').trim(); }).filter(Boolean);
  }

  function fact(dl, label, value) {
    value = String(value || '').trim();
    if (!value) return;
    var dt = doc.createElement('dt'); dt.textContent = label;
    var dd = doc.createElement('dd'); dd.textContent = value;
    dl.appendChild(dt); dl.appendChild(dd);
  }

  function open(id, trigger) {
    var p = window.IBMCMS && window.IBMCMS.person ? window.IBMCMS.person(id) : null;
    if (!p || typeof HTMLDialogElement === 'undefined') return;
    if (!dlg) build();
    lastTrigger = trigger || null;

    var img = dlg.querySelector('.pm-photo img');
    var src = String(p.photo_url || '');
    if (/^https?:\/\/|^assets\//i.test(src)) { img.src = src; img.alt = t('global.a11y.photo_prefix', 'Photo') + ' ' + p.name; img.hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; }

    dlg.querySelector('.modal-close').setAttribute('aria-label', t('global.profile_modal.close_label', 'Close profile'));
    dlg.querySelector('#pmTitle').textContent = p.name || '';

    var dl = dlg.querySelector('.pm-facts');
    dl.innerHTML = '';
    fact(dl, t('global.profile_modal.position_label', 'Position'), p.position || p.program);
    fact(dl, t('global.profile_modal.company_label', 'Company'), p.company);
    fact(dl, t('global.profile_modal.specialty_label', 'Specialist'), p.specialty || p.detail);

    var ach = achievements(p.achievements);
    var box = dlg.querySelector('.pm-ach');
    var ul = box.querySelector('ul');
    ul.innerHTML = '';
    ach.forEach(function (a) { var li = doc.createElement('li'); li.textContent = a; ul.appendChild(li); });
    box.querySelector('h3').textContent = t('global.profile_modal.achievements_label', 'Achievements & Credibility');
    box.hidden = !ach.length;

    doc.body.classList.add('modal-open');
    dlg.showModal();
    dlg.scrollTop = 0;
  }

  doc.addEventListener('click', function (e) {
    var el = e.target.closest('[data-person-id]');
    if (el) open(el.getAttribute('data-person-id'), el);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('.person.is-clickable[data-person-id]');
    if (el && e.target === el) { e.preventDefault(); open(el.getAttribute('data-person-id'), el); }
  });
})();
