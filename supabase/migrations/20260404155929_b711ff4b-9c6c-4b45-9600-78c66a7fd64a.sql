
-- Fix transactions DELETE
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" ON public.transactions
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix goals DELETE
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Fix credit_cards DELETE
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;
CREATE POLICY "Users can delete own cards" ON public.credit_cards
FOR DELETE TO public
USING (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);
