-- Supabase/PostgreSQL Migration Script from db.json
-- This script creates the necessary tables and migrates data from the JSON file.

-- 1. Create the 'users' table
CREATE TABLE public.users (
    wallet_address TEXT PRIMARY KEY,
    points INT NOT NULL DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    task_x_completed BOOLEAN NOT NULL DEFAULT false,
    task_telegram_completed BOOLEAN NOT NULL DEFAULT false,
    task_discord_completed BOOLEAN NOT NULL DEFAULT false,
    mining_activated BOOLEAN NOT NULL DEFAULT false,
    mining_session_start TIMESTAMPTZ,
    referral_code_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to the columns for clarity
COMMENT ON TABLE public.users IS 'Stores user data, keyed by their Solana wallet address.';
COMMENT ON COLUMN public.users.wallet_address IS 'Primary key: The user''s Solana wallet address.';
COMMENT ON COLUMN public.users.points IS 'Total points accumulated by the user.';
COMMENT ON COLUMN public.users.referral_code IS 'The unique referral code for this user.';
COMMENT ON COLUMN public.users.mining_session_start IS 'Timestamp of when the current mining session began.';

-- 2. Create the 'referred_users' table
CREATE TABLE public.referred_users (
    id BIGSERIAL PRIMARY KEY,
    referrer_wallet TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    referred_wallet TEXT NOT NULL,
    join_date TIMESTAMPTZ NOT NULL,
    UNIQUE (referrer_wallet, referred_wallet)
);

-- Add comments
COMMENT ON TABLE public.referred_users IS 'Tracks which users have referred others.';
COMMENT ON COLUMN public.referred_users.referrer_wallet IS 'The wallet of the user who made the referral.';
COMMENT ON COLUMN public.referred_users.referred_wallet IS 'The wallet of the user who was referred.';
COMMENT ON COLUMN public.referred_users.join_date IS 'The timestamp of when the referral was completed.';

-- 3. Setup Row Level Security (RLS)
-- Enable RLS for both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referred_users ENABLE ROW LEVEL SECURITY;

-- Create policies for the 'users' table
CREATE POLICY "Public users are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own user record." ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own user record." ON public.users FOR UPDATE USING (true);

-- Create policies for the 'referred_users' table
CREATE POLICY "Referrals are viewable by everyone." ON public.referred_users FOR SELECT USING (true);
CREATE POLICY "Users can insert referral records." ON public.referred_users FOR INSERT WITH CHECK (true);

-- 4. Data Migration from db.json
-- This section contains INSERT statements to populate the tables with existing data.

-- Upsert data into the 'users' table
INSERT INTO public.users (wallet_address, points, referral_code, task_x_completed, task_telegram_completed, task_discord_completed, mining_activated, mining_session_start, referral_code_applied) VALUES
('9Kqt28pfMVBsBvXYYnYQCT2BZyorAwzbR6dUmgQfsZYW', 0, '9KQT28PF', true, true, true, true, to_timestamp(1751870261586 / 1000.0), COALESCE(null, false)),
('FNzf4sZ7GZHJYEa3FngDtjdJSR45h2Qsq8RbHinDjc1t', 200, 'FNZF4SZ7', true, true, true, true, to_timestamp(1751995627741 / 1000.0), true),
('B23Lt4oFVzVYsqnUNkyz1yjzbobZXDik3Cbt8PQgDyYX', 0, 'B23LT4OF', true, true, true, true, to_timestamp(1751870868100 / 1000.0), true),
('5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX', 10, '5GY5QYXH', true, true, true, true, to_timestamp(1751870978978 / 1000.0), true),
('HKcPmxDhHhgH78tUsa68G26EGTukFL2v4DAJpLHq3hKD', 0, 'HKCPMXDH', true, true, true, false, null, false)
ON CONFLICT (wallet_address) DO UPDATE SET
    points = EXCLUDED.points,
    task_x_completed = EXCLUDED.task_x_completed,
    task_telegram_completed = EXCLUDED.task_telegram_completed,
    task_discord_completed = EXCLUDED.task_discord_completed,
    mining_activated = EXCLUDED.mining_activated,
    mining_session_start = EXCLUDED.mining_session_start,
    referral_code_applied = EXCLUDED.referral_code_applied;

-- Upsert data into the 'referred_users' table
-- Note: Ensure the 'referrer_wallet' users exist in the 'users' table before running this.
INSERT INTO public.referred_users (referrer_wallet, referred_wallet, join_date) VALUES
('FNzf4sZ7GZHJYEa3FngDtjdJSR45h2Qsq8RbHinDjc1t', '5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX', '2025-07-07T06:49:27.391Z')
ON CONFLICT (referrer_wallet, referred_wallet) DO NOTHING;
