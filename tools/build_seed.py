#!/usr/bin/env python3
"""
build_seed.py — menghasilkan DUA file dari satu sumber data supaya selalu konsisten:

    supabase/seed.sql            → isi awal database Supabase
    assets/js/fallback-data.js   → data cadangan di website (dipakai bila Supabase belum
                                   diisi / tidak terjangkau)

Sumber data:
  1. GLOBAL      : teks header/footer (kunci "global.*"), didefinisikan di bawah.
  2. File HTML   : setiap elemen ber-atribut data-cms / data-cms-src / data-cms-href /
                   data-cms-content otomatis diekstrak (teks bawaan di HTML = nilai awal DB).
  3. TABLES      : data daftar berulang (dosen, FAQ, berita, kurikulum, dst.) di bawah.

Jalankan dari folder proyek:   python3 tools/build_seed.py
(Tidak perlu dijalankan ulang kecuali Anda mengubah teks bawaan di HTML / data di file ini.
 File ini TIDAK perlu diunggah ke hosting.)
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# 1. KONTEN GLOBAL (header, footer, label umum)
# --------------------------------------------------------------------------
# (key, kind, value, alt_text)
GLOBAL = [
    ("global.brand.name", "text", "IBM Institut Asia", None),
    ("global.brand.subname", "text", "Malang", None),
    ("global.brand.logo", "image", "assets/img/logo-mark.svg", "Logo IBM Institut Asia Malang"),
    ("global.brand.logo_alt", "text", "Logo IBM Institut Asia Malang", None),
    ("global.nav.home", "text", "Home", None),
    ("global.nav.about", "text", "About IBM", None),
    ("global.nav.admission", "text", "Admission", None),
    ("global.nav.news", "text", "News", None),
    ("global.nav.profile", "text", "Profile", None),
    ("global.nav.profile_lecturers", "text", "Profil Dosen", None),
    ("global.nav.profile_students", "text", "Profil Mahasiswa", None),
    ("global.nav.gallery", "text", "Gallery", None),
    ("global.nav.gallery_activities", "text", "Kegiatan Mahasiswa", None),
    ("global.nav.gallery_facilities", "text", "Fasilitas Belajar", None),
    ("global.nav.simaka", "text", "SIMAKA", None),
    ("global.nav.menu_label", "text", "Buka menu navigasi", None),
    ("global.nav.aria_label", "text", "Navigasi utama", None),
    ("global.simaka.url", "link", "https://simaka.ibmasia.ac.id", None),
    ("global.footer.tagline", "text", "International Business Management — membekali lulusan untuk berkarier di panggung bisnis global.", None),
    ("global.footer.address", "text", "Jl. Contoh No. 123, Malang, Jawa Timur", None),
    ("global.footer.email", "text", "info@ibmasia.ac.id", None),
    ("global.footer.phone", "text", "(0341) 000-000", None),
    ("global.footer.nav_title", "text", "Navigasi", None),
    ("global.footer.contact_title", "text", "Kontak", None),
    ("global.footer.copyright", "text", "© {year} IBM Institut Asia Malang. Seluruh hak cipta dilindungi.", None),
    ("global.social.instagram", "link", "", None),
    ("global.social.facebook", "link", "", None),
    ("global.social.youtube", "link", "", None),
    ("global.social.linkedin", "link", "", None),
    ("global.social.tiktok", "link", "", None),
    ("global.a11y.photo_prefix", "text", "Foto", None),
    ("global.a11y.zoom_image", "text", "Perbesar foto", None),
    ("global.seo.og_image", "image", "", None),
]
# Teks yang dipakai langsung oleh JavaScript (tidak ada di HTML) — tetap bisa diedit dari database.
GLOBAL += [
    ("news.flag_featured", "text", "Pilihan Redaksi", None),
    ("news.load_more", "text", "Tampilkan berita lainnya", None),
    ("news_detail.share_label", "text", "Bagikan:", None),
    ("news_detail.copy_label", "text", "Salin tautan", None),
    ("news_detail.copied_label", "text", "Tautan disalin ✓", None),
    ("news_detail.source_label", "text", "Baca sumber asli", None),
    ("news_detail.breadcrumb_label", "text", "Navigasi remah roti", None),
]

# --------------------------------------------------------------------------
# 2. DATA DAFTAR BERULANG
# --------------------------------------------------------------------------
PH = "https://placehold.co"


def ph(w, h, bg, fg, text):
    return f"{PH}/{w}x{h}/{bg}/{fg}?text={text.replace(' ', '+')}"


TABLES = {
    "list_items": [
        # Statistik hero beranda
        dict(group_key="home.hero_stats", title="25+", body="Tahun berdiri"),
        dict(group_key="home.hero_stats", title="12", body="Mitra Double Degree"),
        dict(group_key="home.hero_stats", title="4.500+", body="Alumni bekerja"),
        # Poin Double Degree
        dict(group_key="home.double_degree", title="", body="Gelar ganda dari kampus dalam & luar negeri"),
        dict(group_key="home.double_degree", title="", body="Transfer kredit yang diakui kedua institusi"),
        dict(group_key="home.double_degree", title="", body="Pengalaman lintas budaya dan bahasa"),
        # Fakta ringkas di About
        dict(group_key="about.glimpse_facts", title="Kerja Sama Resmi", body="Trent Global College, Singapura"),
        dict(group_key="about.glimpse_facts", title="Fokus Program", body="Bisnis internasional & siap industri"),
        dict(group_key="about.glimpse_facts", title="Jenjang Studi", body="Diploma hingga Sarjana Terapan"),
    ],
    "why_items": [
        dict(icon="book", title="Kurikulum Berbasis Industri",
             description="Mata kuliah disusun bersama praktisi bisnis agar relevan dengan kebutuhan pasar kerja global."),
        dict(icon="briefcase", title="Dosen Praktisi Profesional",
             description="Pengajar berpengalaman di perdagangan internasional, keuangan, dan manajemen lintas negara."),
        dict(icon="globe", title="Jaringan Mitra Global",
             description="Kerja sama dengan perguruan tinggi dan perusahaan di dalam maupun luar negeri."),
        dict(icon="compass", title="Pendampingan Karier",
             description="Pembekalan magang, konsultasi karier, dan akses ke jejaring alumni."),
    ],
    "partners": [
        dict(name=f"Mitra {i}", logo_url=ph(320, 128, "E3E9F5", "173671", f"Partner {i}"), website_url="")
        for i in range(1, 7)
    ],
    "people": (
        [
            dict(kind="lecturer", name=n, program=p, detail=d,
                 photo_url=ph(480, 600, "2A52A0", "FFFFFF", f"Dosen {i}"), is_featured=(i <= 4))
            for i, (n, p, d) in enumerate([
                ("Nama Dosen Satu, M.Kom.", "Sistem Informasi", "Basis Data & Analitik"),
                ("Nama Dosen Dua, M.T.", "Teknik Informatika", "Jaringan & Keamanan Siber"),
                ("Nama Dosen Tiga, M.M.", "Manajemen Bisnis", "Kewirausahaan"),
                ("Nama Dosen Empat, M.Ak.", "Akuntansi", "Perpajakan"),
                ("Nama Dosen Lima, M.Kom.", "Teknik Informatika", "Pengembangan Perangkat Lunak"),
                ("Nama Dosen Enam, M.Si.", "Sistem Informasi", "Data Science"),
                ("Nama Dosen Tujuh, M.M.", "Manajemen Bisnis", "Pemasaran Digital"),
                ("Nama Dosen Delapan, M.Ak.", "Akuntansi", "Audit & Keuangan"),
            ], start=1)
        ] + [
            dict(kind="student", name=n, program=p, detail=d,
                 photo_url=ph(480, 600, "2A52A0", "FFFFFF", f"Mahasiswa {i}"), is_featured=False)
            for i, (n, p, d) in enumerate([
                ("Nama Mahasiswa Satu", "Sistem Informasi", "Angkatan 2023"),
                ("Nama Mahasiswa Dua", "Teknik Informatika", "Angkatan 2022"),
                ("Nama Mahasiswa Tiga", "Manajemen Bisnis", "Angkatan 2023"),
                ("Nama Mahasiswa Empat", "Akuntansi", "Angkatan 2024"),
                ("Nama Mahasiswa Lima", "Sistem Informasi", "Angkatan 2022"),
                ("Nama Mahasiswa Enam", "Teknik Informatika", "Angkatan 2023"),
                ("Nama Mahasiswa Tujuh", "Manajemen Bisnis", "Angkatan 2024"),
                ("Nama Mahasiswa Delapan", "Akuntansi", "Angkatan 2023"),
            ], start=1)
        ]
    ),
    "news": [
        dict(title="Orientasi Mahasiswa Baru IBM Angkatan 2026 Resmi Dibuka",
             excerpt="Mahasiswa baru mengikuti rangkaian orientasi yang memperkenalkan lingkungan kampus, kurikulum, dan program Double Degree.",
             image_url=ph(720, 450, "173671", "EBB213", "Berita Utama"), published_at="2026-08-12", is_featured=True, link_url="",
             slug='orientasi-mahasiswa-baru-ibm-angkatan-2026', content='<p>Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.</p><h2>Rangkaian kegiatan</h2><p>Tulis ringkasan kegiatan di sini: apa yang terjadi, siapa yang terlibat, dan mengapa penting bagi mahasiswa.</p><ul><li>Poin pertama</li><li>Poin kedua</li><li>Poin ketiga</li></ul><blockquote>Kutipan dari narasumber dapat ditulis di sini.</blockquote><p>Anda juga dapat menyisipkan <a href="admission.html">tautan</a> ke halaman lain.</p>'),
        dict(title="Kuliah Tamu: Strategi Ekspor bagi Pelaku UMKM",
             excerpt="Praktisi ekspor berbagi langkah memasuki pasar luar negeri, mulai dari legalitas hingga logistik.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 2"), published_at="2026-08-05", is_featured=False, link_url="",
             slug='kuliah-tamu-strategi-ekspor-umkm', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nParagraf pembuka menjelaskan inti berita secara singkat dan jelas.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Kunjungan Industri ke Perusahaan Logistik Internasional",
             excerpt="Mahasiswa melihat langsung alur rantai pasok dan operasional ekspor-impor di lapangan.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 3"), published_at="2026-07-28", is_featured=False, link_url="",
             slug='kunjungan-industri-perusahaan-logistik-internasional', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nParagraf kedua menguraikan latar belakang dan jalannya kegiatan.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Pendaftaran Beasiswa Prestasi Gelombang Pertama Dibuka",
             excerpt="Beasiswa Prestasi tersedia untuk jalur akademik maupun non-akademik. Cek persyaratan di halaman Admission.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 4"), published_at="2026-07-15", is_featured=False, link_url="",
             slug='pendaftaran-beasiswa-prestasi-gelombang-pertama', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nParagraf pembuka berisi informasi utama yang perlu diketahui pembaca.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Workshop Business English untuk Persiapan Karier Global",
             excerpt="Latihan presentasi, negosiasi, dan korespondensi bisnis dalam bahasa Inggris bersama dosen pengampu.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 5"), published_at="2026-07-02", is_featured=False, link_url="",
             slug='workshop-business-english-karier-global', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nJelaskan syarat, jadwal, dan cara mendaftar dalam paragraf berikutnya.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Mahasiswa IBM Juarai Kompetisi Business Plan Tingkat Regional",
             excerpt="Tim mahasiswa memenangkan kompetisi dengan rencana bisnis berorientasi ekspor.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 6"), published_at="2026-06-20", is_featured=False, link_url="",
             slug='mahasiswa-ibm-juarai-kompetisi-business-plan', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nUraikan materi yang dibahas dan manfaat bagi peserta.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Penandatanganan Kerja Sama dengan Mitra Double Degree Baru",
             excerpt="Kerja sama baru memperluas pilihan universitas mitra bagi mahasiswa IBM.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 7"), published_at="2026-06-09", is_featured=False, link_url="",
             slug='kerja-sama-mitra-double-degree-baru', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nSampaikan capaian tim dan proses persiapan yang dilalui.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Seminar Karier: Peluang Kerja di Perusahaan Multinasional",
             excerpt="Alumni dan praktisi HR memaparkan kompetensi yang dicari perusahaan multinasional.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 8"), published_at="2026-05-27", is_featured=False, link_url="",
             slug='seminar-karier-perusahaan-multinasional', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nJelaskan ruang lingkup kerja sama dan manfaatnya bagi mahasiswa.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
        dict(title="Kegiatan Pengabdian Masyarakat: Pendampingan Digital Marketing UMKM",
             excerpt="Mahasiswa mendampingi pelaku UMKM lokal memanfaatkan media sosial untuk menjangkau pasar.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "Berita 9"), published_at="2026-05-14", is_featured=False, link_url="",
             slug='pengabdian-masyarakat-digital-marketing-umkm', content='Contoh isi berita — ganti dengan berita asli Anda lewat kolom content di tabel news.\n\nRangkum topik yang dibahas oleh para pembicara.\n\nParagraf penutup: sampaikan tindak lanjut atau informasi kontak bila diperlukan.'),
    ],
    "faqs": [
        dict(question="Apa saja jalur pendaftaran di IBM Institut Asia?",
             answer="Kamu bisa mendaftar secara online melalui laman pendaftaran, atau offline dengan datang langsung ke bagian admisi kampus. Langkah lengkapnya ada di halaman Admission."),
        dict(question="Apakah tersedia program beasiswa?",
             answer="Ya. Tersedia Beasiswa Subsidi untuk lulusan sekolah mitra dan Beasiswa Prestasi untuk jalur akademik maupun non-akademik. Detailnya ada di halaman Admission."),
        dict(question="Bagaimana proses program Double Degree?",
             answer="Mahasiswa menempuh sebagian studi di IBM Institut Asia dan sebagian di universitas mitra, lalu memperoleh dua gelar. Persyaratan dan jadwalnya disampaikan oleh bagian akademik."),
        dict(question="Berapa kisaran biaya pendidikan per semester?",
             answer="SPP per semester berkisar Rp 4.000.000 hingga Rp 4.750.000 tergantung program studi. Rincian lengkap tersedia di halaman Admission."),
    ],
    "curriculum_courses": [
        dict(semester=sem, course_name=name, credits=sks)
        for sem, items in {
            1: [("Pengantar Bisnis Internasional", 3), ("Pengantar Manajemen", 3), ("Business English I", 2), ("Matematika Bisnis", 2), ("Pendidikan Pancasila", 2)],
            2: [("Pengantar Akuntansi", 3), ("Ekonomi Mikro", 3), ("Business English II", 2), ("Statistika Bisnis", 2), ("Kewarganegaraan", 2)],
            3: [("Perilaku Organisasi", 3), ("Manajemen Pemasaran", 3), ("Hukum Bisnis", 2), ("Komunikasi Lintas Budaya", 2)],
            4: [("Manajemen Keuangan", 3), ("Perdagangan Internasional", 3), ("Manajemen Operasi & Rantai Pasok", 3), ("Metodologi Penelitian", 2)],
            5: [("Pemasaran Global", 3), ("Bisnis Digital & E-Commerce", 3), ("Manajemen Sumber Daya Manusia", 2), ("Mata Kuliah Pilihan I", 2)],
            6: [("Kerja Praktik / Magang", 4), ("Manajemen Strategis", 3), ("Kewirausahaan", 2), ("Mata Kuliah Pilihan II", 2)],
            7: [("Skripsi / Tugas Akhir", 6), ("Seminar Proposal", 2), ("KKN / Pengabdian Masyarakat", 2)],
        }.items()
        for name, sks in items
    ],
    "academic_calendar": [
        dict(activity="Pengisian KRS Online", start_date="2026-08-01", end_date="2026-08-10"),
        dict(activity="Awal Perkuliahan", start_date="2026-08-18", end_date=None),
        dict(activity="Ujian Tengah Semester (UTS)", start_date="2026-10-13", end_date="2026-10-18"),
        dict(activity="Batas Akhir Pengunduran Mata Kuliah", start_date="2026-10-25", end_date=None),
        dict(activity="Minggu Tenang", start_date="2026-12-07", end_date="2026-12-12"),
        dict(activity="Ujian Akhir Semester (UAS)", start_date="2026-12-14", end_date="2026-12-23"),
        dict(activity="Libur Semester Ganjil", start_date="2026-12-26", end_date="2027-01-17"),
        dict(activity="Awal Semester Genap", start_date="2027-01-18", end_date=None),
    ],
    "admission_steps": [
        dict(track="online", title="Isi Formulir Online", description="Buka laman pendaftaran resmi dan lengkapi data dirimu."),
        dict(track="online", title="Unggah Dokumen", description="Unggah dokumen persyaratan dalam format PDF atau JPG."),
        dict(track="online", title="Bayar Biaya Pendaftaran", description="Lakukan pembayaran melalui transfer bank atau kanal pembayaran yang tersedia."),
        dict(track="online", title="Ikuti Tes dan Wawancara Online", description="Jadwal tes dan wawancara dikirim melalui email setelah pembayaran terverifikasi."),
        dict(track="online", title="Pengumuman Kelulusan", description="Hasil seleksi dapat dicek langsung melalui akun pendaftaran online kamu."),
        dict(track="offline", title="Datang ke Kampus", description="Kunjungi bagian admisi IBM Institut Asia Malang pada jam kerja untuk mengambil formulir."),
        dict(track="offline", title="Isi Formulir dan Serahkan Berkas", description="Lengkapi formulir pendaftaran dan serahkan dokumen persyaratan secara langsung."),
        dict(track="offline", title="Bayar di Kasir Kampus", description="Lakukan pembayaran biaya pendaftaran langsung di loket keuangan kampus."),
        dict(track="offline", title="Tes dan Wawancara di Kampus", description="Ikuti sesi tes dan wawancara sesuai jadwal yang diberikan petugas admisi."),
        dict(track="offline", title="Pengumuman Kelulusan", description="Hasil seleksi diinformasikan melalui telepon, email, atau papan pengumuman kampus."),
    ],
    "admission_documents": [
        dict(document_name=t) for t in [
            "Fotokopi Ijazah / Surat Keterangan Lulus",
            "Fotokopi Rapor / Transkrip Nilai",
            "Fotokopi Kartu Keluarga",
            "Fotokopi KTP / Kartu Pelajar",
            "Pas Foto Berwarna 3x4 (4 lembar)",
            "Surat Rekomendasi Sekolah (bila ada)",
            "Formulir Pendaftaran yang Sudah Diisi",
            "Bukti Pembayaran Biaya Pendaftaran",
        ]
    ],
    "scholarships": [
        dict(label="Beasiswa Subsidi", title="Potongan Rp 10.000.000",
             description="Diberikan khusus untuk lulusan SMA/SMK mitra resmi IBM Institut Asia Malang. Potongan langsung diterapkan pada biaya pendidikan semester pertama.",
             points=["Berlaku untuk siswa dari sekolah mitra", "Potongan biaya sebesar Rp 10.000.000", "Mendaftar melalui jalur kerja sama sekolah"],
             button_label="Cek Sekolah Mitra", button_url=""),
        dict(label="Beasiswa Prestasi", title="Jalur Prestasi Akademik & Non-Akademik",
             description="Ditujukan bagi calon mahasiswa dengan prestasi akademik, olahraga, atau seni, dibuktikan dengan sertifikat maupun rapor.",
             points=["Nilai rapor rata-rata di atas ketentuan", "Memiliki sertifikat kejuaraan/prestasi", "Lulus tahap seleksi wawancara beasiswa"],
             button_label="Syarat & Ketentuan", button_url=""),
    ],
    "tuition_programs": [
        dict(program="Sistem Informasi", registration_fee=300000, building_fee=6000000, tuition_per_semester=4500000, semesters=7),
        dict(program="Teknik Informatika", registration_fee=300000, building_fee=6000000, tuition_per_semester=4750000, semesters=7),
        dict(program="Manajemen Bisnis", registration_fee=300000, building_fee=5500000, tuition_per_semester=4000000, semesters=7),
        dict(program="Akuntansi", registration_fee=300000, building_fee=5500000, tuition_per_semester=4000000, semesters=7),
    ],
    "gallery_items": (
        [dict(gallery="activities", caption=c, image_url=ph(640, 480, "173671" if i % 2 else "2A52A0", "EBB213" if i % 2 else "FFFFFF", f"Kegiatan {i}"), alt_text=f"Dokumentasi {c}")
         for i, c in enumerate(["Orientasi Mahasiswa Baru", "Praktikum Laboratorium Komputer", "Seminar & Workshop Industri",
                                 "Kegiatan Organisasi Mahasiswa", "Wisuda Angkatan 2025", "Pertukaran Pelajar Double Degree",
                                 "Turnamen Olahraga Antar Kelas", "Kunjungan Industri"], start=1)]
        + [dict(gallery="facilities", caption=c, image_url=ph(640, 480, "173671" if i % 2 else "2A52A0", "EBB213" if i % 2 else "FFFFFF", f"Fasilitas {i}"), alt_text=f"Dokumentasi {c}")
           for i, c in enumerate(["Ruang Kelas Ber-AC", "Laboratorium Komputer", "Perpustakaan Kampus", "Auditorium Serbaguna",
                                   "Ruang Diskusi Mahasiswa", "Kantin & Area Bersantai", "Musala Kampus", "Area Parkir Kampus"], start=1)]
    ),
}

# Kolom per tabel (urutan INSERT) dan tipe khusus
COLUMNS = {
    "list_items": ["group_key", "title", "body", "sort_order"],
    "why_items": ["icon", "title", "description", "sort_order"],
    "partners": ["name", "logo_url", "website_url", "sort_order"],
    "people": ["kind", "name", "program", "detail", "photo_url", "is_featured", "sort_order"],
    "news": ["title", "excerpt", "image_url", "published_at", "is_featured", "link_url", "slug", "content"],
    "faqs": ["question", "answer", "sort_order"],
    "curriculum_courses": ["semester", "course_name", "credits", "sort_order"],
    "academic_calendar": ["activity", "start_date", "end_date", "sort_order"],
    "admission_steps": ["track", "title", "description", "sort_order"],
    "admission_documents": ["document_name", "sort_order"],
    "scholarships": ["label", "title", "description", "points", "button_label", "button_url", "sort_order"],
    "tuition_programs": ["program", "registration_fee", "building_fee", "tuition_per_semester", "semesters", "sort_order"],
    "gallery_items": ["gallery", "caption", "image_url", "alt_text", "sort_order"],
}
# Kolom pengelompok untuk penomoran sort_order (10, 20, 30, ...)
GROUP_BY = {
    "list_items": "group_key", "people": "kind", "admission_steps": "track",
    "curriculum_courses": "semester", "gallery_items": "gallery",
}

# Koleksi di website (nama di cms.js) → (tabel, filter, urutan, limit)
VIEWS = {
    "hero_stats": ("list_items", lambda r: r["group_key"] == "home.hero_stats", "sort", None),
    "double_degree_points": ("list_items", lambda r: r["group_key"] == "home.double_degree", "sort", None),
    "glimpse_facts": ("list_items", lambda r: r["group_key"] == "about.glimpse_facts", "sort", None),
    "why_items": ("why_items", None, "sort", None),
    "partners": ("partners", None, "sort", None),
    "home_lecturers": ("people", lambda r: r["kind"] == "lecturer" and r["is_featured"], "sort", 4),
    "lecturers": ("people", lambda r: r["kind"] == "lecturer", "sort", None),
    "students": ("people", lambda r: r["kind"] == "student", "sort", None),
    "home_news": ("news", None, "news", 4),
    "news_all": ("news", None, "date", 60),
    "news_related": ("news", None, "date", 5),
    "faqs": ("faqs", None, "sort", None),
    "curriculum": ("curriculum_courses", None, "curriculum", None),
    "calendar": ("academic_calendar", None, "sort", None),
    "steps_online": ("admission_steps", lambda r: r["track"] == "online", "sort", None),
    "steps_offline": ("admission_steps", lambda r: r["track"] == "offline", "sort", None),
    "documents": ("admission_documents", None, "sort", None),
    "scholarships": ("scholarships", None, "sort", None),
    "tuition": ("tuition_programs", None, "sort", None),
    "gallery_activities": ("gallery_items", lambda r: r["gallery"] == "activities", "sort", None),
    "gallery_facilities": ("gallery_items", lambda r: r["gallery"] == "facilities", "sort", None),
}

# --------------------------------------------------------------------------
# 3. EKSTRAKSI DARI HTML
# --------------------------------------------------------------------------
PAGE_FILES = ["index.html", "about.html", "admission.html", "profile-lecturers.html",
              "profile-students.html", "gallery-activities.html", "gallery-facilities.html", "news.html", "news-detail.html", "404.html"]

PAGE_LABELS = {
    "global": "Global (semua halaman)", "home": "Beranda", "about": "About IBM", "admission": "Admission",
    "lecturers": "Profil Dosen", "students": "Profil Mahasiswa",
    "news": "News", "news_detail": "Detail Berita", "gallery_activities": "Galeri Kegiatan", "gallery_facilities": "Galeri Fasilitas", "notfound": "Halaman 404",
}
NAME_LABELS = {
    "title": "Judul", "description": "Deskripsi", "eyebrow": "Teks kecil di atas judul", "tag": "Label",
    "cta": "Teks tombol", "cta_url": "Tautan tombol", "cta_primary": "Tombol utama (teks)",
    "cta_primary_url": "Tombol utama (tautan)", "cta_secondary": "Tombol kedua (teks)",
    "cta_secondary_url": "Tombol kedua (tautan)", "image": "Gambar", "note": "Catatan",
    "more_label": "Teks tautan 'lihat semua'", "more_url": "Tautan 'lihat semua'",
    "badge_mark": "Huruf lencana", "badge_text": "Teks lencana", "paragraph_1": "Paragraf 1",
    "paragraph_2": "Paragraf 2", "partner_logo": "Logo mitra",
}


def humanize(key):
    parts = key.split(".")
    page = PAGE_LABELS.get(parts[0], parts[0])
    middle = [p.replace("_", " ").capitalize() for p in parts[1:-1]]
    last = NAME_LABELS.get(parts[-1], parts[-1].replace("_", " ").capitalize())
    return " › ".join([page] + middle + [last])


def norm_text(el):
    classes = el.get("class") or []
    text = el.get_text()
    if "pre-line" in classes:
        return "\n".join(line.strip() for line in text.strip().splitlines())
    return re.sub(r"\s+", " ", text).strip()


def inner_html(el):
    html = "".join(str(c) for c in el.contents)
    return re.sub(r"\s+", " ", html).strip()


def extract_html():
    rows = {}   # key -> dict(kind, value, alt)
    warnings = []

    def put(key, kind, value, alt=None, src=""):
        if key.startswith("global.") and any(g[0] == key for g in GLOBAL):
            return  # nilai global ditentukan di GLOBAL
        if key in rows:
            if rows[key]["value"] != value:
                warnings.append(f"Konflik nilai bawaan untuk '{key}' ({src}): {rows[key]['value']!r} ≠ {value!r}")
            return
        rows[key] = dict(kind=kind, value=value, alt=alt)

    for fname in PAGE_FILES:
        soup = BeautifulSoup((ROOT / fname).read_text(encoding="utf-8"), "html.parser")
        for el in soup.find_all(attrs={"data-cms": True}):
            kind = "richtext" if el.get("data-cms-kind") == "richtext" else "text"
            value = inner_html(el) if kind == "richtext" else norm_text(el)
            put(el["data-cms"], kind, value, src=fname)
        for el in soup.find_all(attrs={"data-cms-src": True}):
            put(el["data-cms-src"], "image", el.get("src", ""), alt=el.get("alt"), src=fname)
        for el in soup.find_all(attrs={"data-cms-href": True}):
            href = el.get("href", "")
            put(el["data-cms-href"], "link", "" if href in ("#", None) else href, src=fname)
        for el in soup.find_all(attrs={"data-cms-content": True}):
            put(el["data-cms-content"], "text", el.get("content", ""), src=fname)
    return rows, warnings


# --------------------------------------------------------------------------
# 4. PEMBUAT OUTPUT
# --------------------------------------------------------------------------
def q(v):
    """Literal SQL."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def number_rows():
    """Beri sort_order 10, 20, 30... per kelompok. Mengembalikan salinan tabel."""
    out = {}
    for table, rows in TABLES.items():
        counters = {}
        new = []
        gkey = GROUP_BY.get(table)
        for r in rows:
            r = dict(r)
            g = r[gkey] if gkey else "_"
            counters[g] = counters.get(g, 0) + 10
            r["sort_order"] = counters[g]
            if table == "tuition_programs":
                r["total_estimate"] = r["building_fee"] + r["tuition_per_semester"] * r["semesters"]
            new.append(r)
        out[table] = new
    return out


