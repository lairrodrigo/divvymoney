
-- 1. Auto-create owner member on workspace creation (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.handle_workspace_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workspace_created
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.handle_workspace_owner();

-- 2. Fix workspaces SELECT: owner can always see their workspace (no chicken-and-egg)
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;
CREATE POLICY "Members can view workspace" ON public.workspaces
FOR SELECT TO public
USING (auth.uid() = owner_id OR is_workspace_member(auth.uid(), id));

-- 3. Fix UPDATE USING on transactions to allow workspace editors to update shared records
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
FOR UPDATE TO public
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role(auth.uid(), workspace_id))
)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

-- Same fix for goals UPDATE
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
FOR UPDATE TO public
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role(auth.uid(), workspace_id))
)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);

-- Same fix for credit_cards UPDATE
DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
CREATE POLICY "Users can update own cards" ON public.credit_cards
FOR UPDATE TO public
USING (
  auth.uid() = user_id
  OR (workspace_id IS NOT NULL AND has_workspace_write_role(auth.uid(), workspace_id))
)
WITH CHECK (
  auth.uid() = user_id
  AND (workspace_id IS NULL OR has_workspace_write_role(auth.uid(), workspace_id))
);
