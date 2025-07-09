-- Re-create the get_leaderboard function with correct logic
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE(wallet_address text, points integer, referral_count bigint)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      u.wallet_address,
      u.points,
      (SELECT COUNT(*) FROM public.referred_users ru WHERE ru.referrer_wallet = u.wallet_address) as referral_count
    FROM
      public.users u
    ORDER BY
      u.points DESC, u.created_at ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Re-create the get_all_users_with_referral_counts function for the admin panel
CREATE OR REPLACE FUNCTION get_all_users_with_referral_counts()
RETURNS TABLE(wallet_address text, points integer, referral_count bigint)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      u.wallet_address,
      u.points,
      (SELECT COUNT(*) FROM public.referred_users ru WHERE ru.referrer_wallet = u.wallet_address) as referral_count
    FROM
      public.users u
    ORDER BY
      u.created_at DESC;
END;
$$ LANGUAGE plpgsql;
