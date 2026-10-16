-- =====================================================================
-- update-news-page.sql — tambahan untuk halaman News (news.html)
-- Jalankan SEKALI di SQL Editor bila Anda SUDAH menjalankan seed.sql versi lama.
-- (Jika baru memulai dari nol, cukup jalankan schema.sql lalu seed.sql terbaru.)
-- Aman dijalankan ulang: baris yang sudah ada tidak ditimpa.
-- =====================================================================

insert into public.site_content (content_key, kind, value, alt_text, label) values
  ('global.nav.news', 'text', 'News', null, 'Global (semua halaman) › Nav › News'),
  ('news.flag_featured', 'text', 'Pilihan Redaksi', null, 'News › Label berita unggulan'),
  ('news.load_more', 'text', 'Tampilkan berita lainnya', null, 'News › Teks tombol muat lebih banyak'),
  ('news.meta.title', 'text', 'IBM News — Institut Asia Malang', null, 'News › Meta › Judul'),
  ('news.meta.description', 'text', 'Kabar terbaru seputar kegiatan kampus, mahasiswa, dan program IBM Institut Asia Malang.', null, 'News › Meta › Deskripsi'),
  ('news.hero.eyebrow', 'text', 'IBM News', null, 'News › Hero › Teks kecil di atas judul'),
  ('news.hero.title', 'text', 'Berita & Informasi Terbaru', null, 'News › Hero › Judul'),
  ('news.hero.description', 'text', 'Kabar terbaru seputar kegiatan kampus, prestasi mahasiswa, dan program IBM Institut Asia Malang.', null, 'News › Hero › Deskripsi'),
  ('news.empty', 'text', 'Belum ada berita yang dipublikasikan.', null, 'News › Pesan bila belum ada berita')
on conflict (content_key) do nothing;

-- Arahkan tautan "Lihat semua berita" di beranda ke halaman baru (hanya bila masih kosong).
update public.site_content
   set value = 'news.html'
 where content_key = 'home.news.more_url' and value = '';

insert into public.site_content (content_key, kind, value, alt_text, label)
values ('home.news.more_url', 'link', 'news.html', null, 'Beranda › News › Tautan ''lihat semua''')
on conflict (content_key) do nothing;
