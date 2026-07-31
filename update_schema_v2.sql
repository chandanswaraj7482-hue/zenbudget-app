-- ============================================================================
-- ZENBUDGET SUPABASE MIGRATION (V2.0 PROD)
-- Run this in your Supabase SQL Editor to support the updated v2.0 release.
-- ============================================================================

-- STEP 1: Add new columns to profiles if they are missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expire_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- STEP 2: Update check constraint on public.profiles for subscription tiers
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('trial', 'free', 'premium_monthly', 'premium_lifetime'));

-- STEP 3: Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium_monthly', 'premium_lifetime')),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  payment_id TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'cashfree' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to read own subscriptions" ON public.subscriptions;
CREATE POLICY "Allow users to read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- STEP 4: Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  plan_type TEXT NOT NULL,
  payment_id TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'cashfree' NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  raw_response JSONB
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to view own payment history" ON public.payment_history;
CREATE POLICY "Allow users to view own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- STEP 5: Create weekly_wrapped table
CREATE TABLE IF NOT EXISTS public.weekly_wrapped (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  spent NUMERIC(12,2) NOT NULL,
  saved NUMERIC(12,2) NOT NULL,
  money_score INTEGER NOT NULL,
  top_category TEXT NOT NULL,
  best_spending_day TEXT NOT NULL,
  highest_spending_day TEXT NOT NULL,
  biggest_purchase TEXT NOT NULL,
  longest_saving_streak INTEGER NOT NULL,
  weekly_mood TEXT NOT NULL,
  ai_advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, week_number, year)
);
ALTER TABLE public.weekly_wrapped ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage own weekly wrapped" ON public.weekly_wrapped;
CREATE POLICY "Allow users to manage own weekly wrapped" ON public.weekly_wrapped FOR ALL USING (auth.uid() = user_id);

-- STEP 6: Create daily_limits table
CREATE TABLE IF NOT EXISTS public.daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.daily_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage own daily limits" ON public.daily_limits;
CREATE POLICY "Allow users to manage own daily limits" ON public.daily_limits FOR ALL USING (auth.uid() = user_id);

-- STEP 7: Create device_sessions table
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage own device sessions" ON public.device_sessions;
CREATE POLICY "Allow users to manage own device sessions" ON public.device_sessions FOR ALL USING (auth.uid() = user_id);

-- STEP 8: Create trial_settings table
CREATE TABLE IF NOT EXISTS public.trial_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  trial_enabled BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 7,
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  trial_status TEXT DEFAULT 'active'
);
ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to read own trial settings" ON public.trial_settings;
CREATE POLICY "Allow users to read own trial settings" ON public.trial_settings FOR SELECT USING (auth.uid() = user_id);

-- STEP 9: Create app_versions table
CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latest_version TEXT NOT NULL,
  minimum_version TEXT NOT NULL,
  update_url TEXT,
  force_update BOOLEAN DEFAULT false,
  release_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anyone to read app versions" ON public.app_versions;
CREATE POLICY "Allow anyone to read app versions" ON public.app_versions FOR SELECT USING (true);

-- Insert initial version record
INSERT INTO public.app_versions (latest_version, minimum_version, update_url, force_update, release_notes)
VALUES ('1.0.0', '1.0.0', 'https://zenbudget-tracker.netlify.app/zenbudget.apk', false, 'Initial release of ZenBudget.')
ON CONFLICT DO NOTHING;

-- STEP 10: Create ai_predictions table
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spending_speed TEXT,
  budget_finish_date TEXT,
  monthly_savings NUMERIC(12,2),
  overspending_risk TEXT,
  emergency_warning TEXT,
  future_expenses TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to manage own predictions" ON public.ai_predictions;
CREATE POLICY "Allow users to manage own predictions" ON public.ai_predictions FOR ALL USING (auth.uid() = user_id);

-- STEP 11: Fix RLS policies on profiles, transactions, and budgets to check for premium_monthly or premium_lifetime tiers
DROP POLICY IF EXISTS "Allow premium partners to view transactions" ON public.transactions;
CREATE POLICY "Allow premium partners to view transactions" 
  ON public.transactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles my_prof
      JOIN public.profiles partner_prof 
        ON partner_prof.referral_code = my_prof.referred_by 
        OR my_prof.referral_code = partner_prof.referred_by
      WHERE my_prof.id = auth.uid() 
        AND partner_prof.id = transactions.user_id
        AND my_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
        AND partner_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
    )
  );

DROP POLICY IF EXISTS "Allow premium partners to view budgets" ON public.budgets;
CREATE POLICY "Allow premium partners to view budgets" 
  ON public.budgets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles my_prof
      JOIN public.profiles partner_prof 
        ON partner_prof.referral_code = my_prof.referred_by 
        OR my_prof.referral_code = partner_prof.referred_by
      WHERE my_prof.id = auth.uid() 
        AND partner_prof.id = budgets.user_id
        AND my_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
        AND partner_prof.subscription_tier IN ('premium_monthly', 'premium_lifetime')
    )
  );

-- Create a policy allowing anyone to search profiles by referral_code (critical for couple sync lookup)
DROP POLICY IF EXISTS "lookup_by_referral_code" ON public.profiles;
CREATE POLICY "lookup_by_referral_code" ON public.profiles FOR SELECT USING (true);
