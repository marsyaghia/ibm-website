# Website IBM Malang Asia Institute

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
  js/ui.js               Menu, dropdown, akordeon, tab, lightbox, kecepatan marquee partner
  js/theme.js            Mode terang/gelap (dimuat di <head>, disimpan di localStorage)
  js/fallback-data.js    Data cadangan (dihasilkan otomatis)
  img/                   Logo & favicon (SVG)
supabase/
  schema.sql             Tabel, RLS, bucket Storage
  seed.sql               Data awal (dihasilkan dari tools/build_seed.py)
  update-news-page.sql   Tambahan untuk database lama (halaman News)
  update-news-detail.sql Tambahan untuk database lama (detail berita)
  update-scholarship-title.sql  Judul section beasiswa → "Four Scholarship Programs" (jalankan sekali)
tools/build_seed.py      Pembuat seed.sql + migration-2026-10-redesign.sql + fallback-data.js
tools/migration_ddl.sql  Bagian struktur (DDL) yang disisipkan ke migrasi & schema.sql
docs/                    Panduan (desain, CMS, deploy)
```

## Mulai cepat

1. Proyek **baru**: jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di Supabase SQL Editor.
   Proyek **yang sudah berjalan**: cukup jalankan `supabase/migration-2026-10-redesign.sql` (tidak menghapus editan Anda; lihat kebijakan di bagian atas file).
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

Edit `tools/build_seed.py` lalu `python3 tools/build_seed.py` (butuh `beautifulsoup4`). Seed bersifat idempoten: hanya mengisi tabel yang masih kosong. Teks yang dipanggil JavaScript lewat `t('kunci', 'teks')` otomatis ikut diseed sehingga bisa diedit dari Supabase.
