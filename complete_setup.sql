-- =========================================================
-- ZenBudget Master Supabase Production SQL Script
-- Copy and paste this script directly into Supabase SQL Editor
-- =========================================================

-- 1. PROFILES TABLE UPDATES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expire_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS couple_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_budget_slots INTEGER DEFAULT 0;

-- 2. APP CONFIG TABLE (For Admin Multi-Currency & Pricing Control)
CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROMO COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.promo_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC NOT NULL,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    target_email TEXT,
    target_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.promo_coupons ADD COLUMN IF NOT EXISTS target_email TEXT;
ALTER TABLE public.promo_coupons ADD COLUMN IF NOT EXISTS target_plan TEXT;

-- 4. BROADCAST NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DAILY LIMITS TABLE
CREATE TABLE IF NOT EXISTS public.daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    limit_amount NUMERIC NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT daily_limits_user_id_key UNIQUE (user_id)
);

-- 6. RLS PERMISSIONS SETUP
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_limits DISABLE ROW LEVEL SECURITY;
