# Panduan Mengelola Konten (tanpa menyentuh kode)

Semua teks, gambar, dan daftar di website dibaca dari Supabase. Anda mengubahnya lewat
**Supabase Dashboard → Table Editor**. Perubahan tampil di website dalam hitungan detik
(pengunjung yang pernah membuka situs melihat versi lama sepersekian detik, lalu otomatis diperbarui).

## 1. Dua jenis tabel

| Jenis | Tabel | Untuk apa |
|---|---|---|
| **Teks tunggal** | `site_content` | Judul, paragraf, tombol, gambar hero, header/footer, meta SEO — satu baris per elemen |
| **Daftar** | `list_items`, `why_items`, `partners`, `news`, `faqs`, `people`, `curriculum_courses`, `academic_calendar`, `admission_steps`, `admission_documents`, `scholarships`, `reregistration_fees`, `testimonials`, `footer_links`, `buttons`, `gallery_items` | Kumpulan item yang bisa bertambah/berkurang |

### 1.1 `site_content` — satu baris = satu elemen

| Kolom | Fungsi |
|---|---|
| `content_key` | Alamat elemen: `halaman.bagian.nama`, mis. `home.hero.title`. **Jangan diubah.** |
| `kind` | `text` (teks biasa), `richtext` (boleh tebal/miring/tautan), `image`, `link` |
| `value` | **Isi yang Anda ubah.** Kosong = elemen disembunyikan di website |
| `alt_text` | Deskripsi gambar (untuk `kind = image`) |
| `label` | Keterangan untuk membantu Anda mencari baris (tidak tampil) |

Tips mencari: di Table Editor, filter kolom `page` (mis. `home`, `about`, `admission`, `global`).
Kunci `global.*` = header, footer, tautan sosial media, URL SIMAKA, gambar bagikan (OG).

**Richtext** hanya mengizinkan tag: `b, strong, i, em, u, br, a, p, ul, ol, li, span, small`. Tag lain (mis. `<script>`, `<iframe>`) otomatis dibuang demi keamanan.

**Token tahun:** pada `global.footer.copyright`, tulis `{year}` (atau `{2026}`) — tahun diganti otomatis dengan tahun berjalan. Teks ditampilkan di tengah.

### 1.2 Tabel daftar — kolom bersama

Setiap tabel daftar punya:
- `is_published` — **centang/uncentang** untuk menampilkan/menyembunyikan item (tanpa menghapus).
- `sort_order` — angka urutan, kecil tampil lebih dulu. Data awal diberi jarak 10, 20, 30… agar mudah menyisipkan (mis. 15).

### 1.3 Ringkasan kolom per tabel

| Tabel | Kolom penting | Tampil di |
|---|---|---|
| `list_items` | `group_key` (`home.hero_stats` / `home.double_degree` / `about.glimpse_facts` / `global.opening_hours`), `title`, `body` | Statistik hero, poin Double Degree, fakta About, **jam buka di footer** (`title` = hari, `body` = jam) |
| `why_items` | `icon`, `title`, `description` | Beranda — carousel "Why IBM Asia?" |
| `partners` | `name`, `logo_url`, `website_url`, **`is_official`** | `is_official = true` → slot **Official Partner** (terkunci di kiri, mis. Trent Global College). Lainnya bergulir otomatis. Tampil di Beranda (menempel setengah di hero) dan semua halaman lain |
| `news` | `title`, `excerpt`, `image_url`, `published_at`, `is_featured`, `link_url`, `slug`, `content` | Beranda & strip "IBM News" di halaman lain; halaman **News**. Kartu membuka halaman detail bila `content` terisi; jika kosong memakai `link_url` |
| `faqs` | `question`, `answer` | Beranda — FAQ |
| `people` | `kind` (`lecturer`/`student`), `name`, `photo_url`, **dosen:** `position`, `company`, `specialty`, `achievements` (satu baris = satu pencapaian), `is_featured`; **mahasiswa:** `program`, `detail`, **`batch`** (1, 2, 3, 4…) | Dosen: carousel Beranda (`is_featured`) + halaman Profile Lecturers; **klik kartu = pop-up** (Full name, Position, Company, Specialist, Achievements & Credibility). Mahasiswa: tab **Batch** di Profile Students (Batch terkecil tampil pertama) |
| `testimonials` | `name`, `batch`, `quote`, `photo_url` (1 foto, sebaiknya potret 4:5) | Beranda — Testimonials: carousel kartu (foto di kiri; kutipan di kanan atas, nama & batch di kanan bawah). 2 kartu per tampilan di desktop, 1 di tablet/HP; bergeser otomatis dan berulang |
| `footer_links` | `group_no` (1 = New Student Admission, 2 = Institutions/Agencies, 3 = Student Services), `label`, `url` | Footer kolom 1 (semua halaman). Judul grup: `site_content` → `global.footer.group_1_title` … `group_3_title` |
| `buttons` | `group_key` (`home.simaka`, `admission.scholarship_registration`, `admission.scholarship_test`), `label`, `url`, `variant` (`gold`/`navy`/`outline`/`light`) | For Students / For Lecturers, Apply Now, TPA Test, TPE Test. `url` kosong = tombol tampil nonaktif ("Link coming soon") |
| `curriculum_courses` | `semester`, `course_name`, `credits` | About — kurikulum |
| `academic_calendar` | `activity`, `start_date`, `end_date` | About — kalender akademik |
| `admission_steps` | `track` (`online`/`offline`), `title`, `description`, **`link_label`**, **`link_url`** | Admission — langkah pendaftaran. Isi `link_label` + `link_url` untuk menampilkan tombol di dalam langkah (mis. langkah 1 online: "Register Now") |
| `admission_documents` | `document_name` | Admission — berkas |
| `scholarships` | `label`, `title`, `description`, `points` (JSON array, mis. `["Poin 1", "Poin 2"]`) | Admission — **4 kartu** beasiswa (4 sejajar di desktop, 2 di tablet, 1 di HP). Kartu berisi informasi saja, tanpa tombol |
| `reregistration_fees` | `period_label`, `fee` | Admission — tabel Re-Registration Fees (4 periode). `fee = 0` tampil "To be announced" |
| `gallery_items` | `gallery` (`activities`/`facilities`), `caption`, `image_url`, `alt_text` | Halaman galeri |
| `visitor_leads` | `full_name`, `school`, `phone`, `email`, `page_url`, `referrer` | **Data pengunjung dari pop-up Beranda.** Hanya bisa diisi oleh website (insert-only); dibaca di Dashboard / Export CSV |

