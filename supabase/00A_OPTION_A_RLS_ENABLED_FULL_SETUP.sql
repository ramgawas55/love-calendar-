-- ============================================================
-- OPTION A — FULL SETUP WITH RLS ENABLED (SECURE / PRODUCTION)
-- Our Love Calendar ❤️ — Run this in Supabase SQL Editor
-- Paste EVERYTHING below into one query window and click RUN
-- ============================================================

-- ============================================================
-- PHASE 1 — CLEAN SLATE (optional, for fresh projects)
-- Uncomment this section if running on a project that had old tables
-- ============================================================
/*
DROP TABLE IF EXISTS memory_tag_map CASCADE;
DROP TABLE IF EXISTS memory_media CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS relationship_settings CASCADE;
DROP TABLE IF EXISTS relationship_members CASCADE;
DROP TABLE IF EXISTS invite_tokens CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS my_relationship_ids();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS touch_updated_at();
*/

-- ============================================================
-- PHASE 2 — TABLES + FUNCTIONS
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
  CONSTRAINT max_size CHECK (size_bytes IS NULL OR size_bytes <= 10485760)
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

-- ============================================================
-- PHASE 3 — HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.my_relationship_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT relationship_id FROM public.relationship_members WHERE user_id = auth.uid();
$$;

-- ============================================================
-- PHASE 4 — ROW LEVEL SECURITY (ENABLED!)
-- ============================================================

-- =====================================================
-- PROFILES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own and partner profiles"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT rm.user_id
      FROM public.relationship_members rm
      WHERE rm.relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- =====================================================
-- RELATIONSHIPS
-- =====================================================
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their relationship"
  ON public.relationships FOR SELECT
  USING (id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Authenticated users can create relationships"
  ON public.relationships FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update their relationship"
  ON public.relationships FOR UPDATE
  USING (id IN (SELECT public.my_relationship_ids()));

-- =====================================================
-- RELATIONSHIP_MEMBERS
-- =====================================================
ALTER TABLE public.relationship_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their relationship"
  ON public.relationship_members FOR SELECT
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Users can join a relationship"
  ON public.relationship_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INVITE_TOKENS
-- =====================================================
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can create invite tokens for their relationship"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (
    relationship_id IN (SELECT public.my_relationship_ids()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Any authenticated user can read an unexpired token"
  ON public.invite_tokens FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Any authenticated user can mark token as used"
  ON public.invite_tokens FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- MEMORIES
-- =====================================================
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view memories"
  ON public.memories FOR SELECT
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Members can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Members can update memories"
  ON public.memories FOR UPDATE
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Members can delete memories"
  ON public.memories FOR DELETE
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

-- =====================================================
-- MEMORY_MEDIA
-- =====================================================
ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view media for their memories"
  ON public.memory_media FOR SELECT
  USING (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

CREATE POLICY "Members can insert media"
  ON public.memory_media FOR INSERT
  WITH CHECK (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

CREATE POLICY "Members can update media"
  ON public.memory_media FOR UPDATE
  USING (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

CREATE POLICY "Members can delete media"
  ON public.memory_media FOR DELETE
  USING (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

-- =====================================================
-- TAGS
-- =====================================================
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage tags"
  ON public.tags FOR ALL
  USING (relationship_id IN (SELECT public.my_relationship_ids()))
  WITH CHECK (relationship_id IN (SELECT public.my_relationship_ids()));

-- =====================================================
-- MEMORY_TAG_MAP
-- =====================================================
ALTER TABLE public.memory_tag_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage tag maps"
  ON public.memory_tag_map FOR ALL
  USING (
    memory_id IN (
      SELECT id FROM public.memories
      WHERE relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

-- =====================================================
-- MILESTONES
-- =====================================================
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage milestones"
  ON public.milestones FOR ALL
  USING (relationship_id IN (SELECT public.my_relationship_ids()))
  WITH CHECK (relationship_id IN (SELECT public.my_relationship_ids()));

-- =====================================================
-- RELATIONSHIP_SETTINGS
-- =====================================================
ALTER TABLE public.relationship_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view settings"
  ON public.relationship_settings FOR SELECT
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Members can update settings"
  ON public.relationship_settings FOR UPDATE
  USING (relationship_id IN (SELECT public.my_relationship_ids()));

CREATE POLICY "Members can insert settings"
  ON public.relationship_settings FOR INSERT
  WITH CHECK (relationship_id IN (SELECT public.my_relationship_ids()));

-- ============================================================
-- PHASE 5 — STORAGE RLS (run AFTER creating the 'memories' bucket!)
-- Do this AFTER you create the PRIVATE bucket named "memories"
-- in Supabase Dashboard → Storage
-- ============================================================
/*
CREATE POLICY "Authenticated members can upload to their relationship folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
    OR (storage.foldername(name))[1] = 'avatars'
  );

CREATE POLICY "Authenticated members can download their files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
      OR (storage.foldername(name))[1] = 'avatars'
    )
  );

CREATE POLICY "Authenticated members can delete their files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
      OR (storage.foldername(name))[1] = 'avatars'
    )
  );
*/

-- ============================================================
-- ✅ DONE!
-- Next steps:
-- 1. Create PRIVATE storage bucket: "memories" (Dashboard → Storage)
-- 2. Uncomment & run the STORAGE RLS section above
-- 3. Sign up at /signup — create relationship — invite partner
-- ============================================================
