# Design System — IBM Institut Asia Malang

Tema: **profesional, hangat, dan internasional** — biru tua sebagai fondasi kepercayaan akademik, emas sebagai aksen yang dipakai hemat (tombol utama, garis penanda, angka penting).
Seluruh token berada di bagian `:root` pada `assets/css/style.css`; mengganti satu token mengubah seluruh situs.

## 1. Warna

| Token | Hex | Pemakaian |
|---|---|---|
| `--brand` | `#173671` | Warna identitas: teks judul, tombol sekunder, latar header/hero |
| `--brand-700` | `#102A5C` | Hover, gradien hero |
| `--brand-800` | `#0C2048` | Latar footer, bagian gelap |
| `--brand-900` | `#08142F` | Dasar paling gelap (bayangan, hero) |
| `--brand-500` | `#2A52A0` | Tautan, fokus, ikon |
| `--brand-300` | `#8CA2D2` | Teks sekunder di atas latar gelap |
| `--brand-100` | `#DDE4F2` | Garis/border lembut, chip |
| `--brand-50` | `#EEF2F9` | Latar seksi bergantian |
| `--gold` | `#EBB213` | **Aksen**: tombol utama (CTA), garis dekoratif, angka |
| `--gold-hover` | `#F5C93A` | Hover tombol emas |
| `--gold-ink` | `#7F5E00` | Teks emas di atas latar terang (kontras aman) |
| `--gold-100` | `#FCF3D2` | Latar lencana/badge lembut |
| `--ink` | `#0F1A33` | Teks judul paling gelap |
| `--text` | `#33415C` | Teks isi |
| `--muted` | `#5B6882` | Keterangan, label |
| `--line` | `#DAE0EC` | Garis pemisah |
| `--paper` | `#F4F6FA` | Latar halaman alternatif |

**Mengapa tidak "norak"?** Semua netral (ink/text/muted/line/paper) adalah turunan *biru-keabuan* dari warna identitas, bukan abu-abu murni, sehingga seluruh halaman terasa satu keluarga. Emas hanya muncul sebagai titik fokus; area lebar selalu putih, `paper`, atau biru tua.

### Kontras (WCAG 2.2, dihitung)

| Pasangan | Rasio | Hasil |
|---|---|---|
| Biru `#173671` di atas putih | 11,65 : 1 | AAA |
| Putih di atas biru `#173671` | 11,65 : 1 | AAA |
| Emas `#EBB213` di atas biru `#173671` | 6,05 : 1 | AA (teks normal) |
| Teks `ink` di atas emas (label tombol) | 8,97 : 1 | AAA |
| Teks isi `#33415C` di atas putih | 10,24 : 1 | AAA |
| `muted` di atas putih / `paper` | 5,60 / 5,18 : 1 | AA |
| `gold-ink` di atas `gold-100` | 5,39 : 1 | AA |
| `brand-300` di atas `brand-900` | 7,13 : 1 | AAA |

> Aturan praktis: **jangan** menaruh teks emas di atas latar putih — pakai `--gold-ink`.

## 2. Tipografi (Google Fonts)

- **Judul — Source Serif 4** (500–700): serif editorial yang elegan dan sangat terbaca di layar; memberi kesan institusi akademik.
- **Isi — Plus Jakarta Sans** (400–700): sans-serif geometris modern, bagus untuk teks Bahasa Indonesia dan angka.

| Elemen | Ukuran (fluid `clamp`) | Line-height | Berat |
|---|---|---|---|
| `h1` | 2.25rem → 4rem (36–64px) | 1.12 | 700 |
| `h2` | 1.75rem → 2.75rem (28–44px) | 1.2 | 600 |
| `h3` | 1.25rem → 1.5rem | 1.3 | 600 |
| `p` (isi) | 17px (1.0625rem) | **1.7** | 400 |
| Teks kecil / label | 0.8125–0.9375rem | 1.5 | 500–600 |

Lebar baris teks dibatasi ±65–70 karakter (`max-width` pada paragraf) agar nyaman dibaca.

## 3. Jarak, grid, dan bentuk

- Container maksimum **1200px**, gutter `clamp(1.25rem, 4vw, 2.5rem)` (20px di ponsel → 40px di desktop).
- Jarak antar-seksi `clamp(4rem, 2.5rem + 5.5vw, 7.5rem)`.
- Grid memakai CSS Grid `repeat(auto-fit, minmax(...))` dan Flexbox untuk baris sederhana.
- Radius kecil (6px / 10px) — tegas dan formal, bukan bulat "app".
- Bayangan berlapis halus berwarna biru gelap (`--shadow-pop`), bukan hitam pekat.

## 4. Breakpoint

| Lebar | Perubahan utama |
|---|---|
| ≥ 1101px | Layout desktop penuh, 4 kolom kartu |
| ≤ 1100px | Kolom kartu mengecil (4 → 3) |
| ≤ 1024px | Tablet: grid 2 kolom, hero menumpuk |
| ≤ 960px | **Menu hamburger**; dropdown menjadi akordeon di panel |
| ≤ 720px | Ponsel: 1–2 kolom, jarak seksi mengecil |
| ≤ 640px | Tabel menjadi **kartu bertumpuk** (label diambil dari `data-label`) |
| ≤ 420px | Ponsel kecil: tombol lebar penuh |

## 5. Komponen

Tombol (`.btn`, `.btn-gold`, `.btn-outline`), header + dropdown + CTA SIMAKA, hero dengan globe & statistik, kartu keunggulan, marquee mitra (berhenti saat hover/`prefers-reduced-motion`), kartu dosen/mahasiswa, kartu berita, akordeon FAQ, tab (Online/Offline), stepper pendaftaran, tabel kurikulum/kalender/biaya, galeri + lightbox (`<dialog>`), footer.

## 6. Aksesibilitas

- Tautan *skip to content*, fokus keyboard terlihat (cincin emas/biru), ARIA pada tab, akordeon, dan menu.
- Gerakan dimatikan untuk pengguna `prefers-reduced-motion`.
- Gambar selalu punya `alt` (dari kolom `alt_text`/`alt`), dan `loading="lazy"` kecuali di area paling atas.
- Target sentuh ≥ 44px pada navigasi ponsel.
