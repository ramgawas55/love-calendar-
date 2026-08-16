-- ============================================================
-- 001_schema.sql
-- Our Love Calendar — complete database schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Profiles (extend auth.users) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT 'Someone Special',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Relationships ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT 'Our Story',
  started_at  DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Relationship Members (max 2) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.relationship_members (
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (relationship_id, user_id)
);

-- ── Invite Tokens (for User 2 to join) ────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  token           TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(32), 'base64url'),
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  used_at         TIMESTAMPTZ
);

-- ── Memories ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  description     TEXT CHECK (char_length(description) <= 5000),
  memory_date     DATE NOT NULL,
  location_name   TEXT CHECK (char_length(location_name) <= 200),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  song_title      TEXT CHECK (char_length(song_title) <= 200),
  song_artist     TEXT CHECK (char_length(song_artist) <= 200),
  song_url        TEXT CHECK (char_length(song_url) <= 500),
  mood            TEXT CHECK (mood IN ('happy','romantic','adventurous','nostalgic','silly','bittersweet')),
  is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_relationship ON public.memories(relationship_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON public.memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON public.memories(relationship_id, is_favorite) WHERE is_favorite = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS touch_memories_updated_at ON public.memories;
CREATE TRIGGER touch_memories_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Memory Media ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id     UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    INT,
  width         INT,
  height        INT,
  is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT max_size CHECK (size_bytes IS NULL OR size_bytes <= 10485760) -- 10 MB max
);

CREATE INDEX IF NOT EXISTS idx_media_memory ON public.memory_media(memory_id, sort_order);

-- ── Tags ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) <= 50),
  color           TEXT NOT NULL DEFAULT '#C84B4B',
  UNIQUE (relationship_id, name)
);

CREATE TABLE IF NOT EXISTS public.memory_tag_map (
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, tag_id)
);

-- ── Milestones ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  description     TEXT CHECK (char_length(description) <= 2000),
  milestone_date  DATE NOT NULL,
  icon            TEXT NOT NULL DEFAULT '✨',
  photo_path      TEXT,
  location_name   TEXT CHECK (char_length(location_name) <= 200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_date ON public.milestones(relationship_id, milestone_date);

-- ── Relationship Settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relationship_settings (
  relationship_id   UUID PRIMARY KEY REFERENCES public.relationships(id) ON DELETE CASCADE,
  theme             TEXT NOT NULL DEFAULT 'dark',
  cover_photo_path  TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
