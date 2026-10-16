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