> `tuition_programs` sudah **tidak dipakai** (dipertahankan agar data lama aman). Biaya kini diatur lewat `reregistration_fees` dan kunci `admission.tuition.*` di `site_content`.

### 1.4 Teks Biaya Kuliah (Admission) — `site_content`

| Kunci | Isi |
|---|---|
| `admission.tuition.rereg_title` | Judul tabel Re-Registration Fees |
| `admission.tuition.rereg_note_1`, `rereg_note_2` | Dua catatan di bawah tabel |
| `admission.tuition.semester_title`, `semester_fee`, `semester_caption` | Judul, nominal (mis. `Rp 12.250.000`), keterangan |
| `admission.tuition.semester_note`, `semester_subnote_1`, `semester_subnote_2` | 1 catatan + 2 sub-catatan |

### 1.5 Pengaturan penting lain (`site_content`)

| Kunci | Fungsi |
|---|---|
| `home.join.countdown_target` | Batas waktu hitung mundur, mis. `2026-12-31T23:59:59+07:00` (atau hanya tanggal). Kosong = hitung mundur disembunyikan |
| `home.join.whatsapp_template` | Isi pesan WhatsApp dari form "Join Now" (`{name}`, `{school}`, `{message}`) |
| `global.contact.whatsapp` | Nomor WhatsApp tujuan (format internasional tanpa +, mis. `6285174334514`) |
| `global.social.whatsapp` / `instagram` / `tiktok` / `youtube` | Tautan ikon sosial di footer. Kosong = ikon redup tanpa tautan |
| `global.footer.map_url` | URL embed Google Maps (Google Maps → Share → Embed a map → salin isi `src`). Kosong = peta dibuat dari alamat |
| `global.footer.hours_title`, `social_title`, `clock_label` | Judul kolom footer ke-3 |
| `global.lang.options` | Daftar bahasa menu terjemahan: `kode:Nama|kode:Nama`. Kode mengikuti Google Translate, mis. `tl` = Filipino, `pt` = Português |
| `home.gate.enabled` | `false` = matikan pop-up data pengunjung. `home.gate.remember_days` = berapa hari pop-up tidak muncul lagi di perangkat yang sama |

`points` pada beasiswa berformat JSON, contoh: `["Potongan 50% SPP", "Berlaku 1 tahun"]`.

Ikon `why_items.icon` yang tersedia: `globe`, `book`, `briefcase`, `users`, `compass`, `award`, `chart`, `star`, `graduate`, `languages`, `sparkles`, `plane`, `badge-check`. Boleh juga diisi URL gambar (`https://…`).

## 2. Mengunggah gambar

1. Dashboard → **Storage** → bucket **`site-media`** (publik, maks. 5 MB, hanya gambar).
2. Unggah file (sarankan **WebP/JPG**, lebar maks. 1600px; foto orang 800×800).
3. Klik file → **Get URL** (public URL).
4. Tempel URL ke kolom `value` (site_content, kind = image) atau `photo_url` / `image_url` / `logo_url` pada tabel daftar.

Ukuran yang disarankan: hero 1600×900 · foto dosen/mahasiswa 800×800 · berita 1200×675 · galeri 1200×800 · logo mitra PNG/SVG transparan, tinggi ±120px.

