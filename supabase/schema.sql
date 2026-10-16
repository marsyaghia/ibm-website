-- =====================================================================
-- schema.sql — Database schema (CMS) for the IBM Malang Asia Institute website
--
-- HOW TO USE
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   Then run supabase/seed.sql to load the initial data.
--   Safe to re-run (uses "if not exists").
--   Existing project? Run supabase/migration-2026-10-redesign.sql instead.
--
-- DESIGN (summary)
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
create table if not exists public.scholarships (
  id           bigint generated always as identity primary key,
  label        text not null default '',
  title        text not null,
  description  text not null default '',
  points       jsonb not null default '[]'::jsonb check (jsonb_typeof(points) = 'array'),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.scholarships is 'Admission — kartu beasiswa. points = array JSON.';

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
-- 7b. REDESIGN ADDITIONS (2026-10): lecturer pop-up fields, student batches, official partner,
--     step links, testimonials, footer links, action buttons, re-registration fees, visitor form.
--     (Same statements as the upgrade migration; idempotent.)
-- =====================================================================
-- ---------- STRUCTURE: new columns on existing tables (additive only) ----------

-- people: lecturer pop-up fields + student batch (angkatan)
alter table public.people add column if not exists position     text not null default '';
alter table public.people add column if not exists company      text not null default '';
alter table public.people add column if not exists specialty    text not null default '';
alter table public.people add column if not exists achievements text not null default '';
alter table public.people add column if not exists batch        smallint;
do $m$ begin
  if not exists (select 1 from pg_constraint where conname = 'people_batch_range') then
    alter table public.people add constraint people_batch_range check (batch is null or batch between 1 and 30);
  end if;
end $m$;
create index if not exists people_batch_idx on public.people (kind, batch, sort_order);
comment on column public.people.position     is 'Pop-up "Position" (job title). Falls back to "program" when empty.';
comment on column public.people.company      is 'Pop-up "Company" (employer or institution).';
comment on column public.people.specialty    is 'Pop-up "Specialist" (area of expertise). Falls back to "detail" when empty.';
comment on column public.people.achievements is 'Pop-up "Achievements & Credibility". ONE achievement per line.';
comment on column public.people.batch        is 'Students only: batch number (1, 2, 3, 4 ...). Each batch becomes a tab on Student Profiles.';
comment on table  public.people              is 'Lecturers (kind=lecturer) and students (kind=student). Lecturers: name, position, company, specialty, achievements (pop-up). Students: name, program, detail, batch (tabs).';

-- partners: the locked "Official Partner" slot
alter table public.partners add column if not exists is_official boolean not null default false;
comment on column public.partners.is_official is 'true = shown in the locked "Official Partner" slot (left side). All other partners scroll as a marquee.';
comment on table  public.partners              is 'Partner logos. is_official=true is pinned left in the "Official Partner" slot; the rest scroll automatically.';

-- admission_steps: optional action link inside a step (e.g. the online registration link)
alter table public.admission_steps add column if not exists link_label text not null default '';
alter table public.admission_steps add column if not exists link_url   text not null default '';
comment on column public.admission_steps.link_label is 'Optional button text shown inside the step (e.g. "Register Now"). Needs link_url as well.';
comment on column public.admission_steps.link_url   is 'Optional button link for this step.';

-- scholarships: information cards only (no button)
comment on table public.scholarships is 'Admission — scholarship cards (4 on the page): label, title, description, points (JSON array of texts). No button.';

-- tuition_programs is no longer shown on the site (replaced by reregistration_fees + flat semester fee in site_content)
comment on table public.tuition_programs is 'DEPRECATED — no longer used by the website. Kept so existing data is not lost. See reregistration_fees and the admission.tuition.* keys in site_content.';

-- documentation comments (visible in the Supabase Table Editor)
comment on table public.why_items  is 'Home — "Why IBM Asia?" carousel cards. icon: graduate, award, users, languages, sparkles, plane, badge-check, globe, book, briefcase, compass, chart, star — or an image URL.';
comment on table public.list_items is 'Short lists distinguished by group_key: home.hero_stats, home.double_degree, about.glimpse_facts, global.opening_hours (footer: title = days, body = hours).';

-- ---------- STRUCTURE: new tables ----------

create table if not exists public.testimonials (
  id           bigint generated always as identity primary key,
  name         text not null,
  batch        text not null default '',
  quote        text not null,
  photo_url    text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.testimonials is 'Home — Testimonials carousel. Each card: photo_url (1 photo, left), quote, name, batch.';

create table if not exists public.footer_links (
  id           bigint generated always as identity primary key,
  group_no     smallint not null check (group_no between 1 and 8),
  label        text not null,
  url          text not null default '',
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists footer_links_group_idx on public.footer_links (group_no, sort_order);
comment on table public.footer_links is 'Footer section 1 (all pages). group_no 1 = New Student Admission, 2 = Institutions/Agencies, 3 = Student Services. Group titles: site_content keys global.footer.group_1_title ... group_3_title.';

create table if not exists public.buttons (
  id           bigint generated always as identity primary key,
  group_key    text not null,
  label        text not null,
  url          text not null default '',
  variant      text not null default 'navy' check (variant in ('gold', 'navy', 'outline', 'light')),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists buttons_group_idx on public.buttons (group_key, sort_order);
comment on table public.buttons is 'Action buttons. group_key: home.simaka (For Students / For Lecturers), admission.scholarship_registration (Apply Now), admission.scholarship_test (TPA Test / TPE Test). Empty url = shown disabled as "Link coming soon".';

create table if not exists public.reregistration_fees (
  id           bigint generated always as identity primary key,
  period_label text not null,
  fee          numeric(14, 0) not null default 0 check (fee >= 0),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.reregistration_fees is 'Admission — Re-Registration Fees table (4 periods, one fee each). fee = 0 is shown as "To be announced".';

-- Visitor sign-ins from the Home pop-up. PUBLIC may only INSERT (never read). View the data in the Dashboard.
create table if not exists public.visitor_leads (
  id         bigint generated always as identity primary key,
  full_name  text not null check (char_length(btrim(full_name)) between 2 and 120),
  school     text not null check (char_length(btrim(school)) between 2 and 160),
  phone      text not null check (phone ~ '^[0-9+()\-\s]{8,20}$'),
  email      text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  page_url   text not null default '' check (char_length(page_url) <= 300),
  referrer   text not null default '' check (char_length(referrer) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists visitor_leads_created_idx on public.visitor_leads (created_at desc);
comment on table public.visitor_leads is 'Visitors who completed the Home pop-up (name, school, phone, email). Insert-only for the public website; read it in the Supabase Dashboard or export as CSV.';

-- ---------- SECURITY: triggers, RLS, grants for the new tables ----------
do $m$
declare
  t text;
begin
  foreach t in array array['testimonials', 'footer_links', 'buttons', 'reregistration_fees'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (is_published)', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $m$;

alter table public.visitor_leads enable row level security;
drop policy if exists "public insert" on public.visitor_leads;
create policy "public insert" on public.visitor_leads for insert to anon, authenticated
  with check (char_length(btrim(full_name)) >= 2 and char_length(btrim(school)) >= 2);
revoke all on public.visitor_leads from anon, authenticated;
grant insert on public.visitor_leads to anon, authenticated;

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
