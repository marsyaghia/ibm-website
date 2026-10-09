-- =====================================================================
-- update-news-detail.sql — tambahan untuk halaman DETAIL berita (news-detail.html)
-- Jalankan SEKALI di SQL Editor bila database Anda SUDAH berjalan (schema/seed versi lama).
-- Urutan: (1) update-news-page.sql bila belum, lalu (2) file ini.
-- Jika baru memulai dari nol, cukup schema.sql + seed.sql terbaru (file ini tidak perlu).
-- Aman dijalankan ulang; data berita Anda tidak diubah selain slug yang diisi otomatis.
-- =====================================================================

-- 1. Kolom baru pada tabel news
alter table public.news add column if not exists slug text;
alter table public.news add column if not exists content text not null default '';
alter table public.news add column if not exists has_content boolean
  generated always as (length(btrim(content)) > 0) stored;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'news_slug_format') then
    alter table public.news add constraint news_slug_format
      check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

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

-- 2. Isi slug untuk berita yang sudah ada (trigger membuatnya dari judul)
update public.news set slug = null where slug is null or btrim(slug) = '';

create unique index if not exists news_slug_key on public.news (slug);

-- 3. Teks halaman detail (bisa diedit di site_content, filter page = news_detail)
insert into public.site_content (content_key, kind, value, alt_text, label) values
  ('news_detail.share_label', 'text', 'Bagikan:', null, 'Detail Berita › Share label'),
  ('news_detail.copy_label', 'text', 'Salin tautan', null, 'Detail Berita › Copy label'),
  ('news_detail.copied_label', 'text', 'Tautan disalin ✓', null, 'Detail Berita › Copied label'),
  ('news_detail.source_label', 'text', 'Baca sumber asli', null, 'Detail Berita › Source label'),
  ('news_detail.breadcrumb_label', 'text', 'Navigasi remah roti', null, 'Detail Berita › Breadcrumb label'),
  ('news_detail.meta.title', 'text', 'Detail Berita — IBM Institut Asia Malang', null, 'Detail Berita › Meta › Judul'),
  ('news_detail.not_found.eyebrow', 'text', '404', null, 'Detail Berita › Not found › Teks kecil di atas judul'),
  ('news_detail.not_found.title', 'text', 'Berita tidak ditemukan', null, 'Detail Berita › Not found › Judul'),
  ('news_detail.not_found.text', 'text', 'Berita yang Anda cari mungkin sudah dihapus atau alamatnya berubah.', null, 'Detail Berita › Not found › Text'),
  ('news_detail.not_found.cta', 'text', 'Lihat semua berita', null, 'Detail Berita › Not found › Teks tombol'),
  ('news_detail.related.title', 'text', 'Berita Lainnya', null, 'Detail Berita › Related › Judul'),
  ('news_detail.related.more_label', 'text', 'Lihat semua berita', null, 'Detail Berita › Related › Teks tautan ''lihat semua'''),
  ('news_detail.not_found.cta_url', 'link', 'news.html', null, 'Detail Berita › Not found › Tautan tombol'),
  ('news_detail.related.more_url', 'link', 'news.html', null, 'Detail Berita › Related › Tautan ''lihat semua'''),
  ('news_detail.meta.description', 'text', 'Baca berita terbaru IBM Institut Asia Malang.', null, 'Detail Berita › Meta › Deskripsi')
on conflict (content_key) do nothing;
