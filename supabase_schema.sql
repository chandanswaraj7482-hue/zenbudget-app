-- WEALTHGENZ DATABASE SCHEMA (SUPABASE)
-- Copy-paste this SQL schema into your Supabase SQL Editor.

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  pin VARCHAR(4) NOT NULL,
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'premium')),
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  device_id TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS profiles_device_id_idx ON public.profiles(device_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

-- Profiles Policies
CREATE POLICY "Allow users to view own profile" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow users to update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop transactions policies
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow premium partners to view transactions" ON public.transactions;

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions" 
  ON public.transactions FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
        AND my_prof.subscription_tier = 'premium'
        AND partner_prof.subscription_tier = 'premium'
    )
  );

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount >= 0),
  UNIQUE (user_id, category)
);

-- Enable RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Drop budgets policies
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow premium partners to view budgets" ON public.budgets;

-- Budgets Policies
CREATE POLICY "Users can manage their own budgets" 
  ON public.budgets FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
        AND my_prof.subscription_tier = 'premium'
        AND partner_prof.subscription_tier = 'premium'
    )
  );

-- Create trigger to automatically update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create payments table for UTR validation
CREATE TABLE IF NOT EXISTS public.payments (
  utr_number VARCHAR(12) PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view payments (to verify their UTR)
DROP POLICY IF EXISTS "Allow users to select payments" ON public.payments;
CREATE POLICY "Allow users to select payments"
  ON public.payments FOR SELECT
  USING (true);

-- Allow authenticated users to update payment status to 'used'
DROP POLICY IF EXISTS "Allow users to update payment status" ON public.payments;
CREATE POLICY "Allow users to update payment status"
  ON public.payments FOR UPDATE
  USING (true);

