# Website IBM — Institut Asia Malang

Website statis (HTML/CSS/JS murni) dengan konten dinamis dari **Supabase**. Semua teks, gambar, dan daftar dapat diubah dari database tanpa mengubah kode.

## Struktur

```
index.html · about.html · admission.html · news.html · news-detail.html
profile-lecturers.html · profile-students.html
gallery-activities.html · gallery-facilities.html · 404.html
.htaccess · robots.txt
assets/
  css/style.css          Design system + semua komponen
  js/config.js           ← ISI: URL + publishable key Supabase
  js/cms.js              Fetch Supabase, escape/sanitasi, render HTML
  js/layout.js           Header & footer dari data (global.*)
  js/ui.js               Menu, dropdown, akordeon, tab, lightbox
  js/fallback-data.js    Data cadangan (dihasilkan otomatis)
  img/                   Logo & favicon (SVG)
supabase/
  schema.sql             Tabel, RLS, bucket Storage
  seed.sql               Data awal (dihasilkan dari tools/build_seed.py)
  update-news-page.sql   Tambahan untuk database lama (halaman News)
  update-news-detail.sql Tambahan untuk database lama (detail berita)
tools/build_seed.py      Pembuat seed.sql + fallback-data.js
docs/                    Panduan (desain, CMS, deploy)
```

## Mulai cepat

1. Jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di Supabase SQL Editor.
2. Isi `assets/js/config.js` (Project URL + publishable/anon key — **bukan** service_role).
3. Uji: `python3 -m http.server 8080`.
4. Deploy: ikuti [docs/DEPLOY-CPANEL.md](docs/DEPLOY-CPANEL.md).

## Dokumentasi

- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — warna, font, skala, breakpoint, kontras
- [docs/CMS-GUIDE.md](docs/CMS-GUIDE.md) — cara mengubah konten, mengunggah gambar
- [docs/DEPLOY-CPANEL.md](docs/DEPLOY-CPANEL.md) — deploy & keamanan di Jagoan Hosting

## Cara kerja singkat

1. HTML memuat teks cadangan dan atribut `data-cms="kunci"`.
2. `cms.js` menampilkan cache lokal (jika ada), lalu mengambil data terbaru dari REST API Supabase (`fetch`, hanya `GET`) dan merender ulang.
3. Semua nilai di-*escape*; HTML kaya disaring (whitelist tag); URL dibatasi `http(s)`/relatif.
4. Keamanan: RLS read-only untuk publik, tanpa hak tulis; CSP ketat di `.htaccess`.

## Memperbarui seed / data cadangan

Edit `tools/build_seed.py` lalu `python3 tools/build_seed.py` (butuh `beautifulsoup4`). Seed bersifat idempoten: hanya mengisi tabel yang masih kosong.
