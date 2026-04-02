
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  tipo_pessoa TEXT DEFAULT 'PF' CHECK (tipo_pessoa IN ('PF', 'PJ')),
  saldo_inicial NUMERIC DEFAULT 0,
  renda_principal NUMERIC DEFAULT 0,
  pj_ativo BOOLEAN DEFAULT false,
  regime_tributario TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper: check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  );
$$;

-- Workspace policies
CREATE POLICY "Members can view workspace" ON public.workspaces FOR SELECT
USING (public.is_workspace_member(auth.uid(), id));
CREATE POLICY "Users can create workspace" ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update workspace" ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete workspace" ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- Workspace members policies
CREATE POLICY "Members can view members" ON public.workspace_members FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners can manage members" ON public.workspace_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()
));
CREATE POLICY "Owners can remove members" ON public.workspace_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()
) OR auth.uid() = user_id);

-- Credit cards
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  limite NUMERIC NOT NULL DEFAULT 0,
  fechamento_dia INTEGER NOT NULL CHECK (fechamento_dia BETWEEN 1 AND 31),
  vencimento_dia INTEGER NOT NULL CHECK (vencimento_dia BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cards" ON public.credit_cards FOR SELECT
USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "Users can insert own cards" ON public.credit_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.credit_cards FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.credit_cards FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  subtipo TEXT NOT NULL CHECK (subtipo IN ('dinheiro', 'cartao')),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  reference_month TEXT NOT NULL,
  reference_year INTEGER NOT NULL,
  cartao_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  parcelado BOOLEAN DEFAULT false,
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'importado')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT
USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_transactions_reference ON public.transactions(user_id, reference_month, reference_year);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  valor_alvo NUMERIC NOT NULL CHECK (valor_alvo > 0),
  valor_atual NUMERIC DEFAULT 0,
  prazo DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT
USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
