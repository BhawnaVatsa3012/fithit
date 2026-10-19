-- Make a specific account the FitHit owner (run once, in the Supabase SQL editor).
-- Replace the email with the one you sign in with. Does nothing if an owner already exists.
insert into public.fithit_members(user_id)
select id from auth.users where lower(email) = lower('YOUR-EMAIL@example.com')
  and not exists (select 1 from public.fithit_members)
on conflict do nothing;
select count(*) as owners from public.fithit_members;
