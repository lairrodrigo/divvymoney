
-- =============================================
-- STRUCTURAL FIX: Complete workspace RLS overhaul
-- =============================================

-- 1. Replace helper functions to use auth.uid() internally (no more _user_id param)
-- Keep old signatures working during transition, then drop

CREATE OR REPLACE FUNCTION public.is_workspace_member_v2(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = auth.uid()
      AND workspace_id = _workspace_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_write_role_v2(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = auth.uid()
      AND workspace_id = _workspace_id
      AND role IN ('owner', 'member', 'editor')
  );
$$;

-- 2. DROP ALL existing policies on transactions, goals, credit_cards (clean slate)

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

DROP POLICY IF EXISTS "Users can view own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;

-- 3. RECREATE all policies with aligned USING/WITH CHECK using v2 functions

-- === TRANSACTIONS ===
CREATE POLICY "tx_select" ON public.transactions FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND is_workspace_member_v2(workspace_id))
);

CREATE POLICY "tx_insert" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "tx_update" ON public.transactions FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
)
WITH CHECK (
  (workspace_id IS NULL AND auth.uid() = user_id)
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "tx_delete" ON public.transactions FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

-- === GOALS ===
CREATE POLICY "goals_select" ON public.goals FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND is_workspace_member_v2(workspace_id))
);

CREATE POLICY "goals_insert" ON public.goals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "goals_update" ON public.goals FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
)
WITH CHECK (
  (workspace_id IS NULL AND auth.uid() = user_id)
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "goals_delete" ON public.goals FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

-- === CREDIT_CARDS ===
CREATE POLICY "cards_select" ON public.credit_cards FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND is_workspace_member_v2(workspace_id))
);

CREATE POLICY "cards_insert" ON public.credit_cards FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "cards_update" ON public.credit_cards FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
)
WITH CHECK (
  (workspace_id IS NULL AND auth.uid() = user_id)
  OR (workspace_id IS NOT NULL AND has_workspace_write_role_v2(workspace_id))
);

CREATE POLICY "cards_delete" ON public.credit_cards FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role_v2(workspace_id))
);

-- 4. Update workspaces SELECT policy to use v2 function
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;
CREATE POLICY "ws_select" ON public.workspaces FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR is_workspace_member_v2(id));

-- 5. Update workspace_members SELECT to use v2 function
DROP POLICY IF EXISTS "Members can view members" ON public.workspace_members;
CREATE POLICY "wm_select" ON public.workspace_members FOR SELECT TO authenticated
USING (is_workspace_member_v2(workspace_id));

-- 6. Now safe to drop old functions that accept _user_id (no policies reference them anymore)
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_workspace_write_role(uuid, uuid);

-- 7. Rename v2 functions to clean names
ALTER FUNCTION public.is_workspace_member_v2(uuid) RENAME TO is_workspace_member;
ALTER FUNCTION public.has_workspace_write_role_v2(uuid) RENAME TO has_workspace_write_role;