def build_sql(content_rows, tables):
    L = []
    L.append("-- =====================================================================")
    L.append("-- seed.sql — DATA AWAL website IBM Institut Asia Malang")
    L.append("-- DIHASILKAN OTOMATIS oleh tools/build_seed.py — jangan diedit manual.")
    L.append("-- Aman dijalankan ulang: tabel yang SUDAH berisi tidak akan ditimpa/diduplikasi,")
    L.append("-- dan site_content memakai 'on conflict do nothing' sehingga hasil editan Anda aman.")
    L.append("-- Jalankan SETELAH schema.sql.")
    L.append("-- =====================================================================\n")

    # site_content
    L.append("insert into public.site_content (content_key, kind, value, alt_text, label) values")
    vals = []
    for key, kind, value, alt in GLOBAL:
        vals.append(f"  ({q(key)}, {q(kind)}, {q(value)}, {q(alt)}, {q(humanize(key))})")
    for key in content_rows:
        r = content_rows[key]
        vals.append(f"  ({q(key)}, {q(r['kind'])}, {q(r['value'])}, {q(r['alt'])}, {q(humanize(key))})")
    L.append(",\n".join(vals))
    L.append("on conflict (content_key) do nothing;\n")

    for table, cols in COLUMNS.items():
        rows = tables[table]
        L.append(f"do $seed$ begin\n  if not exists (select 1 from public.{table}) then")
        L.append(f"    insert into public.{table} ({', '.join(cols)}) values")
        L.append(",\n".join("      (" + ", ".join(q(r[c]) for c in cols) + ")" for r in rows) + ";")
        L.append("  end if;\nend $seed$;\n")
    return "\n".join(L)


