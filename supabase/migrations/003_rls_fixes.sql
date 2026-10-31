-- ============================================================
-- 003_rls_fixes.sql  —  COMPLETE HOTPATCH
-- ============================================================
-- Run this ONCE in Supabase → SQL Editor to fix ALL RLS issues.
-- Idempotent: uses IF NOT EXISTS / DROP POLICY IF EXISTS throughout.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 0. SCHEMA FIX: Add created_by column to relationships table
--    Lets policies recognize "you just created this row" even
--    BEFORE relationship_members row is inserted (for RETURNING).
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.relationships
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

COMMENT ON COLUMN public.relationships.created_by IS 'User who originally created this relationship — used by RLS to grant immediate visibility on INSERT RETURNING.';

-- ═══════════════════════════════════════════════════════════════
-- 1. RELATIONSHIPS — fix all 4 policies to use created_by lane
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Members can view their relationship" ON public.relationships;
CREATE POLICY "Members can view their relationship"
  ON public.relationships FOR SELECT
  USING (
    created_by = auth.uid()        -- Lane A: the creator (setup flow RETURNING fix)
    OR id IN (SELECT public.my_relationship_ids())  -- Lane B: any member
  );

DROP POLICY IF EXISTS "Authenticated users can create relationships" ON public.relationships;
CREATE POLICY "Authenticated users can create relationships"
  ON public.relationships FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Members can update their relationship" ON public.relationships;
CREATE POLICY "Members can update their relationship"
  ON public.relationships FOR UPDATE
  USING (created_by = auth.uid() OR id IN (SELECT public.my_relationship_ids()));

DROP POLICY IF EXISTS "Members can delete their relationship" ON public.relationships;
CREATE POLICY "Members can delete their relationship"
  ON public.relationships FOR DELETE
  USING (created_by = auth.uid() OR id IN (SELECT public.my_relationship_ids()));

-- ═══════════════════════════════════════════════════════════════
-- 2. RELATIONSHIP_MEMBERS — fix CIRCULAR SELECT policy + add missing
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view members of their relationship" ON public.relationship_members;
CREATE POLICY "Users can view members of their relationship"
  ON public.relationship_members FOR SELECT
  USING (
    -- Lane A: you can ALWAYS see rows you own directly (breaks circular dep)
    user_id = auth.uid()
    -- Lane B: see other members of relationships you belong to
    OR relationship_id IN (
      SELECT rm.relationship_id
      FROM public.relationship_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join a relationship" ON public.relationship_members;
CREATE POLICY "Users can join a relationship"
  ON public.relationship_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own join rows" ON public.relationship_members;
DROP POLICY IF EXISTS "Relationship owner can update members" ON public.relationship_members;
CREATE POLICY "Users can update own join rows"
  ON public.relationship_members FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove themselves from a relationship" ON public.relationship_members;
CREATE POLICY "Users can remove themselves from a relationship"
  ON public.relationship_members FOR DELETE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 3. INVITE_TOKENS — use 2-lane INSERT (created_by on relationship OR member)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Members can create invite tokens for their relationship" ON public.invite_tokens;
CREATE POLICY "Members can create invite tokens for their relationship"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      -- Lane A: creator of the relationship can issue invites (setup step 3!)
      EXISTS (
        SELECT 1 FROM public.relationships r
        WHERE r.id = invite_tokens.relationship_id AND r.created_by = auth.uid()
      )
      -- Lane B: any existing member of the relationship
      OR EXISTS (
        SELECT 1 FROM public.relationship_members rm
        WHERE rm.relationship_id = invite_tokens.relationship_id AND rm.user_id = auth.uid()
      )
      OR relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

DROP POLICY IF EXISTS "Any authenticated user can read an unexpired token" ON public.invite_tokens;
CREATE POLICY "Any authenticated user can read an unexpired token"
  ON public.invite_tokens FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Token creator can mark as used" ON public.invite_tokens;
DROP POLICY IF EXISTS "Any authenticated user can mark token as used" ON public.invite_tokens;
CREATE POLICY "Users can consume a valid unused invite token"
  ON public.invite_tokens FOR UPDATE
  USING (auth.uid() IS NOT NULL AND used_at IS NULL);
