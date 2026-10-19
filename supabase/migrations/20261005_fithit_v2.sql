-- FitHit v2: membership lock, settings, integrity checks, server-set timestamps.
-- Applied to Supabase project parv-app. Safe to re-run.

-- 1. Who may use FitHit. The first account to call fithit_claim() becomes the owner;
--    anyone else who signs up through FitHit gets an empty, read-nothing, write-nothing account.
create table if not exists public.fithit_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.fithit_members enable row level security;
drop policy if exists fithit_members_select_own on public.fithit_members;
create policy fithit_members_select_own on public.fithit_members for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.fithit_members from anon, authenticated;
grant select on public.fithit_members to authenticated;

create or replace function public.fithit_is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.fithit_members m where m.user_id = (select auth.uid()));
$$;

create or replace function public.fithit_claim() returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return false; end if;
  lock table public.fithit_members in exclusive mode;
  if not exists (select 1 from public.fithit_members) then
    insert into public.fithit_members(user_id) values (auth.uid());
  end if;
  return exists (select 1 from public.fithit_members where user_id = auth.uid());
end $$;
revoke all on function public.fithit_claim() from public, anon;
grant execute on function public.fithit_claim() to authenticated;
revoke all on function public.fithit_is_member() from public, anon;
grant execute on function public.fithit_is_member() to authenticated;

-- 2. Days: audit fields, checks, server-owned updated_at, member-only access.
alter table public.fithit_days add column if not exists created_at timestamptz not null default now();
alter table public.fithit_days drop constraint if exists fithit_days_data_object;
alter table public.fithit_days add constraint fithit_days_data_object check (jsonb_typeof(data) = 'object');
alter table public.fithit_days drop constraint if exists fithit_days_data_size;
alter table public.fithit_days add constraint fithit_days_data_size check (pg_column_size(data) < 16384);
alter table public.fithit_days drop constraint if exists fithit_days_day_range;
alter table public.fithit_days add constraint fithit_days_day_range check (day between date '2020-01-01' and date '2100-12-31');

create or replace function public.fithit_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists fithit_days_touch on public.fithit_days;
create trigger fithit_days_touch before insert or update on public.fithit_days for each row execute function public.fithit_touch();

drop policy if exists fithit_days_select_own on public.fithit_days;
drop policy if exists fithit_days_insert_own on public.fithit_days;
drop policy if exists fithit_days_update_own on public.fithit_days;
drop policy if exists fithit_days_delete_own on public.fithit_days;
create policy fithit_days_select_own on public.fithit_days for select to authenticated using ((select auth.uid()) = user_id and (select public.fithit_is_member()));
create policy fithit_days_insert_own on public.fithit_days for insert to authenticated with check ((select auth.uid()) = user_id and (select public.fithit_is_member()));
create policy fithit_days_update_own on public.fithit_days for update to authenticated using ((select auth.uid()) = user_id and (select public.fithit_is_member())) with check ((select auth.uid()) = user_id);
create policy fithit_days_delete_own on public.fithit_days for delete to authenticated using ((select auth.uid()) = user_id and (select public.fithit_is_member()));

-- 3. Settings: one row per user (targets, rest day, InBody dates). Personal numbers live here, not in code.
create table if not exists public.fithit_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fithit_settings enable row level security;
drop trigger if exists fithit_settings_touch on public.fithit_settings;
create trigger fithit_settings_touch before insert or update on public.fithit_settings for each row execute function public.fithit_touch();
drop policy if exists fithit_settings_all_own on public.fithit_settings;
create policy fithit_settings_all_own on public.fithit_settings for all to authenticated
  using ((select auth.uid()) = user_id and (select public.fithit_is_member()))
  with check ((select auth.uid()) = user_id and (select public.fithit_is_member()));
revoke all on public.fithit_settings from anon;
grant select, insert, update, delete on public.fithit_settings to authenticated;

-- 4. Close the "first sign-in claims it" window: if exactly one account already has FitHit days
--    (i.e. you used v1), that account becomes the owner now, before v2 goes live.
--    Fresh installs: run supabase/seed_owner.sql with your email BEFORE sharing the app link.
insert into public.fithit_members(user_id)
select user_id from public.fithit_days group by user_id
having (select count(distinct user_id) from public.fithit_days) = 1
on conflict do nothing;