def build_fallback(content_rows, tables):
    content = [dict(content_key=k, kind=kind, value=v, alt_text=alt) for k, kind, v, alt in GLOBAL]
    collections = {}
    for name, (table, flt, order, limit) in VIEWS.items():
        rows = [dict(r, is_published=True) for r in tables[table] if (flt is None or flt(r))]
        if order == "sort":
            rows.sort(key=lambda r: r["sort_order"])
        elif order == "curriculum":
            rows.sort(key=lambda r: (r["semester"], r["sort_order"]))
        elif order == "date":
            rows.sort(key=lambda r: r["published_at"], reverse=True)
        elif order == "news":
            rows.sort(key=lambda r: r["published_at"], reverse=True)
            rows.sort(key=lambda r: not r["is_featured"])
        if limit:
            rows = rows[:limit]
        if table == "news":
            for r in rows:
                r["has_content"] = bool(r["content"].strip())
                if name != "news_all":      # daftar lain tidak memuat isi artikel (hemat ukuran)
                    r.pop("content", None)
        collections[name] = rows
    payload = json.dumps(dict(content=content, collections=collections), ensure_ascii=False, indent=1)
    return ("/* DIHASILKAN OTOMATIS oleh tools/build_seed.py — jangan diedit manual.\n"
            "   Data cadangan: tampil bila Supabase belum dikonfigurasi atau tidak terjangkau. */\n"
            "window.IBM_FALLBACK = " + payload + ";\n")


def main():
    content_rows, warnings = extract_html()
    tables = number_rows()
    (ROOT / "supabase" / "seed.sql").write_text(build_sql(content_rows, tables), encoding="utf-8")
    (ROOT / "assets" / "js" / "fallback-data.js").write_text(build_fallback(content_rows, tables), encoding="utf-8")
    print(f"site_content : {len(GLOBAL)} global + {len(content_rows)} dari HTML = {len(GLOBAL) + len(content_rows)} kunci")
    for t, rows in tables.items():
        print(f"{t:22s}: {len(rows)} baris")
    for w in warnings:
        print("PERINGATAN:", w)
    if warnings:
        sys.exit(1)


if __name__ == "__main__":
    main()
