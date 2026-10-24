-- =========================================================================
-- 🚀 ZenBudget: Admin Panel, Realtime Sync & Landing Assets Setup
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- (100% Safe to run multiple times / Idempotent)
-- =========================================================================

-- 1. App Settings Table (Used by Admin Panel for Landing Page Assets & Dynamic Images)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access app_settings" ON public.app_settings;
CREATE POLICY "Public full access app_settings" 
    ON public.app_settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 2. App Config Table (Used for Realtime Social Links, Live Pricing & Feature Flags)
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

-- 3. Social Links Table (Custom Social Community Links)
CREATE TABLE IF NOT EXISTS public.social_links (
    platform TEXT PRIMARY KEY,
    url TEXT NOT NULL DEFAULT '',
    icon TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    handle_name TEXT DEFAULT 'Something Labs',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was previously created with different schema
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '';
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS handle_name TEXT DEFAULT 'Something Labs';
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access social_links" ON public.social_links;
CREATE POLICY "Public full access social_links" 
    ON public.social_links 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 4. Broadcast Notifications Table (Instant In-App Popups & Announcements)
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link_url TEXT,
    button_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS button_text TEXT;
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access broadcast_notifications" ON public.broadcast_notifications;
CREATE POLICY "Public full access broadcast_notifications" 
    ON public.broadcast_notifications 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Profiles Table: Admin Management Columns (Suspension, Push, Subscription Tier)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_scan_pay_access BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- 6. AI Reviews & Feedback Table
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

-- 7. Enable Supabase Realtime for instant sync across devices
DO $$
BEGIN
    -- Add broadcast_notifications to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'broadcast_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_notifications;
    END IF;

    -- Add app_config to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_config'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
    END IF;

    -- Add app_settings to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
    END IF;

    -- Add profiles to realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

-- 8. Admin RPC: Delete User Function (When Admin clicks Delete User)
CREATE OR REPLACE FUNCTION public.delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_auth_user(UUID) TO anon, authenticated, service_role;

-- 9. Confirmation
SELECT '✅ All ZenBudget Admin, Realtime, and App Settings tables are successfully created and ready!' AS status;
