-- ========================================================
-- 🌿 ZenBudget Complete Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    pin TEXT DEFAULT '1234',
    subscription_tier TEXT DEFAULT 'trial',
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    premium_expires_at TIMESTAMPTZ,
    trial_expire_date TIMESTAMPTZ,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    has_scan_pay_access BOOLEAN DEFAULT FALSE,
    partner_couple_code TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORY BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    "limit" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- 4. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) DEFAULT 0,
    deadline_months INT DEFAULT 6,
    color TEXT DEFAULT '#22c55e',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACCOUNTS & WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'bank',
    balance NUMERIC(12, 2) DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'wallet',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LOANS / DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('borrowed', 'lent')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'settled')) DEFAULT 'active',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SOCIAL LINKS TABLE
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Social Links
INSERT INTO public.social_links (platform, url, icon, color, is_active)
VALUES 
  ('Instagram', 'https://www.instagram.com/zenbudget_tracker/', '📸', '#e1306c', true),
  ('Facebook', 'https://www.facebook.com/people/ZenBudget/61592667931013/', '👥', '#1877f2', true),
  ('YouTube', 'https://www.youtube.com/channel/UCa2ewl3C6Q3qGTXjbAMeAtA', '▶️', '#ff0000', true),
  ('TikTok', 'https://www.tiktok.com/@zenbudget_tracker?lang=en-GB', '🎵', '#00f2fe', true)
ON CONFLICT DO NOTHING;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Allow users full access to their own data
CREATE POLICY "Public Read/Write Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Read/Write Transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Public Read/Write Budgets" ON public.budgets FOR ALL USING (true);
CREATE POLICY "Public Read/Write Goals" ON public.goals FOR ALL USING (true);
CREATE POLICY "Public Read/Write Accounts" ON public.accounts FOR ALL USING (true);
CREATE POLICY "Public Read/Write Loans" ON public.loans FOR ALL USING (true);
CREATE POLICY "Public Read Social Links" ON public.social_links FOR SELECT USING (true);
