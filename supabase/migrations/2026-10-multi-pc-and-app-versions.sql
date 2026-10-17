-- Run this ONCE in the Supabase dashboard: SQL Editor, then New query, paste, Run.
-- It is safe to run more than once.

-- 1) Several PCs per person (for example a laptop and a desktop).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pc_specs'::regclass
      and contype = 'p'
      and pg_get_constraintdef(oid) like '%(id)%'
  ) then
    alter table public.pc_specs drop constraint if exists pc_specs_pkey;
    alter table public.pc_specs add column if not exists id uuid not null default gen_random_uuid();
    alter table public.pc_specs add primary key (id);
  end if;
end $$;

alter table public.pc_specs add column if not exists name text not null default 'My PC';
alter table public.pc_specs add column if not exists is_active boolean not null default false;
alter table public.pc_specs add column if not exists created_at timestamptz not null default now();

-- The PC you already saved becomes your active PC.
update public.pc_specs
set is_active = true
where id in (
  select distinct on (p.user_id) p.id
  from public.pc_specs p
  where not exists (
    select 1 from public.pc_specs a where a.user_id = p.user_id and a.is_active
  )
  order by p.user_id, p.created_at
);

create unique index if not exists pc_specs_one_active_per_user on public.pc_specs (user_id) where is_active;
create index if not exists pc_specs_user_idx on public.pc_specs (user_id);

-- 2) A list of app versions, so installed apps can tell when a newer APK is available.
create table if not exists public.app_versions (
  version text primary key,
  apk_url text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.app_versions enable row level security;

drop policy if exists "Anyone can read app versions" on public.app_versions;
create policy "Anyone can read app versions" on public.app_versions
  for select to anon, authenticated using (true);

-- Each time you build a new APK, add a row like this (change the values):
-- insert into public.app_versions (version, apk_url, notes)
-- values ('1.2.0', 'https://expo.dev/accounts/YOUR-NAME/projects/MyGameList/builds/BUILD-ID', 'What is new in this version');
