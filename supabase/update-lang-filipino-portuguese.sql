-- =====================================================================
-- update-lang-filipino-portuguese.sql — menu bahasa: tambah Filipino (Filipina)
-- dan Português (Timor-Leste).
-- Jalankan SEKALI di SQL Editor bila database Anda SUDAH berjalan (seed versi lama).
-- Jika baru memulai dari nol, cukup schema.sql + seed.sql terbaru (file ini tidak perlu).
-- Aman dijalankan ulang; bahasa lain yang sudah Anda atur tidak diubah.
-- =====================================================================

-- Disisipkan setelah Bahasa Melayu (bila ada), atau ditambahkan di akhir daftar.
update public.site_content
  set value = case
    when position('ms:Bahasa Melayu|' in value) > 0
      then replace(value, 'ms:Bahasa Melayu|', 'ms:Bahasa Melayu|tl:Filipino|pt:Português|')
    else value || '|tl:Filipino|pt:Português'
  end
  where content_key = 'global.lang.options'
    and value not like '%tl:%'
    and value not like '%pt:%';
