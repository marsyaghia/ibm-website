/* =========================================================================
   KONFIGURASI SUPABASE — satu-satunya file yang perlu Anda isi.

   Ambil dua nilai ini di Supabase Dashboard:
     Project Settings → API  (atau "API Keys")

   1) SUPABASE_URL : alamat proyek, contoh https://abcdefgh.supabase.co
   2) SUPABASE_KEY : kunci PUBLIK saja. Boleh salah satu:
        - "anon" key (diawali eyJ...)            ← legacy
        - "publishable" key (diawali sb_publishable_...)
      JANGAN PERNAH menaruh "service_role" atau "secret" key di sini.
      File ini dikirim ke browser pengunjung. Keamanan data dijaga oleh
      Row Level Security (RLS) di database, bukan oleh kerahasiaan kunci ini.

   Selama nilai di bawah belum diganti, website tetap tampil memakai data
   bawaan (assets/js/fallback-data.js), jadi aman dibuka lokal untuk uji coba.
   ========================================================================= */
window.IBM_CONFIG = {
  SUPABASE_URL: 'https://spleuclazyxhnlkguqys.supabase.co',
  SUPABASE_KEY: 'sb_publishable_1NcKKzcgLFDhZOph0STO-A_MgVQrDnU',

  REQUEST_TIMEOUT_MS: 6000,  // batas waktu tunggu per permintaan ke Supabase
  REVEAL_TIMEOUT_MS: 2200,   // jika data belum datang, tampilkan data bawaan
  CACHE_VERSION: 1           // naikkan angka ini untuk memaksa semua pengunjung memuat ulang cache
};
