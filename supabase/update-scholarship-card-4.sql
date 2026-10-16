-- =====================================================================
-- update-scholarship-card-4.sql — menambah kartu beasiswa ke-4 di halaman Admission
-- Jalankan SEKALI di SQL Editor bila database Anda SUDAH berjalan (schema/seed versi lama).
-- Jika baru memulai dari nol, cukup schema.sql + seed.sql terbaru (file ini tidak perlu).
-- Aman dijalankan ulang; kartu beasiswa yang sudah ada tidak diubah.
-- Setelah dijalankan, isi kartu bisa diedit di tabel scholarships (baris "Scholarship Pathway 4").
-- =====================================================================

-- 1. Kartu ke-4 (tampil paling akhir: sort_order 40)
insert into public.scholarships (label, title, description, points, sort_order)
select 'Scholarship Pathway 4', 'Details Coming Soon',
       'Information about the fourth scholarship pathway will be published here. Edit this card in the scholarships table in Supabase.',
       '["Eligibility requirement 1", "Eligibility requirement 2"]'::jsonb, 40
where not exists (select 1 from public.scholarships where label = 'Scholarship Pathway 4');

-- 2. Judul section mengikuti jumlah kartu (hanya bila judul belum Anda ubah sendiri)
update public.site_content set value = 'Four Scholarship Pathways Available'
  where content_key = 'admission.scholarship.title' and value = 'Three Scholarship Pathways Available';

comment on table public.scholarships is 'Admission — scholarship cards (4 on the page): label, title, description, points (JSON array of texts). No button.';
