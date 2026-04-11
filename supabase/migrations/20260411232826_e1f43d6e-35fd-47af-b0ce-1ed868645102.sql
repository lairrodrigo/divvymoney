-- Shopping Lists
CREATE TABLE public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  status text NOT NULL DEFAULT 'ativa',
  valor_estimado numeric DEFAULT 0,
  valor_real numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sl_select" ON public.shopping_lists FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));
CREATE POLICY "sl_insert" ON public.shopping_lists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_workspace_write_role(workspace_id));
CREATE POLICY "sl_update" ON public.shopping_lists FOR UPDATE TO authenticated
  USING (has_workspace_write_role(workspace_id))
  WITH CHECK (has_workspace_write_role(workspace_id));
CREATE POLICY "sl_delete" ON public.shopping_lists FOR DELETE TO authenticated
  USING (has_workspace_write_role(workspace_id));

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shopping Items
CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  nome text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1,
  unidade text DEFAULT 'un',
  preco_estimado numeric DEFAULT 0,
  preco_real numeric,
  comprado boolean DEFAULT false,
  foto_url text,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Items inherit access from their parent list's workspace
CREATE POLICY "si_select" ON public.shopping_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND is_workspace_member(sl.workspace_id)));
CREATE POLICY "si_insert" ON public.shopping_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND has_workspace_write_role(sl.workspace_id)));
CREATE POLICY "si_update" ON public.shopping_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND has_workspace_write_role(sl.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND has_workspace_write_role(sl.workspace_id)));
CREATE POLICY "si_delete" ON public.shopping_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND has_workspace_write_role(sl.workspace_id)));

CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expense Splits (divisão de despesas familiar)
CREATE TABLE public.expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  reference_month text NOT NULL,
  user_id uuid NOT NULL,
  renda_declarada numeric DEFAULT 0,
  percentual numeric DEFAULT 0,
  valor_devido numeric DEFAULT 0,
  valor_pago numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, reference_month, user_id)
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "es_select" ON public.expense_splits FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));
CREATE POLICY "es_insert" ON public.expense_splits FOR INSERT TO authenticated
  WITH CHECK (has_workspace_write_role(workspace_id));
CREATE POLICY "es_update" ON public.expense_splits FOR UPDATE TO authenticated
  USING (has_workspace_write_role(workspace_id))
  WITH CHECK (has_workspace_write_role(workspace_id));
CREATE POLICY "es_delete" ON public.expense_splits FOR DELETE TO authenticated
  USING (has_workspace_write_role(workspace_id));