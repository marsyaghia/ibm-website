-- =====================================================================
-- update-scholarship-title.sql — mengganti judul section beasiswa di halaman Admission
-- Dari  : "Four Scholarship Pathways Available"
-- Menjadi: "Four Scholarship Programs"
--
-- Jalankan SEKALI di Supabase → SQL Editor. Aman dijalankan ulang.
-- Hanya mengubah judul bila nilainya masih judul lama (editan manual Anda tidak ditimpa).
-- Pilihan judul lain bila ingin: "Scholarship Programs" · "Our Scholarship Programs" ·
--   "Find the Scholarship That Fits You". Cukup ganti teks di bawah, atau edit langsung
--   di tabel site_content (content_key = admission.scholarship.title).
-- =====================================================================
update public.site_content
   set value = 'Four Scholarship Programs'
 where content_key = 'admission.scholarship.title'
   and value in ('Four Scholarship Pathways Available', 'Three Scholarship Pathways Available');
