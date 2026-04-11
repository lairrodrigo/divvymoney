-- Criar a função create_workspace_with_owner que o frontend espera
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(workspace_name text)
RETURNS TABLE(ws_id uuid, ws_name text, ws_created_by uuid, ws_created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_ws_id uuid;
BEGIN
  -- Criar workspace
  INSERT INTO public.workspaces (nome, owner_id)
  VALUES (workspace_name, auth.uid())
  RETURNING id INTO new_ws_id;

  -- Inserir o criador como owner (trigger pode já fazer isso, ON CONFLICT garante idempotência)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws_id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;

  RETURN QUERY
    SELECT w.id, w.nome, w.owner_id, w.created_at
    FROM public.workspaces w
    WHERE w.id = new_ws_id;
END;
$$;