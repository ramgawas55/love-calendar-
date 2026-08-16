-- ============================================================
-- 002_rls.sql
-- Our Love Calendar — Row Level Security policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- ── Helper: returns relationship IDs for the current user ──────
CREATE OR REPLACE FUNCTION public.my_relationship_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT relationship_id FROM public.relationship_members WHERE user_id = auth.uid();
$$;

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

CREATE POLICY "Token creator can mark as used"
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

-- =====================================================
-- STORAGE RLS (run AFTER creating the 'memories' bucket)
-- =====================================================
-- In Supabase dashboard: Storage → Create bucket 'memories' (NOT public)
-- Then run these policies:

-- INSERT (upload)
CREATE POLICY "Authenticated members can upload to their relationship folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
    OR (storage.foldername(name))[1] = 'avatars'
  );

-- SELECT (download)
CREATE POLICY "Authenticated members can download their files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
      OR (storage.foldername(name))[1] = 'avatars'
    )
  );

-- DELETE
CREATE POLICY "Authenticated members can delete their files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memories' AND
    auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1]::UUID IN (SELECT public.my_relationship_ids())
      OR (storage.foldername(name))[1] = 'avatars'
    )
  );
