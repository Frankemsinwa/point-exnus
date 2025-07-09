-- This script re-inserts the referral data from the original db.json file
-- into the `referred_users` table. It's safe to run multiple times.

INSERT INTO public.referred_users (referrer_wallet, referee_wallet, join_date)
VALUES
  ('FNzf4sZ7GZHJYEa3FngDtjdJSR45h2Qsq8RbHinDjc1t', '5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX', '2025-07-07T06:49:27.391Z')
ON CONFLICT (referrer_wallet, referee_wallet) DO NOTHING;
