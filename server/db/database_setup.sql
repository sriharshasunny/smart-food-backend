-- Advance Food Recommendation Schema Setup
-- Run these in your Supabase SQL Editor

-- 1. User Activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- view, click, cart, order
    weight INT DEFAULT 1,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Preferences (Summarized Profile)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    category_scores JSONB DEFAULT '{}', -- e.g., {"indian": 20, "chinese": 5}
    veg_score INT DEFAULT 0, -- Positive number prefers veg, negative prefers non-veg
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recommendation History Cache
CREATE TABLE IF NOT EXISTS public.recommendation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We can clear recommendation_history occasionally using pg_cron or node scripts 
-- to reset sessions.

-- Optional: Create Indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_date ON public.recommendation_history(user_id, created_at DESC);
