-- -----------------------------------------------------------------------------------------------
-- Fix for Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------------------------
-- The previous migration script included RLS policies that were too restrictive for the server.
-- This script corrects them. Please run this entire script in your Supabase SQL Editor.
-- -----------------------------------------------------------------------------------------------

-- 1. Drop the old, incorrect policies. It's safe to run this even if they don't exist.
DROP POLICY IF EXISTS "Allow user to insert their own record" ON public.users;
DROP POLICY IF EXISTS "Allow user to update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;


-- 2. Create new, correct policies for the 'users' table.
-- These policies allow your secure server (using the service_role key) to manage user data,
-- while still allowing anyone to read public user information (like for the leaderboard).

-- Allows public read access to all users.
CREATE POLICY "Allow public read-only access to users" ON public.users
    FOR SELECT USING (true);

-- Allows your server (authenticated with the service_role key) to create new users.
CREATE POLICY "Allow server to create users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allows your server (authenticated with the service_role key) to update user data.
CREATE POLICY "Allow server to update users" ON public.users
    FOR UPDATE USING (true);

-- 3. Verify policies for 'referred_users' table (no changes needed, but good to confirm).
-- This ensures anyone can read referral data, which is needed for the dashboard.
-- Writes to this table are handled by a database function, so direct insert/update policies are not needed.
DROP POLICY IF EXISTS "Allow public read access to referrals" ON public.referred_users;
CREATE POLICY "Allow public read-only access to referrals" ON public.referred_users
    FOR SELECT USING (true);
