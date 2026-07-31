-- ============================================================================
-- ZENBUDGET SUPABASE MIGRATION (V3.0)
-- Run this in your Supabase SQL Editor to support the updated v3.0 release.
-- ============================================================================

-- STEP 1: Add device_type column to public.device_sessions
ALTER TABLE public.device_sessions ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';

-- STEP 2: Update device_sessions RLS policies
-- Allow anyone to read all device sessions for checking client logins across accounts
DROP POLICY IF EXISTS "Allow anyone to read device sessions" ON public.device_sessions;
CREATE POLICY "Allow anyone to read device sessions" ON public.device_sessions FOR SELECT USING (true);

-- STEP 3: Add referral_rewards_claimed to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_rewards_claimed INTEGER DEFAULT 0;

-- STEP 4: Add couple_code and partner_couple_code to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS couple_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_couple_code TEXT;

-- STEP 5: Re-create unique couple_codes for existing profiles (if null)
-- This script generates a unique couple code like CP-XXXX-YYYY for existing users
UPDATE public.profiles 
  SET couple_code = 'CP-' || substring(upper(md5(random()::text)) from 1 for 4) || '-' || substring(upper(md5(random()::text)) from 5 for 4)
  WHERE couple_code IS NULL;

-- STEP 6: Update public.transactions policies to allow viewing partner transactions based on couple_code rather than referral_code
DROP POLICY IF EXISTS "Allow premium partners to view transactions" ON public.transactions;
CREATE POLICY "Allow premium partners to view transactions" 
  ON public.transactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles my_prof
      JOIN public.profiles partner_prof 
        ON partner_prof.couple_code = my_prof.partner_couple_code 
        OR my_prof.couple_code = partner_prof.partner_couple_code
      WHERE my_prof.id = auth.uid() 
        AND partner_prof.id = transactions.user_id
        AND my_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
        AND partner_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
    )
  );

-- STEP 7: Update public.budgets policies to allow viewing partner budgets based on couple_code
DROP POLICY IF EXISTS "Allow premium partners to view budgets" ON public.budgets;
CREATE POLICY "Allow premium partners to view budgets" 
  ON public.budgets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles my_prof
      JOIN public.profiles partner_prof 
        ON partner_prof.couple_code = my_prof.partner_couple_code 
        OR my_prof.couple_code = partner_prof.partner_couple_code
      WHERE my_prof.id = auth.uid() 
        AND partner_prof.id = budgets.user_id
        AND my_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
        AND partner_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
    )
  );

-- Done!
