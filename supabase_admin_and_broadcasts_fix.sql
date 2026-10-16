-- =========================================================================
-- 🚀 ZenBudget Admin Panel & Broadcast Notifications 1-Click Fix
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Create Broadcast Notifications Table (For Admin Announcements / Popups)
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link_url TEXT,
    button_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS and grant full permissive access
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access broadcast_notifications" ON public.broadcast_notifications;
CREATE POLICY "Public full access broadcast_notifications" 
    ON public.broadcast_notifications 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Enable Supabase Realtime for instant notification popups on user phones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'broadcast_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_notifications;
    END IF;
END $$;


-- 2. Ensure Profiles Table has Admin Control Columns (Suspension, FCM Push, Access)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_scan_pay_access BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;


-- 3. Create App Config Table (For Live Pricing, Global Flags, Social Links)
CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access app_config" ON public.app_config;
CREATE POLICY "Public full access app_config" 
    ON public.app_config 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);


-- 4. Create Social Links Table (Admin configurable community links)
CREATE TABLE IF NOT EXISTS public.social_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access social_links" ON public.social_links;
CREATE POLICY "Public full access social_links" 
    ON public.social_links 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);


-- 5. Create Slot Purchases & Payment History Tables (Financial Tracking)
CREATE TABLE IF NOT EXISTS public.slot_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    slot_number INTEGER DEFAULT 1,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.slot_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access slot_purchases" ON public.slot_purchases;
CREATE POLICY "Public full access slot_purchases" 
    ON public.slot_purchases 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    order_id TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'success',
    plan_type TEXT DEFAULT 'pro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access payment_history" ON public.payment_history;
CREATE POLICY "Public full access payment_history" 
    ON public.payment_history 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);


-- 6. Create AI Feedback & Review Tables
CREATE TABLE IF NOT EXISTS public.ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    prompt TEXT,
    response TEXT,
    rating INTEGER,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access ai_reviews" ON public.ai_reviews;
CREATE POLICY "Public full access ai_reviews" 
    ON public.ai_reviews 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);


-- 7. Secure Admin RPC: Delete User from auth.users (When Admin deletes user)
CREATE OR REPLACE FUNCTION public.delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.delete_auth_user(UUID) TO anon, authenticated, service_role;

-- Success Confirmation
SELECT 'ZenBudget Admin & Broadcast Schema successfully applied!' AS status;
