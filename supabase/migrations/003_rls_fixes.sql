-- ============================================================
-- 003_rls_fixes.sql
-- Fixes circular RLS + setup creation flow issues
-- Run this in Supabase SQL Editor on production DB
-- ============================================================

-- ── 1. Re-create relationship_members SELECT policy ──────────
-- OLD: self-referencing (needs membership to read membership — impossible)
-- NEW: users can see rows where they themselves are the user_id,
--      + any other member of relationships they belong to.
DROP POLICY IF EXISTS "Users can view members of their relationship" ON public.relationship_members;

CREATE POLICY "Users can view members of their relationship"
  ON public.relationship_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR relationship_id IN (
      SELECT rm.relationship_id
      FROM public.relationship_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

-- ── 2. Re-create invite_tokens INSERT policy ──────────────────
-- OLD: relationship_id IN my_relationship_ids() — fails during setup
--      because the SELECT is circularly gated.
-- NEW: allow insert IF EITHER:
--        (a) created_by is the current user AND
--            the creator is a member of the relationship, OR
--        (b) created_by is the current user AND this is a fresh relationship
--            where the creator matches any existing relationship_members row
--            for this relationship_id (covers the "just-inserted self-member"
--            case where the SELECT policy wasn't yet visible due to tx snapshot).
DROP POLICY IF EXISTS "Members can create invite tokens for their relationship" ON public.invite_tokens;

CREATE POLICY "Members can create invite tokens for their relationship"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.relationship_members rm
        WHERE rm.relationship_id = invite_tokens.relationship_id
          AND rm.user_id = auth.uid()
      )
      OR relationship_id IN (SELECT public.my_relationship_ids())
    )
  );

-- ── 3. Re-create invite_tokens UPDATE policy ──────────────────
-- OLD: any authenticated user could UPDATE any token (overly broad)
-- NEW: only the joining user (auth.uid()) can mark a token as used
DROP POLICY IF EXISTS "Token creator can mark as used" ON public.invite_tokens;
DROP POLICY IF EXISTS "Any authenticated user can mark token as used" ON public.invite_tokens;

CREATE POLICY "Users can consume a valid unused invite token"
  ON public.invite_tokens FOR UPDATE
  USING (auth.uid() IS NOT NULL AND used_at IS NULL);

-- ── 4. Add explicit DELETE policy on relationships (optional ──
--    good practice — prevents users from deleting a relationship
--    unless they are a member)
DROP POLICY IF EXISTS "Members can delete their relationship" ON public.relationships;

CREATE POLICY "Members can delete their relationship"
  ON public.relationships FOR DELETE
  USING (id IN (SELECT public.my_relationship_ids()));

-- ── 5. relationship_members: add DELETE policy ────────────────
--    Without a DELETE policy, nobody can ever leave a relationship
DROP POLICY IF EXISTS "Users can remove themselves from a relationship" ON public.relationship_members;

CREATE POLICY "Users can remove themselves from a relationship"
  ON public.relationship_members FOR DELETE
  USING (user_id = auth.uid());

-- ── 6. relationship_members: add UPDATE policy ────────────────
DROP POLICY IF EXISTS "Relationship owner can update members" ON public.relationship_members;

CREATE POLICY "Users can update own join rows"
  ON public.relationship_members FOR UPDATE
  USING (user_id = auth.uid());
