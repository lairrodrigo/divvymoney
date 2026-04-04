
-- Fix transactions INSERT
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix transactions UPDATE
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix goals INSERT
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix goals UPDATE
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix credit_cards INSERT
DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
CREATE POLICY "Users can insert own cards" ON public.credit_cards
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix credit_cards UPDATE
DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
CREATE POLICY "Users can update own cards" ON public.credit_cards
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Add UPDATE policy on workspace_members (only owners can update roles)
CREATE POLICY "Owners can update members" ON public.workspace_members
FOR UPDATE TO public
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_members.workspace_id
    AND workspaces.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_members.workspace_id
    AND workspaces.owner_id = auth.uid()
  )
);
