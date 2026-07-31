-- ============================================================
--  ZENBUDGET SUPABASE MIGRATION (FINAL FIXED VERSION)
--  Run in Supabase SQL Editor → Run
-- ============================================================

-- STEP 1: Add subscription_tier column (if missing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';

-- STEP 2: Add all other required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expire_date  TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin                TEXT DEFAULT '0000';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name               TEXT DEFAULT 'User';

-- STEP 3: Fix subscription_tier values
UPDATE public.profiles SET subscription_tier = 'trial'           WHERE subscription_tier IS NULL;
UPDATE public.profiles SET subscription_tier = 'premium_monthly' WHERE subscription_tier = 'premium';

-- STEP 4: Drop old constraint and add new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'premium_monthly', 'premium_lifetime'));

-- STEP 5: Auto-fill trial_expire_date (7 days from now for existing trial users)
UPDATE public.profiles
  SET trial_expire_date = NOW() + INTERVAL '7 days'
  WHERE subscription_tier = 'trial'
    AND trial_expire_date IS NULL;

-- STEP 6: Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  utr_number  TEXT    UNIQUE NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  status      TEXT    DEFAULT 'unused',
  plan_type   TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_type TEXT;

-- STEP 7: Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='view_own_profile') THEN
    CREATE POLICY "view_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='update_own_profile') THEN
    CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='insert_own_profile') THEN
    CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='lookup_by_referral_code') THEN
    CREATE POLICY "lookup_by_referral_code" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- STEP 8: Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payments' AND policyname='read_payments') THEN
    CREATE POLICY "read_payments" ON public.payments FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- DONE: All columns and constraints are now set correctly.
