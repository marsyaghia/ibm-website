-- =====================================================================
-- update-scholarship-no-buttons.sql — kartu beasiswa di halaman Admission tanpa tombol,
-- dan kartu ke-4 diberi bullet points seperti kartu lainnya.
-- Jalankan SEKALI di SQL Editor bila database Anda SUDAH berjalan (schema/seed versi lama).
-- Jika baru memulai dari nol, cukup schema.sql + seed.sql terbaru (file ini tidak perlu).
-- Aman dijalankan ulang.
-- =====================================================================

-- 1. Bullet points untuk kartu ke-4 (hanya bila masih kosong; isi teksnya bisa diedit
--    di tabel scholarships, kolom points, format: ["Poin 1", "Poin 2", "Poin 3"])
update public.scholarships
  set points = '["Eligibility requirement 1", "Eligibility requirement 2"]'::jsonb
  where label = 'Scholarship Pathway 4' and points = '[]'::jsonb;

-- 2. Tombol pada kartu tidak dipakai lagi: hapus kolomnya
--    ("Check Partner Schools", "Terms & Conditions", "Learn More")
alter table public.scholarships drop column if exists button_label;
alter table public.scholarships drop column if exists button_url;

-- 3. Teks tombol bawaan yang tidak dipakai lagi
delete from public.site_content where content_key = 'admission.scholarship.default_button';

comment on table public.scholarships is 'Admission — scholarship cards (4 on the page): label, title, description, points (JSON array of texts). No button.';
