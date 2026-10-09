# Deploy ke Jagoan Hosting (cPanel) — Langkah Ringkas

Situs ini 100% statis (HTML/CSS/JS). Tidak butuh PHP/Node/database di hosting; data hidup di Supabase.

## 1. Siapkan Supabase (sekali saja)

1. Buat proyek di <https://supabase.com> → catat **Project URL** (`https://xxxx.supabase.co`).
2. **SQL Editor** → New query → tempel isi `supabase/schema.sql` → **Run**.
3. Query baru → tempel `supabase/seed.sql` → **Run** (mengisi data contoh; aman dijalankan ulang).
4. **Project Settings → API Keys**: salin **Publishable key** (`sb_publishable_…`) — atau *anon key* lama (`eyJ…`) bila proyek Anda belum memakai yang baru.
   ⚠️ **JANGAN pernah** memakai `service_role` / *secret key* di website. Kunci itu melewati semua pengamanan.

## 2. Isi konfigurasi

Buka `assets/js/config.js`, ganti dua nilai:

```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_KEY: 'sb_publishable_xxxxxxxx',
```

Kunci publishable/anon **memang dirancang tampil di browser**. Keamanannya ada pada *Row Level Security* (RLS) di `schema.sql`: publik hanya boleh `SELECT` baris `is_published = true`; tidak ada hak tulis.

## 3. Uji lokal (opsional, 1 menit)

Dari folder proyek: `python3 -m http.server 8080` → buka <http://localhost:8080>. Ubah satu teks di Table Editor, muat ulang, pastikan berubah.

## 4. Kemas file

Unggah **hanya** file publik:

```
index.html  about.html  admission.html  profile-lecturers.html  profile-students.html
gallery-activities.html  gallery-facilities.html  news.html  news-detail.html  404.html
assets/   .htaccess   robots.txt
```

**Jangan** unggah `docs/`, `supabase/`, `tools/`, `README.md`. Zip file-file di atas (isi folder, bukan folder induknya).

## 5. Unggah di cPanel

1. Login cPanel Jagoan Hosting → **File Manager** → buka `public_html` (atau folder domain/addon).
2. **Upload** zip → klik kanan → **Extract**. Pastikan `index.html` langsung di `public_html/`, bukan di subfolder.
3. Aktifkan **Show Hidden Files** (Settings) untuk memastikan `.htaccess` ikut ter-extract.
4. Hapus zip setelah selesai.

## 6. SSL, HTTPS, dan pengamanan

1. cPanel → **SSL/TLS Status** → *Run AutoSSL* sampai domain berstatus terpasang (gembok).
2. Buka situs lewat `https://` dan pastikan tidak ada peringatan.
3. `.htaccess` sudah memaksa HTTPS (aktif sejak file diunggah — bila SSL belum siap, komentari sementara blok #1).
4. Header keamanan di `.htaccess` (CSP, nosniff, HSTS, dll.) sudah terpasang. CSP hanya mengizinkan: skrip milik sendiri, Google Fonts, koneksi ke `*.supabase.co`, gambar `https:`.
   Menambah layanan (Google Analytics, peta, chat)? Tambahkan domainnya pada direktif CSP yang sesuai (`script-src`, `connect-src`, `frame-src`…).

**Checklist keamanan**
- [ ] `config.js` hanya berisi URL + publishable/anon key
- [ ] RLS aktif di semua tabel (dicek di Table Editor — ikon gembok)
- [ ] Tidak ada file `.sql`, `.py`, `.md` di `public_html` (diblokir juga oleh `.htaccess`)
- [ ] Akun Supabase memakai 2FA; editor diberi peran minimum
- [ ] (Opsional) Supabase → Auth/API → batasi *allowed origins* bila tersedia di plan Anda

## 7. Verifikasi & pemecahan masalah

Buka situs → tekan **F12 → Console/Network**. Request ke `https://xxxx.supabase.co/rest/v1/...` harus berstatus **200**.

| Gejala | Penyebab | Solusi |
|---|---|---|
| Teks contoh (bukan data DB) tampil | `config.js` masih placeholder / URL salah | Isi URL & key, hard-refresh (Ctrl+F5) |
| Console: *Refused to connect… CSP* | Domain Supabase tak cocok pola `*.supabase.co` | Sesuaikan `connect-src` di `.htaccess` |
| 401 / 403 dari Supabase | Key salah, atau RLS/grant belum dijalankan | Jalankan ulang `schema.sql`; cek key |
| Request 200 tapi daftar kosong | Tabel kosong / `is_published` false | Jalankan `seed.sql` / centang kolom |
| Font tidak berubah | Google Fonts terblokir jaringan | Cek koneksi; situs tetap terbaca dengan font cadangan |
| Halaman 404 tampil rusak | `404.html` tak di root | Letakkan di `public_html/` |
| Perubahan CSS/JS tak terlihat | Cache browser 1 minggu | Tambah `?v=2` pada tautan di HTML, atau Ctrl+F5 |
| Error 500 setelah unggah | Baris `.htaccess` tidak didukung server | Komentari blok bermasalah (mis. `Header`), kabari support hosting |

## 8. Perilaku cache & ketahanan

- Data disimpan di `localStorage` pengunjung (*stale-while-revalidate*): halaman tampil instan dari cache, lalu diperbarui diam-diam dari Supabase. Perubahan konten muncul pada kunjungan berikutnya, atau sepersekian detik setelah halaman terbuka.
- Jika Supabase tak terjangkau, situs tetap menampilkan data cadangan (`fallback-data.js`) — halaman tidak pernah kosong.
- Setelah mengubah **struktur** data (bukan isi), naikkan `CACHE_VERSION` di `config.js` agar cache lama dibuang.
- Plan gratis Supabase dapat menjeda proyek yang lama tak aktif — cek kebijakan terbaru di dokumentasi Supabase. Selama ada kunjungan/aktivitas dan Anda memeriksa Dashboard berkala, risiko kecil; pertimbangkan plan berbayar untuk produksi.
- **Backup:** Dashboard → Database → Backups (sesuai plan), dan sesekali *Export CSV* tiap tabel dari Table Editor. Simpan `schema.sql` + `seed.sql` — keduanya bisa membangun ulang seluruh database.

## 9. Update situs di kemudian hari

- **Konten** → cukup Table Editor (lihat `docs/CMS-GUIDE.md`); tidak perlu unggah apa pun.
- **Tampilan/kode** → unggah ulang file yang berubah lewat File Manager (timpa).
