-- =====================================================================
-- schema.sql — Skema database CMS website IBM Institut Asia Malang
--
-- CARA PAKAI
--   Supabase Dashboard → SQL Editor → New query → tempel seluruh file ini → Run.
--   Lalu jalankan supabase/seed.sql untuk mengisi data awal.
--   Aman dijalankan ulang (memakai "if not exists").
--
-- RANCANGAN (ringkas)
--   • site_content : SATU tabel key–value untuk semua teks/gambar/tautan tunggal di
--                    seluruh halaman (judul, deskripsi, tombol, logo, footer, SEO, dll).
--                    Menambah teks baru = tambah 1 baris, tanpa ubah skema atau kode.
--   • Tabel daftar : satu tabel per jenis daftar berulang (dosen, FAQ, berita, dst).
--   • Keamanan     : RLS aktif di semua tabel. Pengunjung (anon) HANYA boleh membaca
--                    baris yang is_published = true. Tidak ada izin tulis dari website.
--                    Pengeditan dilakukan lewat Supabase Dashboard (Table Editor).
-- =====================================================================

-- ---------- 0. Fungsi pembantu: isi updated_at otomatis ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- 1. site_content : semua teks/gambar/tautan tunggal ----------
-- content_key  : "<halaman>.<bagian>.<nama>", contoh home.hero.title
-- kind         : text | richtext (HTML terbatas: b, i, strong, em, br, a, p, ul, li) | image | link
-- value        : isi. KOSONG = elemen tersebut disembunyikan di website.
-- alt_text     : deskripsi gambar (khusus kind = image) untuk aksesibilitas & SEO
-- label        : keterangan untuk memudahkan Anda mencari baris di Table Editor
create table if not exists public.site_content (
  content_key text primary key
    check (content_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  page        text generated always as (split_part(content_key, '.', 1)) stored,
  kind        text not null default 'text'
    check (kind in ('text', 'richtext', 'image', 'link')),
  value       text not null default '',
  alt_text    text,
  label       text,
  updated_at  timestamptz not null default now()
);
create index if not exists site_content_page_idx on public.site_content (page);
comment on table public.site_content is 'Teks, gambar, dan tautan tunggal di semua halaman. Kunci: halaman.bagian.nama. Nilai kosong = disembunyikan.';

-- ---------- 2. list_items : daftar pendek serbaguna ----------
-- group_key menentukan di mana daftar tampil:
--   home.hero_stats      → angka statistik di hero beranda (title = angka, body = keterangan)
--   home.double_degree   → poin centang pada section Double Degree (body = teks)
--   about.glimpse_facts  → fakta ringkas di About (title = label, body = isi)
create table if not exists public.list_items (
  id           bigint generated always as identity primary key,
  group_key    text not null,
  title        text not null default '',
  body         text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists list_items_group_idx on public.list_items (group_key, sort_order);
comment on table public.list_items is 'Daftar pendek: statistik hero, poin Double Degree, fakta About. Dibedakan oleh group_key.';

-- ---------- 3. Beranda ----------
-- icon: salah satu dari graduation-cap, award, users, languages, sparkles, plane, badge-check — atau URL gambar
create table if not exists public.why_items (
  id           bigint generated always as identity primary key,
  icon         text not null default 'star',
  title        text not null,
  description  text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.why_items is 'Beranda — kartu "Why IBM Asia?". icon: graduation-cap, award, users, languages, sparkles, plane, badge-check, atau URL gambar.';

create table if not exists public.partners (
  id           bigint generated always as identity primary key,
  name         text not null,
  logo_url     text not null,
  website_url  text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.partners is 'Beranda — logo mitra yang bergulir otomatis.';

create table if not exists public.news (
  id           bigint generated always as identity primary key,
  title        text not null,
  excerpt      text not null default '',
  image_url    text not null default '',
  published_at date not null default current_date,
  is_featured  boolean not null default false,
  link_url     text not null default '',
  slug         text,
  content      text not null default '',
  has_content  boolean generated always as (length(btrim(content)) > 0) stored,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint news_slug_format check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create index if not exists news_published_idx on public.news (is_published, published_at desc);
create unique index if not exists news_slug_key on public.news (slug);
comment on table public.news is 'IBM News. Beranda: satu berita is_featured tampil besar + 3 terbaru. Halaman News: semua berita. Halaman detail: dibuka bila kolom content terisi.';
comment on column public.news.slug is 'Alamat artikel (news-detail.html?slug=...). Kosongkan saat menambah berita: dibuat otomatis dari judul.';
comment on column public.news.content is 'Isi artikel. Teks biasa (pisahkan paragraf dengan baris kosong) ATAU HTML terbatas: p, h2, h3, h4, ul, ol, li, blockquote, a, img, b, strong, i, em, br. Kosong = kartu tidak membuka halaman detail.';

-- Slug otomatis dari judul (hanya bila slug kosong); bila bentrok ditambah -<id>.
create or replace function public.news_set_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := btrim(regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'), '-');
    if base = '' then base := 'berita'; end if;
    base := left(base, 80);
    base := btrim(base, '-');
    if exists (select 1 from public.news n where n.slug = base and n.id is distinct from new.id) then
      base := base || '-' || new.id;
    end if;
    new.slug := base;
  else
    new.slug := lower(btrim(new.slug));
  end if;
  return new;
end $$;

drop trigger if exists news_set_slug on public.news;
create trigger news_set_slug before insert or update on public.news
  for each row execute function public.news_set_slug();

create table if not exists public.faqs (
  id           bigint generated always as identity primary key,
  question     text not null,
  answer       text not null,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.faqs is 'Beranda — pertanyaan yang sering diajukan.';

-- ---------- 4. Profil dosen & mahasiswa ----------
-- kind = lecturer | student.  is_featured = tampil juga di beranda (maks. 4 dosen).
create table if not exists public.people (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('lecturer', 'student')),
  name         text not null,
  program      text not null default '',
  detail       text not null default '',
  photo_url    text not null default '',
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists people_kind_idx on public.people (kind, sort_order);
comment on table public.people is 'Profil dosen (kind=lecturer) dan mahasiswa (kind=student). program = program studi; detail = keahlian / angkatan.';

-- ---------- 5. About ----------
create table if not exists public.curriculum_courses (
  id           bigint generated always as identity primary key,
  semester     smallint not null check (semester between 1 and 14),
  course_name  text not null,
  credits      smallint not null default 0 check (credits >= 0),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists curriculum_semester_idx on public.curriculum_courses (semester, sort_order);
comment on table public.curriculum_courses is 'About — mata kuliah per semester. Total SKS per semester dihitung otomatis di website.';

create table if not exists public.academic_calendar (
  id           bigint generated always as identity primary key,
  activity     text not null,
  start_date   date not null,
  end_date     date,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.academic_calendar is 'About — kalender akademik. end_date boleh kosong (tampil sebagai tanda —).';

-- ---------- 6. Admission ----------
create table if not exists public.admission_steps (
  id           bigint generated always as identity primary key,
  track        text not null check (track in ('online', 'offline')),
  title        text not null,
  description  text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists admission_steps_track_idx on public.admission_steps (track, sort_order);
comment on table public.admission_steps is 'Admission — langkah pendaftaran. Nomor langkah otomatis mengikuti urutan sort_order.';

create table if not exists public.admission_documents (
  id            bigint generated always as identity primary key,
  document_name text not null,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.admission_documents is 'Admission — daftar dokumen pendaftaran.';

-- points: array JSON berisi teks, contoh ["Poin 1", "Poin 2"]
-- Tombol hanya tampil bila button_label DAN button_url terisi.
create table if not exists public.scholarships (
  id           bigint generated always as identity primary key,
  label        text not null default '',
  title        text not null,
  description  text not null default '',
  points       jsonb not null default '[]'::jsonb check (jsonb_typeof(points) = 'array'),
  button_label text not null default '',
  button_url   text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.scholarships is 'Admission — kartu beasiswa. points = array JSON. Tombol tampil jika label & url terisi.';

-- total_estimate dihitung otomatis: uang gedung + (SPP × jumlah semester).
-- (Uang pendaftaran ditampilkan terpisah dan TIDAK ikut dijumlahkan, sesuai data awal.)
create table if not exists public.tuition_programs (
  id                   bigint generated always as identity primary key,
  program              text not null,
  registration_fee     numeric(14, 0) not null default 0 check (registration_fee >= 0),
  building_fee         numeric(14, 0) not null default 0 check (building_fee >= 0),
  tuition_per_semester numeric(14, 0) not null default 0 check (tuition_per_semester >= 0),
  semesters            smallint not null default 7 check (semesters between 1 and 14),
  total_estimate       numeric(16, 0) generated always as (building_fee + tuition_per_semester * semesters) stored,
  sort_order           integer not null default 0,
  is_published         boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table public.tuition_programs is 'Admission — biaya per program studi. total_estimate otomatis = uang gedung + SPP × semesters.';

-- ---------- 7. Galeri ----------
create table if not exists public.gallery_items (
  id           bigint generated always as identity primary key,
  gallery      text not null check (gallery in ('activities', 'facilities')),
  caption      text not null default '',
  image_url    text not null,
  alt_text     text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists gallery_items_idx on public.gallery_items (gallery, sort_order);
comment on table public.gallery_items is 'Galeri: gallery=activities (Kegiatan Mahasiswa) atau facilities (Fasilitas Belajar).';

-- =====================================================================
-- 8. KEAMANAN: Row Level Security + hak akses minimum
-- =====================================================================
do $$
declare
  t text;
  all_tables text[] := array[
    'site_content', 'list_items', 'why_items', 'partners', 'news', 'faqs', 'people',
    'curriculum_courses', 'academic_calendar', 'admission_steps', 'admission_documents',
    'scholarships', 'tuition_programs', 'gallery_items'
  ];
begin
  foreach t in array all_tables loop
    -- updated_at otomatis
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);

    -- RLS: aktif, hanya SELECT untuk publik
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    if t = 'site_content' then
      execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    else
      execute format('create policy "public read" on public.%I for select to anon, authenticated using (is_published)', t);
    end if;

    -- Hak akses tabel: baca saja. Tulis hanya lewat Dashboard / service role.
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- =====================================================================
-- 9. Penyimpanan gambar (Supabase Storage)
-- Bucket publik "site-media": unggah gambar lewat Dashboard → Storage,
-- lalu salin Public URL ke kolom *_url / value di tabel terkait.
-- Batas 5 MB per file, hanya format gambar.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
