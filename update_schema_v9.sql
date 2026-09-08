-- Zen AI Coach V2.0 Memory & Feedback Architecture

-- 1. AI Preferences (Memory)
CREATE TABLE IF NOT EXISTS public.ai_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ai_language TEXT DEFAULT 'Auto Detect',
    roast_mode_enabled BOOLEAN DEFAULT false,
    strict_reminders BOOLEAN DEFAULT false,
    saved_context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. AI Message Feedback (Thumbs up/down per message)
CREATE TABLE IF NOT EXISTS public.ai_message_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    conversation_id TEXT,
    feedback TEXT NOT NULL CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
    reason TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI Reviews (Overall Coach Rating)
CREATE TABLE IF NOT EXISTS public.ai_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    app_version TEXT,
    platform TEXT,
    language TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ai_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their AI preferences" ON public.ai_preferences FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.ai_message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert feedback" ON public.ai_message_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.ai_message_feedback FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert reviews" ON public.ai_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON public.ai_reviews FOR SELECT USING (auth.uid() = user_id);
