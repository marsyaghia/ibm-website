-- =====================================================================
-- update-testimonials-carousel.sql — testimoni menjadi carousel kartu
-- (kiri: 1 foto; kanan: kutipan, lalu nama & batch).
-- Jalankan SEKALI di SQL Editor bila database Anda SUDAH berjalan (schema/seed versi lama).
-- Jika baru memulai dari nol, cukup schema.sql + seed.sql terbaru (file ini tidak perlu).
-- Aman dijalankan ulang; teks testimoni yang sudah ada tidak diubah.
-- =====================================================================

-- 1. Kolom baru
alter table public.testimonials add column if not exists batch text not null default '';

-- 2. Pindahkan isi kolom lama "school" (mis. "Batch 3 · Business Management") ke "batch"
update public.testimonials set batch = school
  where btrim(batch) = '' and btrim(school) <> '';

-- 3. Kolom "company" tidak dipakai (hapus bila sempat dibuat oleh versi file ini sebelumnya)
alter table public.testimonials drop column if exists company;

comment on table public.testimonials is 'Home — Testimonials carousel. Each card: photo_url (1 photo, left), quote, name, batch.';
comment on column public.testimonials.batch  is 'Batch / angkatan, mis. "Batch 3 · Business Management".';
comment on column public.testimonials.school is 'Kolom lama — dipakai hanya bila batch kosong. Boleh dikosongkan.';

-- 4. (Opsional) kolom foto ke-2 dan ke-3 tidak dipakai lagi. Hapus tanda "--" di bawah
--    bila ingin menghapusnya; foto di kolom tersebut akan hilang permanen.
-- alter table public.testimonials drop column if exists photo_url_2;
-- alter table public.testimonials drop column if exists photo_url_3;
