-- This script fixes a critical error in the database schema where the
-- 'referee_wallet' column was missing from the 'referred_users' table.
-- This was causing the "column referred_users.referee_wallet does not exist" error.
--
-- To apply this fix, please run this SQL in your Supabase SQL Editor.
--
-- NOTE: If you have any existing data in the 'referred_users' table from a
-- previous partial migration, this command might fail. If it does, you will
-- need to delete the existing rows from that table before running this script.

ALTER TABLE public.referred_users
ADD COLUMN referee_wallet TEXT NOT NULL;

-- After running this, your database schema will match what the application code expects,
-- and the errors should be resolved.
