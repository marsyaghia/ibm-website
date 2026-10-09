-- =====================================================================
-- seed.sql — DATA AWAL website IBM Institut Asia Malang
-- DIHASILKAN OTOMATIS oleh tools/build_seed.py — jangan diedit manual.
-- Aman dijalankan ulang: tabel yang SUDAH berisi tidak akan ditimpa/diduplikasi,
-- dan site_content memakai 'on conflict do nothing' sehingga hasil editan Anda aman.
-- Jalankan SETELAH schema.sql.
-- =====================================================================

insert into public.site_content (content_key, kind, value, alt_text, label) values
  ('global.brand.name', 'text', 'IBM Institut Asia', null, 'Global (semua halaman) › Brand › Name'),
  ('global.brand.subname', 'text', 'Malang', null, 'Global (semua halaman) › Brand › Subname'),
  ('global.brand.logo', 'image', 'assets/img/logo-mark.svg', 'Logo IBM Institut Asia Malang', 'Global (semua halaman) › Brand › Logo'),
  ('global.brand.logo_alt', 'text', 'Logo IBM Institut Asia Malang', null, 'Global (semua halaman) › Brand › Logo alt'),
  ('global.nav.home', 'text', 'Home', null, 'Global (semua halaman) › Nav › Home'),
  ('global.nav.about', 'text', 'About IBM', null, 'Global (semua halaman) › Nav › About'),
  ('global.nav.admission', 'text', 'Admission', null, 'Global (semua halaman) › Nav › Admission'),
  ('global.nav.news', 'text', 'News', null, 'Global (semua halaman) › Nav › News'),
  ('global.nav.profile', 'text', 'Profile', null, 'Global (semua halaman) › Nav › Profile'),
  ('global.nav.profile_lecturers', 'text', 'Profil Dosen', null, 'Global (semua halaman) › Nav › Profile lecturers'),
  ('global.nav.profile_students', 'text', 'Profil Mahasiswa', null, 'Global (semua halaman) › Nav › Profile students'),
  ('global.nav.gallery', 'text', 'Gallery', null, 'Global (semua halaman) › Nav › Gallery'),
  ('global.nav.gallery_activities', 'text', 'Kegiatan Mahasiswa', null, 'Global (semua halaman) › Nav › Gallery activities'),
  ('global.nav.gallery_facilities', 'text', 'Fasilitas Belajar', null, 'Global (semua halaman) › Nav › Gallery facilities'),
  ('global.nav.simaka', 'text', 'SIMAKA', null, 'Global (semua halaman) › Nav › Simaka'),
  ('global.nav.menu_label', 'text', 'Buka menu navigasi', null, 'Global (semua halaman) › Nav › Menu label'),
  ('global.nav.aria_label', 'text', 'Navigasi utama', null, 'Global (semua halaman) › Nav › Aria label'),
  ('global.simaka.url', 'link', 'https://simaka.ibmasia.ac.id', null, 'Global (semua halaman) › Simaka › Url'),
  ('global.footer.tagline', 'text', 'International Business Management — membekali lulusan untuk berkarier di panggung bisnis global.', null, 'Global (semua halaman) › Footer › Tagline'),
  ('global.footer.address', 'text', 'Jl. Contoh No. 123, Malang, Jawa Timur', null, 'Global (semua halaman) › Footer › Address'),
  ('global.footer.email', 'text', 'info@ibmasia.ac.id', null, 'Global (semua halaman) › Footer › Email'),
  ('global.footer.phone', 'text', '(0341) 000-000', null, 'Global (semua halaman) › Footer › Phone'),
  ('global.footer.nav_title', 'text', 'Navigasi', null, 'Global (semua halaman) › Footer › Nav title'),
  ('global.footer.contact_title', 'text', 'Kontak', null, 'Global (semua halaman) › Footer › Contact title'),
  ('global.footer.copyright', 'text', '© {year} IBM Institut Asia Malang. Seluruh hak cipta dilindungi.', null, 'Global (semua halaman) › Footer › Copyright'),
  ('global.social.instagram', 'link', '', null, 'Global (semua halaman) › Social › Instagram'),
  ('global.social.facebook', 'link', '', null, 'Global (semua halaman) › Social › Facebook'),
  ('global.social.youtube', 'link', '', null, 'Global (semua halaman) › Social › Youtube'),
  ('global.social.linkedin', 'link', '', null, 'Global (semua halaman) › Social › Linkedin'),
  ('global.social.tiktok', 'link', '', null, 'Global (semua halaman) › Social › Tiktok'),
  ('global.a11y.photo_prefix', 'text', 'Foto', null, 'Global (semua halaman) › A11y › Photo prefix'),
  ('global.a11y.zoom_image', 'text', 'Perbesar foto', null, 'Global (semua halaman) › A11y › Zoom image'),
  ('global.seo.og_image', 'image', '', null, 'Global (semua halaman) › Seo › Og image'),
  ('news.flag_featured', 'text', 'Pilihan Redaksi', null, 'News › Flag featured'),
  ('news.load_more', 'text', 'Tampilkan berita lainnya', null, 'News › Load more'),
  ('news_detail.share_label', 'text', 'Bagikan:', null, 'Detail Berita › Share label'),
  ('news_detail.copy_label', 'text', 'Salin tautan', null, 'Detail Berita › Copy label'),
  ('news_detail.copied_label', 'text', 'Tautan disalin ✓', null, 'Detail Berita › Copied label'),
  ('news_detail.source_label', 'text', 'Baca sumber asli', null, 'Detail Berita › Source label'),
  ('news_detail.breadcrumb_label', 'text', 'Navigasi remah roti', null, 'Detail Berita › Breadcrumb label'),
  ('home.meta.title', 'text', 'IBM Institut Asia Malang — Start Your Future', null, 'Beranda › Meta › Judul'),
  ('global.a11y.skip_link', 'text', 'Langsung ke konten', null, 'Global (semua halaman) › A11y › Skip link'),
  ('home.hero.tag', 'text', 'Penerimaan Mahasiswa Baru', null, 'Beranda › Hero › Label'),
  ('home.hero.title', 'text', 'Start Your
Future, Here.', null, 'Beranda › Hero › Judul'),
  ('home.hero.description', 'text', 'International Business Management di Institut Asia Malang membekali kamu dengan kurikulum berbasis industri, dosen praktisi, dan jejaring mitra global untuk berkarier di level internasional.', null, 'Beranda › Hero › Deskripsi'),
  ('home.hero.cta_primary', 'text', 'Daftar Sekarang', null, 'Beranda › Hero › Tombol utama (teks)'),
  ('home.hero.cta_secondary', 'text', 'Kenali Kampus Kami', null, 'Beranda › Hero › Tombol kedua (teks)'),
  ('home.hero.badge_mark', 'text', 'A', null, 'Beranda › Hero › Huruf lencana'),
  ('home.hero.badge_text', 'text', 'Terakreditasi', null, 'Beranda › Hero › Teks lencana'),
  ('home.why.title', 'text', 'Why IBM Asia?', null, 'Beranda › Why › Judul'),
  ('home.why.description', 'text', 'Empat alasan mahasiswa memilih International Business Management di Institut Asia Malang.', null, 'Beranda › Why › Deskripsi'),
  ('home.double_degree.eyebrow', 'text', 'Program Unggulan', null, 'Beranda › Double degree › Teks kecil di atas judul'),
  ('home.double_degree.title', 'text', 'Double Degree Programme', null, 'Beranda › Double degree › Judul'),
  ('home.double_degree.description', 'text', 'Tempuh studi di IBM Institut Asia dan universitas mitra di luar negeri, lalu raih dua gelar sekaligus. Kerja sama resmi dengan Trent Global College Singapore membuka jalur studi lanjut yang diakui kedua institusi.', null, 'Beranda › Double degree › Deskripsi'),
  ('home.double_degree.cta', 'text', 'Lihat Kurikulum', null, 'Beranda › Double degree › Teks tombol'),
  ('home.partners.title', 'text', 'Our Partner', null, 'Beranda › Partners › Judul'),
  ('home.partners.description', 'text', 'Bekerja sama dengan institusi pendidikan dan dunia industri, di dalam dan luar negeri.', null, 'Beranda › Partners › Deskripsi'),
  ('home.lecturers.title', 'text', 'The Lecturers', null, 'Beranda › Lecturers › Judul'),
  ('home.lecturers.description', 'text', 'Akademisi dan praktisi berpengalaman yang mendampingi proses belajarmu.', null, 'Beranda › Lecturers › Deskripsi'),
  ('home.lecturers.more_label', 'text', 'Lihat semua dosen', null, 'Beranda › Lecturers › Teks tautan ''lihat semua'''),
  ('home.news.title', 'text', 'IBM News', null, 'Beranda › News › Judul'),
  ('home.news.description', 'text', 'Kabar terbaru seputar kegiatan kampus dan mahasiswa.', null, 'Beranda › News › Deskripsi'),
  ('home.news.more_label', 'text', 'Lihat semua berita', null, 'Beranda › News › Teks tautan ''lihat semua'''),
  ('home.simaka.eyebrow', 'text', 'Sistem Informasi Akademik', null, 'Beranda › Simaka › Teks kecil di atas judul'),
  ('home.simaka.title', 'text', 'SIMAKA', null, 'Beranda › Simaka › Judul'),
  ('home.simaka.description', 'text', 'Akses nilai, jadwal kuliah, presensi, dan informasi akademik lainnya melalui portal SIMAKA IBM Institut Asia Malang.', null, 'Beranda › Simaka › Deskripsi'),
  ('home.simaka.cta', 'text', 'Masuk ke SIMAKA', null, 'Beranda › Simaka › Teks tombol'),
  ('home.faq.title', 'text', 'Pertanyaan yang Sering Diajukan', null, 'Beranda › Faq › Judul'),
  ('home.faq.description', 'text', 'Belum menemukan jawaban? Hubungi bagian admisi kami.', null, 'Beranda › Faq › Deskripsi'),
  ('home.faq.cta', 'text', 'Hubungi Admisi', null, 'Beranda › Faq › Teks tombol'),
  ('home.hero.image', 'image', 'https://placehold.co/640x800/2A52A0/EBB213?text=Foto+Kampus', 'Suasana kampus IBM Institut Asia Malang', 'Beranda › Hero › Gambar'),
  ('home.double_degree.image', 'image', 'https://placehold.co/800x600/2A52A0/EBB213?text=Double+Degree', 'Mahasiswa program Double Degree', 'Beranda › Double degree › Gambar'),
  ('home.hero.cta_primary_url', 'link', 'admission.html#steps', null, 'Beranda › Hero › Tombol utama (tautan)'),
  ('home.hero.cta_secondary_url', 'link', 'about.html#glimpse', null, 'Beranda › Hero › Tombol kedua (tautan)'),
  ('home.double_degree.cta_url', 'link', 'about.html#curriculum', null, 'Beranda › Double degree › Tautan tombol'),
  ('home.lecturers.more_url', 'link', 'profile-lecturers.html', null, 'Beranda › Lecturers › Tautan ''lihat semua'''),
  ('home.news.more_url', 'link', 'news.html', null, 'Beranda › News › Tautan ''lihat semua'''),
  ('home.faq.cta_url', 'link', 'mailto:info@ibmasia.ac.id', null, 'Beranda › Faq › Tautan tombol'),
  ('home.meta.description', 'text', 'International Business Management di Institut Asia Malang: kurikulum berbasis industri, dosen praktisi, dan program Double Degree bersama mitra internasional.', null, 'Beranda › Meta › Deskripsi'),
  ('about.meta.title', 'text', 'About IBM — IBM Institut Asia Malang', null, 'About IBM › Meta › Judul'),
  ('about.hero.eyebrow', 'text', 'Tentang Kami', null, 'About IBM › Hero › Teks kecil di atas judul'),
  ('about.hero.title', 'text', 'About IBM Institut Asia', null, 'About IBM › Hero › Judul'),
  ('about.hero.description', 'text', 'Kenali profil, kurikulum, dan jadwal akademik International Business Management di Institut Asia Malang.', null, 'About IBM › Hero › Deskripsi'),
  ('about.nav.glimpse', 'text', 'A Glimpse', null, 'About IBM › Nav › Glimpse'),
  ('about.nav.curriculum', 'text', 'Curriculum', null, 'About IBM › Nav › Curriculum'),
  ('about.nav.calendar', 'text', 'Academic Calendar', null, 'About IBM › Nav › Calendar'),
  ('about.glimpse.title', 'text', 'Perjalanan Singkat IBM Institut Asia', null, 'About IBM › Glimpse › Judul'),
  ('about.glimpse.paragraph_1', 'text', 'IBM Institut Asia Malang hadir untuk mencetak lulusan yang siap kerja dan siap bersaing di tingkat global, dengan pembelajaran yang dekat dengan praktik bisnis internasional.', null, 'About IBM › Glimpse › Paragraf 1'),
  ('about.glimpse.paragraph_2', 'richtext', 'Melalui kerja sama resmi dengan <strong>Trent Global College Singapore</strong>, mahasiswa memperoleh jalur studi lanjut dan program gelar ganda.', null, 'About IBM › Glimpse › Paragraf 2'),
  ('about.curriculum.title', 'text', 'Rencana Studi 7 Semester', null, 'About IBM › Curriculum › Judul'),
  ('about.curriculum.description', 'text', 'Klik tiap semester untuk melihat daftar mata kuliah. Beberapa semester dapat dibuka bersamaan untuk memudahkan perbandingan.', null, 'About IBM › Curriculum › Deskripsi'),
  ('about.calendar.title', 'text', 'Kalender Akademik', null, 'About IBM › Calendar › Judul'),
  ('about.calendar.description', 'text', 'Jadwal kegiatan akademik Semester Ganjil 2026/2027.', null, 'About IBM › Calendar › Deskripsi'),
  ('about.calendar.note', 'text', 'Jadwal dapat berubah sewaktu-waktu. Pantau pengumuman resmi melalui SIMAKA atau papan informasi kampus.', null, 'About IBM › Calendar › Catatan'),
  ('about.glimpse.image', 'image', 'https://placehold.co/700x800/2A52A0/EBB213?text=Kampus+IBM+Asia', 'Suasana kampus IBM Institut Asia Malang', 'About IBM › Glimpse › Gambar'),
  ('about.glimpse.partner_logo', 'image', 'https://placehold.co/440x180/FFFFFF/173671?text=Trent+Global+College', 'Logo Trent Global College Singapore', 'About IBM › Glimpse › Logo mitra'),
  ('about.meta.description', 'text', 'Profil singkat, kurikulum 7 semester, dan kalender akademik International Business Management di Institut Asia Malang.', null, 'About IBM › Meta › Deskripsi'),
  ('admission.meta.title', 'text', 'Admission — IBM Institut Asia Malang', null, 'Admission › Meta › Judul'),
  ('admission.hero.eyebrow', 'text', 'Penerimaan Mahasiswa Baru', null, 'Admission › Hero › Teks kecil di atas judul'),
  ('admission.hero.title', 'text', 'Admission', null, 'Admission › Hero › Judul'),
  ('admission.hero.description', 'text', 'Semua yang perlu kamu tahu untuk mendaftar di IBM Institut Asia Malang, dari langkah pendaftaran sampai biaya kuliah.', null, 'Admission › Hero › Deskripsi'),
  ('admission.nav.steps', 'text', 'Langkah Pendaftaran', null, 'Admission › Nav › Steps'),
  ('admission.nav.documents', 'text', 'Dokumen', null, 'Admission › Nav › Documents'),
  ('admission.nav.scholarship', 'text', 'Beasiswa', null, 'Admission › Nav › Scholarship'),
  ('admission.nav.tuition', 'text', 'Biaya Pendidikan', null, 'Admission › Nav › Tuition'),
  ('admission.steps.title', 'text', 'Daftar Online atau Offline', null, 'Admission › Steps › Judul'),
  ('admission.steps.description', 'text', 'Pilih jalur pendaftaran yang paling sesuai untuk kamu.', null, 'Admission › Steps › Deskripsi'),
  ('admission.steps.tab_online', 'text', 'Pendaftaran Online', null, 'Admission › Steps › Tab online'),
  ('admission.steps.tab_offline', 'text', 'Pendaftaran Offline', null, 'Admission › Steps › Tab offline'),
  ('admission.documents.title', 'text', 'Berkas yang Perlu Disiapkan', null, 'Admission › Documents › Judul'),
  ('admission.documents.description', 'text', 'Pastikan seluruh dokumen berikut sudah lengkap sebelum mendaftar.', null, 'Admission › Documents › Deskripsi'),
  ('admission.scholarship.title', 'text', 'Dua Jalur Beasiswa Tersedia', null, 'Admission › Scholarship › Judul'),
  ('admission.scholarship.description', 'text', 'Pilih jalur beasiswa yang sesuai dengan latar belakangmu.', null, 'Admission › Scholarship › Deskripsi'),
  ('admission.tuition.title', 'text', 'Rincian Biaya Perkuliahan', null, 'Admission › Tuition › Judul'),
  ('admission.tuition.description', 'text', 'Estimasi biaya pendidikan penuh per program studi. Biaya dapat berubah mengikuti kebijakan kampus tahun berjalan.', null, 'Admission › Tuition › Deskripsi'),
  ('admission.tuition.note', 'text', 'Belum termasuk potongan beasiswa. Hubungi bagian admisi untuk simulasi biaya sesuai jalur beasiswa yang kamu ambil.', null, 'Admission › Tuition › Catatan'),
  ('admission.meta.description', 'text', 'Langkah pendaftaran, dokumen yang dibutuhkan, informasi beasiswa, dan biaya pendidikan IBM Institut Asia Malang.', null, 'Admission › Meta › Deskripsi'),
  ('lecturers.meta.title', 'text', 'Profil Dosen — IBM Institut Asia Malang', null, 'Profil Dosen › Meta › Judul'),
  ('lecturers.hero.eyebrow', 'text', 'Profile', null, 'Profil Dosen › Hero › Teks kecil di atas judul'),
  ('lecturers.hero.title', 'text', 'Profil Dosen', null, 'Profil Dosen › Hero › Judul'),
  ('lecturers.hero.description', 'text', 'Kenali dosen pengajar dan bidang keahlian mereka. Arahkan kursor atau sentuh foto untuk melihat detail.', null, 'Profil Dosen › Hero › Deskripsi'),
  ('lecturers.meta.description', 'text', 'Daftar dosen pengajar di IBM Institut Asia Malang.', null, 'Profil Dosen › Meta › Deskripsi'),
  ('students.meta.title', 'text', 'Profil Mahasiswa — IBM Institut Asia Malang', null, 'Profil Mahasiswa › Meta › Judul'),
  ('students.hero.eyebrow', 'text', 'Profile', null, 'Profil Mahasiswa › Hero › Teks kecil di atas judul'),
  ('students.hero.title', 'text', 'Profil Mahasiswa', null, 'Profil Mahasiswa › Hero › Judul'),
  ('students.hero.description', 'text', 'Kenali mahasiswa kami dan program studi masing-masing. Arahkan kursor atau sentuh foto untuk melihat detail.', null, 'Profil Mahasiswa › Hero › Deskripsi'),
  ('students.meta.description', 'text', 'Daftar mahasiswa IBM Institut Asia Malang.', null, 'Profil Mahasiswa › Meta › Deskripsi'),
  ('gallery_activities.meta.title', 'text', 'Kegiatan Mahasiswa — IBM Institut Asia Malang', null, 'Galeri Kegiatan › Meta › Judul'),
  ('gallery_activities.hero.eyebrow', 'text', 'Gallery', null, 'Galeri Kegiatan › Hero › Teks kecil di atas judul'),
  ('gallery_activities.hero.title', 'text', 'Kegiatan Mahasiswa', null, 'Galeri Kegiatan › Hero › Judul'),
  ('gallery_activities.hero.description', 'text', 'Dokumentasi kegiatan perkuliahan, organisasi, dan acara kampus IBM Institut Asia Malang.', null, 'Galeri Kegiatan › Hero › Deskripsi'),
  ('gallery_activities.meta.description', 'text', 'Galeri kegiatan mahasiswa IBM Institut Asia Malang.', null, 'Galeri Kegiatan › Meta › Deskripsi'),
  ('gallery_facilities.meta.title', 'text', 'Fasilitas Belajar — IBM Institut Asia Malang', null, 'Galeri Fasilitas › Meta › Judul'),
  ('gallery_facilities.hero.eyebrow', 'text', 'Gallery', null, 'Galeri Fasilitas › Hero › Teks kecil di atas judul'),
  ('gallery_facilities.hero.title', 'text', 'Fasilitas Belajar', null, 'Galeri Fasilitas › Hero › Judul'),
  ('gallery_facilities.hero.description', 'text', 'Fasilitas penunjang perkuliahan yang tersedia di kampus IBM Institut Asia Malang.', null, 'Galeri Fasilitas › Hero › Deskripsi'),
  ('gallery_facilities.meta.description', 'text', 'Galeri fasilitas belajar IBM Institut Asia Malang.', null, 'Galeri Fasilitas › Meta › Deskripsi'),
  ('news.meta.title', 'text', 'IBM News — Institut Asia Malang', null, 'News › Meta › Judul'),
  ('news.hero.eyebrow', 'text', 'IBM News', null, 'News › Hero › Teks kecil di atas judul'),
  ('news.hero.title', 'text', 'Berita & Informasi Terbaru', null, 'News › Hero › Judul'),
  ('news.hero.description', 'text', 'Kabar terbaru seputar kegiatan kampus, prestasi mahasiswa, dan program IBM Institut Asia Malang.', null, 'News › Hero › Deskripsi'),
  ('news.empty', 'text', 'Belum ada berita yang dipublikasikan.', null, 'News › Empty'),
  ('news.meta.description', 'text', 'Kabar terbaru seputar kegiatan kampus, mahasiswa, dan program IBM Institut Asia Malang.', null, 'News › Meta › Deskripsi'),
  ('news_detail.meta.title', 'text', 'Detail Berita — IBM Institut Asia Malang', null, 'Detail Berita › Meta › Judul'),
  ('news_detail.not_found.eyebrow', 'text', '404', null, 'Detail Berita › Not found › Teks kecil di atas judul'),
  ('news_detail.not_found.title', 'text', 'Berita tidak ditemukan', null, 'Detail Berita › Not found › Judul'),
  ('news_detail.not_found.text', 'text', 'Berita yang Anda cari mungkin sudah dihapus atau alamatnya berubah.', null, 'Detail Berita › Not found › Text'),
  ('news_detail.not_found.cta', 'text', 'Lihat semua berita', null, 'Detail Berita › Not found › Teks tombol'),
  ('news_detail.related.title', 'text', 'Berita Lainnya', null, 'Detail Berita › Related › Judul'),
  ('news_detail.related.more_label', 'text', 'Lihat semua berita', null, 'Detail Berita › Related › Teks tautan ''lihat semua'''),
  ('news_detail.not_found.cta_url', 'link', 'news.html', null, 'Detail Berita › Not found › Tautan tombol'),
  ('news_detail.related.more_url', 'link', 'news.html', null, 'Detail Berita › Related › Tautan ''lihat semua'''),
  ('news_detail.meta.description', 'text', 'Baca berita terbaru IBM Institut Asia Malang.', null, 'Detail Berita › Meta › Deskripsi'),
  ('notfound.meta.title', 'text', 'Halaman tidak ditemukan — IBM Institut Asia Malang', null, 'Halaman 404 › Meta › Judul'),
  ('notfound.title', 'text', 'Halaman tidak ditemukan', null, 'Halaman 404 › Judul'),
  ('notfound.description', 'text', 'Alamat yang kamu buka tidak tersedia atau sudah dipindahkan. Kembali ke beranda untuk melanjutkan.', null, 'Halaman 404 › Deskripsi'),
  ('notfound.cta', 'text', 'Kembali ke Beranda', null, 'Halaman 404 › Teks tombol'),
  ('notfound.meta.description', 'text', 'Halaman yang kamu cari tidak ditemukan.', null, 'Halaman 404 › Meta › Deskripsi')
on conflict (content_key) do nothing;

do $seed$ begin
  if not exists (select 1 from public.list_items) then
    insert into public.list_items (group_key, title, body, sort_order) values
      ('home.hero_stats', '25+', 'Tahun berdiri', 10),
      ('home.hero_stats', '12', 'Mitra Double Degree', 20),
      ('home.hero_stats', '4.500+', 'Alumni bekerja', 30),
      ('home.double_degree', '', 'Gelar ganda dari kampus dalam & luar negeri', 10),
      ('home.double_degree', '', 'Transfer kredit yang diakui kedua institusi', 20),
      ('home.double_degree', '', 'Pengalaman lintas budaya dan bahasa', 30),
      ('about.glimpse_facts', 'Kerja Sama Resmi', 'Trent Global College, Singapura', 10),
      ('about.glimpse_facts', 'Fokus Program', 'Bisnis internasional & siap industri', 20),
      ('about.glimpse_facts', 'Jenjang Studi', 'Diploma hingga Sarjana Terapan', 30);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.why_items) then
    insert into public.why_items (icon, title, description, sort_order) values
      ('book', 'Kurikulum Berbasis Industri', 'Mata kuliah disusun bersama praktisi bisnis agar relevan dengan kebutuhan pasar kerja global.', 10),
      ('briefcase', 'Dosen Praktisi Profesional', 'Pengajar berpengalaman di perdagangan internasional, keuangan, dan manajemen lintas negara.', 20),
      ('globe', 'Jaringan Mitra Global', 'Kerja sama dengan perguruan tinggi dan perusahaan di dalam maupun luar negeri.', 30),
      ('compass', 'Pendampingan Karier', 'Pembekalan magang, konsultasi karier, dan akses ke jejaring alumni.', 40);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.partners) then
    insert into public.partners (name, logo_url, website_url, sort_order) values
      ('Mitra 1', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+1', '', 10),
      ('Mitra 2', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+2', '', 20),
      ('Mitra 3', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+3', '', 30),
      ('Mitra 4', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+4', '', 40),
      ('Mitra 5', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+5', '', 50),
      ('Mitra 6', 'https://placehold.co/320x128/E3E9F5/173671?text=Partner+6', '', 60);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.people) then
    insert into public.people (kind, name, program, detail, photo_url, is_featured, sort_order) values
      ('lecturer', 'Nama Dosen Satu, M.Kom.', 'Sistem Informasi', 'Basis Data & Analitik', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+1', true, 10),
      ('lecturer', 'Nama Dosen Dua, M.T.', 'Teknik Informatika', 'Jaringan & Keamanan Siber', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+2', true, 20),
      ('lecturer', 'Nama Dosen Tiga, M.M.', 'Manajemen Bisnis', 'Kewirausahaan', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+3', true, 30),
      ('lecturer', 'Nama Dosen Empat, M.Ak.', 'Akuntansi', 'Perpajakan', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+4', true, 40),
      ('lecturer', 'Nama Dosen Lima, M.Kom.', 'Teknik Informatika', 'Pengembangan Perangkat Lunak', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+5', false, 50),
      ('lecturer', 'Nama Dosen Enam, M.Si.', 'Sistem Informasi', 'Data Science', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+6', false, 60),
      ('lecturer', 'Nama Dosen Tujuh, M.M.', 'Manajemen Bisnis', 'Pemasaran Digital', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+7', false, 70),
      ('lecturer', 'Nama Dosen Delapan, M.Ak.', 'Akuntansi', 'Audit & Keuangan', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Dosen+8', false, 80),
      ('student', 'Nama Mahasiswa Satu', 'Sistem Informasi', 'Angkatan 2023', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+1', false, 10),
      ('student', 'Nama Mahasiswa Dua', 'Teknik Informatika', 'Angkatan 2022', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+2', false, 20),
      ('student', 'Nama Mahasiswa Tiga', 'Manajemen Bisnis', 'Angkatan 2023', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+3', false, 30),
      ('student', 'Nama Mahasiswa Empat', 'Akuntansi', 'Angkatan 2024', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+4', false, 40),
      ('student', 'Nama Mahasiswa Lima', 'Sistem Informasi', 'Angkatan 2022', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+5', false, 50),
      ('student', 'Nama Mahasiswa Enam', 'Teknik Informatika', 'Angkatan 2023', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+6', false, 60),
      ('student', 'Nama Mahasiswa Tujuh', 'Manajemen Bisnis', 'Angkatan 2024', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+7', false, 70),
      ('student', 'Nama Mahasiswa Delapan', 'Akuntansi', 'Angkatan 2023', 'https://placehold.co/480x600/2A52A0/FFFFFF?text=Mahasiswa+8', false, 80);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.news) then
    insert into public.news (title, excerpt, image_url, published_at, is_featured, link_url, slug, content) values
      ('Orientasi Mahasiswa Baru IBM Angkatan 2026 Resmi Dibuka', 'Mahasiswa baru mengikuti rangkaian orientasi yang memperkenalkan lingkungan kampus, kurikulum, dan program Double Degree.', 'https://placehold.co/720x450/173671/EBB213?text=Berita+Utama', '2026-08-12', true, '', 'orientasi-mahasiswa-baru-ibm-angkatan-2026', '<p>Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.</p><h2>Rangkaian kegiatan</h2><p>Tulis ringkasan kegiatan di sini: apa yang terjadi, siapa yang terlibat, dan mengapa penting bagi mahasiswa.</p><ul><li>Poin pertama</li><li>Poin kedua</li><li>Poin ketiga</li></ul><blockquote>Kutipan dari narasumber dapat ditulis di sini.</blockquote><p>Anda juga dapat menyisipkan <a href="admission.html">tautan</a> ke halaman lain.</p>'),
      ('Kuliah Tamu: Strategi Ekspor bagi Pelaku UMKM', 'Praktisi ekspor berbagi langkah memasuki pasar luar negeri, mulai dari legalitas hingga logistik.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+2', '2026-08-05', false, '', 'kuliah-tamu-strategi-ekspor-umkm', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Paragraf pembuka menjelaskan inti berita secara singkat dan jelas.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Kunjungan Industri ke Perusahaan Logistik Internasional', 'Mahasiswa melihat langsung alur rantai pasok dan operasional ekspor-impor di lapangan.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+3', '2026-07-28', false, '', 'kunjungan-industri-perusahaan-logistik-internasional', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Paragraf kedua menguraikan latar belakang dan jalannya kegiatan.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Pendaftaran Beasiswa Prestasi Gelombang Pertama Dibuka', 'Beasiswa Prestasi tersedia untuk jalur akademik maupun non-akademik. Cek persyaratan di halaman Admission.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+4', '2026-07-15', false, '', 'pendaftaran-beasiswa-prestasi-gelombang-pertama', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Paragraf pembuka berisi informasi utama yang perlu diketahui pembaca.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Workshop Business English untuk Persiapan Karier Global', 'Latihan presentasi, negosiasi, dan korespondensi bisnis dalam bahasa Inggris bersama dosen pengampu.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+5', '2026-07-02', false, '', 'workshop-business-english-karier-global', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Jelaskan syarat, jadwal, dan cara mendaftar dalam paragraf berikutnya.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Mahasiswa IBM Juarai Kompetisi Business Plan Tingkat Regional', 'Tim mahasiswa memenangkan kompetisi dengan rencana bisnis berorientasi ekspor.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+6', '2026-06-20', false, '', 'mahasiswa-ibm-juarai-kompetisi-business-plan', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Uraikan materi yang dibahas dan manfaat bagi peserta.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Penandatanganan Kerja Sama dengan Mitra Double Degree Baru', 'Kerja sama baru memperluas pilihan universitas mitra bagi mahasiswa IBM.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+7', '2026-06-09', false, '', 'kerja-sama-mitra-double-degree-baru', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Sampaikan capaian tim dan proses persiapan yang dilalui.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Seminar Karier: Peluang Kerja di Perusahaan Multinasional', 'Alumni dan praktisi HR memaparkan kompetensi yang dicari perusahaan multinasional.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+8', '2026-05-27', false, '', 'seminar-karier-perusahaan-multinasional', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Jelaskan ruang lingkup kerja sama dan manfaatnya bagi mahasiswa.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
      ('Kegiatan Pengabdian Masyarakat: Pendampingan Digital Marketing UMKM', 'Mahasiswa mendampingi pelaku UMKM lokal memanfaatkan media sosial untuk menjangkau pasar.', 'https://placehold.co/640x400/2A52A0/FFFFFF?text=Berita+9', '2026-05-14', false, '', 'pengabdian-masyarakat-digital-marketing-umkm', 'Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.

Rangkum topik yang dibahas oleh para pembicara.

Paragraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.');
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.faqs) then
    insert into public.faqs (question, answer, sort_order) values
      ('Apa saja jalur pendaftaran di IBM Institut Asia?', 'Kamu bisa mendaftar secara online melalui laman pendaftaran, atau offline dengan datang langsung ke bagian admisi kampus. Langkah lengkapnya ada di halaman Admission.', 10),
      ('Apakah tersedia program beasiswa?', 'Ya. Tersedia Beasiswa Subsidi untuk lulusan sekolah mitra dan Beasiswa Prestasi untuk jalur akademik maupun non-akademik. Detailnya ada di halaman Admission.', 20),
      ('Bagaimana proses program Double Degree?', 'Mahasiswa menempuh sebagian studi di IBM Institut Asia dan sebagian di universitas mitra, lalu memperoleh dua gelar. Persyaratan dan jadwalnya disampaikan oleh bagian akademik.', 30),
      ('Berapa kisaran biaya pendidikan per semester?', 'SPP per semester berkisar Rp 4.000.000 hingga Rp 4.750.000 tergantung program studi. Rincian lengkap tersedia di halaman Admission.', 40);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.curriculum_courses) then
    insert into public.curriculum_courses (semester, course_name, credits, sort_order) values
      (1, 'Pengantar Bisnis Internasional', 3, 10),
      (1, 'Pengantar Manajemen', 3, 20),
      (1, 'Business English I', 2, 30),
      (1, 'Matematika Bisnis', 2, 40),
      (1, 'Pendidikan Pancasila', 2, 50),
      (2, 'Pengantar Akuntansi', 3, 10),
      (2, 'Ekonomi Mikro', 3, 20),
      (2, 'Business English II', 2, 30),
      (2, 'Statistika Bisnis', 2, 40),
      (2, 'Kewarganegaraan', 2, 50),
      (3, 'Perilaku Organisasi', 3, 10),
      (3, 'Manajemen Pemasaran', 3, 20),
      (3, 'Hukum Bisnis', 2, 30),
      (3, 'Komunikasi Lintas Budaya', 2, 40),
      (4, 'Manajemen Keuangan', 3, 10),
      (4, 'Perdagangan Internasional', 3, 20),
      (4, 'Manajemen Operasi & Rantai Pasok', 3, 30),
      (4, 'Metodologi Penelitian', 2, 40),
      (5, 'Pemasaran Global', 3, 10),
      (5, 'Bisnis Digital & E-Commerce', 3, 20),
      (5, 'Manajemen Sumber Daya Manusia', 2, 30),
      (5, 'Mata Kuliah Pilihan I', 2, 40),
      (6, 'Kerja Praktik / Magang', 4, 10),
      (6, 'Manajemen Strategis', 3, 20),
      (6, 'Kewirausahaan', 2, 30),
      (6, 'Mata Kuliah Pilihan II', 2, 40),
      (7, 'Skripsi / Tugas Akhir', 6, 10),
      (7, 'Seminar Proposal', 2, 20),
      (7, 'KKN / Pengabdian Masyarakat', 2, 30);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.academic_calendar) then
    insert into public.academic_calendar (activity, start_date, end_date, sort_order) values
      ('Pengisian KRS Online', '2026-08-01', '2026-08-10', 10),
      ('Awal Perkuliahan', '2026-08-18', null, 20),
      ('Ujian Tengah Semester (UTS)', '2026-10-13', '2026-10-18', 30),
      ('Batas Akhir Pengunduran Mata Kuliah', '2026-10-25', null, 40),
      ('Minggu Tenang', '2026-12-07', '2026-12-12', 50),
      ('Ujian Akhir Semester (UAS)', '2026-12-14', '2026-12-23', 60),
      ('Libur Semester Ganjil', '2026-12-26', '2027-01-17', 70),
      ('Awal Semester Genap', '2027-01-18', null, 80);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.admission_steps) then
    insert into public.admission_steps (track, title, description, sort_order) values
      ('online', 'Isi Formulir Online', 'Buka laman pendaftaran resmi dan lengkapi data dirimu.', 10),
      ('online', 'Unggah Dokumen', 'Unggah dokumen persyaratan dalam format PDF atau JPG.', 20),
      ('online', 'Bayar Biaya Pendaftaran', 'Lakukan pembayaran melalui transfer bank atau kanal pembayaran yang tersedia.', 30),
      ('online', 'Ikuti Tes dan Wawancara Online', 'Jadwal tes dan wawancara dikirim melalui email setelah pembayaran terverifikasi.', 40),
      ('online', 'Pengumuman Kelulusan', 'Hasil seleksi dapat dicek langsung melalui akun pendaftaran online kamu.', 50),
      ('offline', 'Datang ke Kampus', 'Kunjungi bagian admisi IBM Institut Asia Malang pada jam kerja untuk mengambil formulir.', 10),
      ('offline', 'Isi Formulir dan Serahkan Berkas', 'Lengkapi formulir pendaftaran dan serahkan dokumen persyaratan secara langsung.', 20),
      ('offline', 'Bayar di Kasir Kampus', 'Lakukan pembayaran biaya pendaftaran langsung di loket keuangan kampus.', 30),
      ('offline', 'Tes dan Wawancara di Kampus', 'Ikuti sesi tes dan wawancara sesuai jadwal yang diberikan petugas admisi.', 40),
      ('offline', 'Pengumuman Kelulusan', 'Hasil seleksi diinformasikan melalui telepon, email, atau papan pengumuman kampus.', 50);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.admission_documents) then
    insert into public.admission_documents (document_name, sort_order) values
      ('Fotokopi Ijazah / Surat Keterangan Lulus', 10),
      ('Fotokopi Rapor / Transkrip Nilai', 20),
      ('Fotokopi Kartu Keluarga', 30),
      ('Fotokopi KTP / Kartu Pelajar', 40),
      ('Pas Foto Berwarna 3x4 (4 lembar)', 50),
      ('Surat Rekomendasi Sekolah (bila ada)', 60),
      ('Formulir Pendaftaran yang Sudah Diisi', 70),
      ('Bukti Pembayaran Biaya Pendaftaran', 80);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.scholarships) then
    insert into public.scholarships (label, title, description, points, button_label, button_url, sort_order) values
      ('Beasiswa Subsidi', 'Potongan Rp 10.000.000', 'Diberikan khusus untuk lulusan SMA/SMK mitra resmi IBM Institut Asia Malang. Potongan langsung diterapkan pada biaya pendidikan semester pertama.', '["Berlaku untuk siswa dari sekolah mitra", "Potongan biaya sebesar Rp 10.000.000", "Mendaftar melalui jalur kerja sama sekolah"]'::jsonb, 'Cek Sekolah Mitra', '', 10),
      ('Beasiswa Prestasi', 'Jalur Prestasi Akademik & Non-Akademik', 'Ditujukan bagi calon mahasiswa dengan prestasi akademik, olahraga, atau seni, dibuktikan dengan sertifikat maupun rapor.', '["Nilai rapor rata-rata di atas ketentuan", "Memiliki sertifikat kejuaraan/prestasi", "Lulus tahap seleksi wawancara beasiswa"]'::jsonb, 'Syarat & Ketentuan', '', 20);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.tuition_programs) then
    insert into public.tuition_programs (program, registration_fee, building_fee, tuition_per_semester, semesters, sort_order) values
      ('Sistem Informasi', 300000, 6000000, 4500000, 7, 10),
      ('Teknik Informatika', 300000, 6000000, 4750000, 7, 20),
      ('Manajemen Bisnis', 300000, 5500000, 4000000, 7, 30),
      ('Akuntansi', 300000, 5500000, 4000000, 7, 40);
  end if;
end $seed$;

do $seed$ begin
  if not exists (select 1 from public.gallery_items) then
    insert into public.gallery_items (gallery, caption, image_url, alt_text, sort_order) values
      ('activities', 'Orientasi Mahasiswa Baru', 'https://placehold.co/640x480/173671/EBB213?text=Kegiatan+1', 'Dokumentasi Orientasi Mahasiswa Baru', 10),
      ('activities', 'Praktikum Laboratorium Komputer', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Kegiatan+2', 'Dokumentasi Praktikum Laboratorium Komputer', 20),
      ('activities', 'Seminar & Workshop Industri', 'https://placehold.co/640x480/173671/EBB213?text=Kegiatan+3', 'Dokumentasi Seminar & Workshop Industri', 30),
      ('activities', 'Kegiatan Organisasi Mahasiswa', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Kegiatan+4', 'Dokumentasi Kegiatan Organisasi Mahasiswa', 40),
      ('activities', 'Wisuda Angkatan 2025', 'https://placehold.co/640x480/173671/EBB213?text=Kegiatan+5', 'Dokumentasi Wisuda Angkatan 2025', 50),
      ('activities', 'Pertukaran Pelajar Double Degree', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Kegiatan+6', 'Dokumentasi Pertukaran Pelajar Double Degree', 60),
      ('activities', 'Turnamen Olahraga Antar Kelas', 'https://placehold.co/640x480/173671/EBB213?text=Kegiatan+7', 'Dokumentasi Turnamen Olahraga Antar Kelas', 70),
      ('activities', 'Kunjungan Industri', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Kegiatan+8', 'Dokumentasi Kunjungan Industri', 80),
      ('facilities', 'Ruang Kelas Ber-AC', 'https://placehold.co/640x480/173671/EBB213?text=Fasilitas+1', 'Dokumentasi Ruang Kelas Ber-AC', 10),
      ('facilities', 'Laboratorium Komputer', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Fasilitas+2', 'Dokumentasi Laboratorium Komputer', 20),
      ('facilities', 'Perpustakaan Kampus', 'https://placehold.co/640x480/173671/EBB213?text=Fasilitas+3', 'Dokumentasi Perpustakaan Kampus', 30),
      ('facilities', 'Auditorium Serbaguna', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Fasilitas+4', 'Dokumentasi Auditorium Serbaguna', 40),
      ('facilities', 'Ruang Diskusi Mahasiswa', 'https://placehold.co/640x480/173671/EBB213?text=Fasilitas+5', 'Dokumentasi Ruang Diskusi Mahasiswa', 50),
      ('facilities', 'Kantin & Area Bersantai', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Fasilitas+6', 'Dokumentasi Kantin & Area Bersantai', 60),
      ('facilities', 'Musala Kampus', 'https://placehold.co/640x480/173671/EBB213?text=Fasilitas+7', 'Dokumentasi Musala Kampus', 70),
      ('facilities', 'Area Parkir Kampus', 'https://placehold.co/640x480/2A52A0/FFFFFF?text=Fasilitas+8', 'Dokumentasi Area Parkir Kampus', 80);
  end if;
end $seed$;
