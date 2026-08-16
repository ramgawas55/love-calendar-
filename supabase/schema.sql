-- ============================================================
-- Our Love Calendar — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'My Love',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Relationships (the "couple" entity)
CREATE TABLE IF NOT EXISTS relationships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Our Story',
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  invite_token TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Relationship members (join between profiles and relationships, max 2)
CREATE TABLE IF NOT EXISTS relationship_members (
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (relationship_id, user_id)
);

-- 4. Memories
CREATE TABLE IF NOT EXISTS memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  memory_date     DATE NOT NULL,
  location_name   TEXT,
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  song_title      TEXT,
  song_artist     TEXT,
  song_url        TEXT,
  mood            TEXT CHECK (mood IN ('happy','romantic','adventurous','nostalgic','silly','bittersweet')),
  is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Memory media
CREATE TABLE IF NOT EXISTS memory_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id    UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL DEFAULT 'image/webp',
  size_bytes   INT,
  width        INT,
  height       INT,
  is_cover     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tags
CREATE TABLE IF NOT EXISTS tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  color           TEXT DEFAULT '#C84B4B',
  UNIQUE (relationship_id, name)
);

-- 7. Memory ↔ Tag join
CREATE TABLE IF NOT EXISTS memory_tag_map (
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, tag_id)
);

-- 8. Milestones / special dates
CREATE TABLE IF NOT EXISTS milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  milestone_date  DATE NOT NULL,
  icon            TEXT DEFAULT '✨',
  photo_path      TEXT,
  location_name   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Relationship settings (1-to-1 extension)
CREATE TABLE IF NOT EXISTS relationship_settings (
  relationship_id  UUID PRIMARY KEY REFERENCES relationships(id) ON DELETE CASCADE,
  theme            TEXT DEFAULT 'dark',
  cover_photo_path TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memories_relationship ON memories(relationship_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_memories_created_by ON memories(created_by);
CREATE INDEX IF NOT EXISTS idx_media_memory ON memory_media(memory_id);
CREATE INDEX IF NOT EXISTS idx_media_sort ON memory_media(memory_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_tags_relationship ON tags(relationship_id);
CREATE INDEX IF NOT EXISTS idx_rel_members_user ON relationship_members(user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Love'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- UPDATE updated_at ON MEMORY CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- HELPER FUNCTION — returns relationship IDs for current user
-- ============================================================

CREATE OR REPLACE FUNCTION my_relationship_ids()
RETURNS SETOF UUID AS $$
  SELECT relationship_id
  FROM   relationship_members
  WHERE  user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships         ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tag_map        ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_settings ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "view own or partner profile" ON profiles FOR SELECT USING (
  id = auth.uid() OR
  id IN (SELECT user_id FROM relationship_members WHERE relationship_id IN (SELECT my_relationship_ids()))
);
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- relationships
CREATE POLICY "members can view relationship" ON relationships FOR SELECT USING (
  id IN (SELECT my_relationship_ids())
);
CREATE POLICY "members can update relationship" ON relationships FOR UPDATE USING (
  id IN (SELECT my_relationship_ids())
);
CREATE POLICY "authenticated can create relationship" ON relationships FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
-- allow viewing by invite token (for join flow) — any authenticated user can check
CREATE POLICY "check invite token" ON relationships FOR SELECT USING (invite_token IS NOT NULL);

-- relationship_members
CREATE POLICY "view own membership" ON relationship_members FOR SELECT USING (
  relationship_id IN (SELECT my_relationship_ids()) OR user_id = auth.uid()
);
CREATE POLICY "insert own membership" ON relationship_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- memories
CREATE POLICY "members can CRUD memories" ON memories FOR ALL USING (
  relationship_id IN (SELECT my_relationship_ids())
) WITH CHECK (
  relationship_id IN (SELECT my_relationship_ids())
);

-- memory_media
CREATE POLICY "members can access media" ON memory_media FOR ALL USING (
  memory_id IN (SELECT id FROM memories WHERE relationship_id IN (SELECT my_relationship_ids()))
) WITH CHECK (
  memory_id IN (SELECT id FROM memories WHERE relationship_id IN (SELECT my_relationship_ids()))
);

-- tags
CREATE POLICY "members can CRUD tags" ON tags FOR ALL USING (
  relationship_id IN (SELECT my_relationship_ids())
) WITH CHECK (
  relationship_id IN (SELECT my_relationship_ids())
);

-- memory_tag_map
CREATE POLICY "members can access tag map" ON memory_tag_map FOR ALL USING (
  memory_id IN (SELECT id FROM memories WHERE relationship_id IN (SELECT my_relationship_ids()))
);

-- milestones
CREATE POLICY "members can CRUD milestones" ON milestones FOR ALL USING (
  relationship_id IN (SELECT my_relationship_ids())
) WITH CHECK (
  relationship_id IN (SELECT my_relationship_ids())
);

-- relationship_settings
CREATE POLICY "members can access settings" ON relationship_settings FOR ALL USING (
  relationship_id IN (SELECT my_relationship_ids())
) WITH CHECK (
  relationship_id IN (SELECT my_relationship_ids())
);

-- ============================================================
-- STORAGE BUCKET SETUP (run separately or via Supabase dashboard)
-- ============================================================
-- 1. Create bucket named "memories" with public=false
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', false);

-- Storage policies (applied to storage.objects):
-- CREATE POLICY "members read own files" ON storage.objects FOR SELECT USING (
--   bucket_id = 'memories' AND auth.uid() IS NOT NULL AND
--   (storage.foldername(name))[1] IN (SELECT my_relationship_ids()::TEXT)
-- );
-- CREATE POLICY "members write own files" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'memories' AND auth.uid() IS NOT NULL AND
--   (storage.foldername(name))[1]::UUID IN (SELECT my_relationship_ids())
-- );
-- CREATE POLICY "members delete own files" ON storage.objects FOR DELETE USING (
--   bucket_id = 'memories' AND auth.uid() IS NOT NULL AND
--   (storage.foldername(name))[1]::UUID IN (SELECT my_relationship_ids())
-- );
