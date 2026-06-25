-- ============================================================================
-- Migrate an existing AUTH-based install to the open single-owner model.
-- Safe to run on a fresh install too (everything is guarded with IF EXISTS).
-- ============================================================================

-- Drop the signup trigger + function ----------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop the profiles table (no longer used) ----------------------------------
drop table if exists public.profiles cascade;

-- Drop foreign keys that pointed at auth.users ------------------------------
alter table if exists public.app_settings    drop constraint if exists app_settings_user_id_fkey;
alter table if exists public.daily_revenue   drop constraint if exists daily_revenue_user_id_fkey;
alter table if exists public.expenses        drop constraint if exists expenses_user_id_fkey;
alter table if exists public.inventory_items drop constraint if exists inventory_items_user_id_fkey;
alter table if exists public.stock_purchases drop constraint if exists stock_purchases_user_id_fkey;
alter table if exists public.empty_boxes     drop constraint if exists empty_boxes_user_id_fkey;
alter table if exists public.damaged_stock   drop constraint if exists damaged_stock_user_id_fkey;

-- Default every owner column to the fixed owner -----------------------------
alter table if exists public.app_settings    alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.daily_revenue   alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.expenses        alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.inventory_items alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.stock_purchases alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.empty_boxes     alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table if exists public.damaged_stock   alter column user_id set default '00000000-0000-0000-0000-000000000001';

-- Move any pre-existing rows onto the fixed owner ---------------------------
update public.app_settings    set user_id = '00000000-0000-0000-0000-000000000001' where user_id is not null;
update public.daily_revenue   set user_id = '00000000-0000-0000-0000-000000000001';
update public.expenses        set user_id = '00000000-0000-0000-0000-000000000001';
update public.inventory_items set user_id = '00000000-0000-0000-0000-000000000001';
update public.stock_purchases set user_id = '00000000-0000-0000-0000-000000000001';
update public.empty_boxes     set user_id = '00000000-0000-0000-0000-000000000001';
update public.damaged_stock   set user_id = '00000000-0000-0000-0000-000000000001';

-- Drop old RLS policies + disable RLS ---------------------------------------
drop policy if exists "settings_all_own"        on public.app_settings;
drop policy if exists "daily_revenue_all_own"   on public.daily_revenue;
drop policy if exists "expenses_all_own"        on public.expenses;
drop policy if exists "inventory_items_all_own" on public.inventory_items;
drop policy if exists "stock_purchases_all_own" on public.stock_purchases;
drop policy if exists "empty_boxes_all_own"     on public.empty_boxes;
drop policy if exists "damaged_stock_all_own"   on public.damaged_stock;

alter table if exists public.app_settings    disable row level security;
alter table if exists public.daily_revenue   disable row level security;
alter table if exists public.expenses        disable row level security;
alter table if exists public.inventory_items disable row level security;
alter table if exists public.stock_purchases disable row level security;
alter table if exists public.empty_boxes     disable row level security;
alter table if exists public.damaged_stock   disable row level security;

-- Grant the anon/authenticated roles access ---------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- Ensure the single settings row exists -------------------------------------
insert into public.app_settings (user_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (user_id) do nothing;