## 3. Menambah / menghapus

- **Item baru di daftar:** *Insert row* → isi kolom → biarkan `is_published` tercentang.
- **Menyembunyikan:** hilangkan centang `is_published`.
- **Menghapus elemen tunggal:** kosongkan `value` (jangan hapus barisnya).
- **Menambah teks baru di halaman** (butuh sentuhan kode kecil sekali): di HTML tambahkan atribut, mis. `<p data-cms="home.hero.note">Teks cadangan</p>`, lalu tambahkan barisnya di `site_content` dengan `content_key` yang sama. Cara tampil mengikuti `kind` baris tersebut (`text` / `richtext`). Atribut lain: `data-cms-src` (gambar, alt diambil dari `alt_text`), `data-cms-href` (tautan), `data-cms-bg` (gambar latar), `data-cms-content` (meta SEO). Setelah itu selalu bisa diedit dari database.

## 4. Menambah editor

Dashboard → **Organization/Project Settings → Team** → undang email, beri peran **Developer** (bisa mengedit data) — jangan memberi peran Owner kecuali perlu.
Pengunjung website **tidak bisa** mengubah data: tabel hanya mengizinkan `SELECT` untuk publik (lihat `supabase/schema.sql`).

## 5. Bila perubahan tidak muncul

| Gejala | Penyebab / solusi |
|---|---|
| Item baru tidak tampil | `is_published` belum dicentang, atau `sort_order`/`group_key`/`kind` salah ketik |
| Teks lama masih tampil | Muat ulang sekali (cache stale-while-revalidate memperbarui di latar belakang); atau naikkan `CACHE_VERSION` di `assets/js/config.js` |
| Gambar kosong | URL salah / bukan HTTPS / file > 5 MB / bucket bukan publik |
| Seluruh situs menampilkan teks awal | Koneksi Supabase gagal → cek `config.js` dan status proyek (lihat DEPLOY-CPANEL.md §7) |

## 6. Opsional: panel admin sendiri

Jika nanti ingin editor tanpa akses Dashboard: buat halaman admin terpisah dengan **Supabase Auth** + kebijakan RLS khusus (mis. tabel `editors`), jangan pernah menaruh `service_role` di sisi klien. Struktur tabel saat ini sudah siap untuk itu.

## 7. Menambah berita (dengan halaman detail)

1. Table Editor → tabel `news` → **Insert row**.
2. Isi `title`, `excerpt` (ringkasan 1–2 kalimat; tampil di kartu dan di bawah judul artikel), `image_url` (URL dari Storage, rasio 16:9, mis. 1200×675), `published_at`.
3. **`content` = isi artikel.** Ada dua cara menulis:
   - **Teks biasa** — cukup ketik; pisahkan paragraf dengan **satu baris kosong** (tekan Enter dua kali).
   - **HTML terbatas** — untuk judul bagian, daftar, kutipan, tautan, dan gambar: `<p>`, `<h2>`, `<h3>`, `<h4>`, `<ul>/<ol>/<li>`, `<blockquote>`, `<a href="…">`, `<img src="https://…" alt="…">`, `<b>`, `<i>`, `<br>`. Tag lain (script, iframe, atribut style/onclick) otomatis dibuang demi keamanan.
4. **`slug`: kosongkan** — dibuat otomatis dari judul (mis. `kuliah-tamu-strategi-ekspor`) dan alamat artikelnya menjadi `news-detail.html?slug=kuliah-tamu-strategi-ekspor`. Slug tidak berubah saat judul diedit, sehingga tautan yang sudah dibagikan tetap berlaku. Bila ingin mengubahnya, isi manual (huruf kecil, angka, tanda `-`; harus unik).
5. `link_url` (opsional): bila `content` terisi, tautan ini muncul sebagai tombol **"Baca sumber asli"** di halaman detail. Bila `content` kosong, kartu langsung membuka `link_url`.
6. Centang `is_featured` agar berita tampil besar di beranda dan berlabel di halaman News. Teks label ada di `site_content` → `news.flag_featured`.
7. Teks halaman detail (tombol bagikan, "Berita Lainnya", pesan "Berita tidak ditemukan") diatur di `site_content` dengan filter `page = news_detail`.

Menyembunyikan berita: hilangkan centang `is_published` — kartu dan halaman detailnya (tautan lama) otomatis menampilkan "Berita tidak ditemukan".

> **Catatan berbagi ke media sosial:** karena situs ini statis, pratinjau tautan di WhatsApp/Facebook memakai judul & gambar umum situs (`global.seo.og_image`), bukan judul artikel. Judul tab browser dan meta tag untuk pembaca/Google yang menjalankan JavaScript tetap mengikuti artikel. Pratinjau per-artikel butuh rendering di server (mis. Supabase Edge Function / hosting dengan PHP) — bisa ditambahkan bila diperlukan.
