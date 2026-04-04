
-- Helper function to check workspace write role
CREATE OR REPLACE FUNCTION public.has_workspace_write_role(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role IN ('owner', 'member', 'editor')
  );
$$;

-- === TRANSACTIONS ===
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" ON public.transactions
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

-- === GOALS ===
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

-- === CREDIT_CARDS ===
DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
CREATE POLICY "Users can insert own cards" ON public.credit_cards
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
CREATE POLICY "Users can update own cards" ON public.credit_cards
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;
CREATE POLICY "Users can delete own cards" ON public.credit_cards
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);
