-- ============================================================
-- SMART FOOD DELIVERY — RECOMMENDATION SYSTEM MIGRATION
-- Run once in Supabase SQL Editor
-- ============================================================

-- ─── 1. Extend 'restaurants' table ───────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS city            TEXT,
  ADD COLUMN IF NOT EXISTS location        TEXT,
  ADD COLUMN IF NOT EXISTS latitude        NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude       NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS cuisine_tags    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_tier      TEXT    DEFAULT 'medium',   -- 'budget' | 'medium' | 'premium'
  ADD COLUMN IF NOT EXISTS popularity_score NUMERIC DEFAULT 0;

-- ─── 2. Extend 'foods' table ─────────────────────────────────
ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS cuisine        TEXT,
  ADD COLUMN IF NOT EXISTS spice_level    INTEGER DEFAULT 2,           -- 1 (mild) – 5 (very hot)
  ADD COLUMN IF NOT EXISTS meal_type      TEXT    DEFAULT 'any',        -- 'breakfast'|'lunch'|'dinner'|'snack'|'any'
  ADD COLUMN IF NOT EXISTS popularity_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating         NUMERIC DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS order_count    INTEGER DEFAULT 0;            -- cumulative lifetime orders

-- ─── 3. user_activity table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        TEXT        NOT NULL,        -- can be supabase UUID or firebase UID (TEXT for flexibility)
  food_id        UUID        REFERENCES foods(id) ON DELETE SET NULL,
  restaurant_id  UUID        REFERENCES restaurants(id) ON DELETE SET NULL,
  action_type    TEXT        NOT NULL,        -- 'view'|'click'|'cart'|'order'|'wishlist'|'rate'
  action_weight  NUMERIC     NOT NULL DEFAULT 1,
  metadata       JSONB       DEFAULT '{}',    -- e.g. { price, cuisine, category, spice_level }
  session_id     TEXT,
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ─── 4. user_preferences table ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                  UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             TEXT        UNIQUE NOT NULL,
  cuisine_scores      JSONB       DEFAULT '{}',    -- { "biryani": 12.5, "pizza": 7.2 }
  category_scores     JSONB       DEFAULT '{}',    -- { "main course": 10, "dessert": 2 }
  avg_order_price     NUMERIC     DEFAULT 0,
  price_min           NUMERIC     DEFAULT 0,
  price_max           NUMERIC     DEFAULT 9999,
  veg_preference      TEXT        DEFAULT 'any',   -- 'veg'|'non_veg'|'any'
  avg_spice_level     NUMERIC     DEFAULT 2.5,
  top_restaurants     TEXT[]      DEFAULT '{}',    -- up to 5 favourite restaurant IDs
  meal_type_scores    JSONB       DEFAULT '{}',    -- { "breakfast": 3, "dinner": 8 }
  total_interactions  INTEGER     DEFAULT 0,
  last_computed_at    TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ─── 5. RLS Policies ─────────────────────────────────────────
ALTER TABLE user_activity   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow full access from service role (backend uses service key)
CREATE POLICY "Full access for service role" ON user_activity
  USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role" ON user_preferences
  USING (true) WITH CHECK (true);

-- ─── 6. Performance Indexes ──────────────────────────────────

-- user_activity
CREATE INDEX IF NOT EXISTS idx_ua_user_id       ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_ua_food_id       ON user_activity(food_id);
CREATE INDEX IF NOT EXISTS idx_ua_restaurant_id ON user_activity(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ua_action_type   ON user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_ua_created_at    ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_user_action   ON user_activity(user_id, action_type, created_at DESC);

-- user_preferences
CREATE INDEX IF NOT EXISTS idx_up_user_id ON user_preferences(user_id);

-- foods (recommendation queries)
CREATE INDEX IF NOT EXISTS idx_foods_cuisine      ON foods(cuisine);
CREATE INDEX IF NOT EXISTS idx_foods_meal_type    ON foods(meal_type);
CREATE INDEX IF NOT EXISTS idx_foods_rating       ON foods(rating DESC);
CREATE INDEX IF NOT EXISTS idx_foods_popularity   ON foods(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_foods_spice        ON foods(spice_level);
CREATE INDEX IF NOT EXISTS idx_foods_is_veg       ON foods(is_veg);

-- restaurants (location queries)
CREATE INDEX IF NOT EXISTS idx_restaurants_city         ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_popularity   ON restaurants(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_tier   ON restaurants(price_tier);

-- ─── 7. Helper: update popularity scores from activity ───────
-- Run this periodically or via cron / pg_cron
CREATE OR REPLACE FUNCTION refresh_food_popularity()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE foods f
  SET popularity_score = COALESCE(sub.score, 0)
  FROM (
    SELECT food_id,
           SUM(action_weight) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS score
    FROM user_activity
    WHERE food_id IS NOT NULL
    GROUP BY food_id
  ) sub
  WHERE f.id = sub.food_id;
END;
$$;

-- ─── 8. Force schema cache refresh ───────────────────────────
NOTIFY pgrst, 'reload schema';
