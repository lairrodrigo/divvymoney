
-- Fix workspaces policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can create workspace" ON public.workspaces;
CREATE POLICY "ws_insert" ON public.workspaces FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update workspace" ON public.workspaces;
CREATE POLICY "ws_update" ON public.workspaces FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete workspace" ON public.workspaces;
CREATE POLICY "ws_delete" ON public.workspaces FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Fix profiles policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "profile_select" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "profile_insert" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "profile_update" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Fix workspace_members remaining policies
DROP POLICY IF EXISTS "Owners can manage members" ON public.workspace_members;
CREATE POLICY "wm_insert" ON public.workspace_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Owners can update members" ON public.workspace_members;
CREATE POLICY "wm_update" ON public.workspace_members FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
));

DROP POLICY IF EXISTS "Owners can remove members" ON public.workspace_members;
CREATE POLICY "wm_delete" ON public.workspace_members FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_members.workspace_id AND owner_id = auth.uid())
  OR auth.uid() = user_id
);
