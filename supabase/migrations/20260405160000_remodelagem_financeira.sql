-- 1. Criação da Tabela Accounts (Contas)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'credit_card', 'bank')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela Categories (Categorias)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Renomear a coluna user_id para created_by_user_id na tabela transactions
ALTER TABLE public.transactions RENAME COLUMN user_id TO created_by_user_id;

-- Adicionar Chave Estrangeira explícita (se já não estiver lá)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='transactions_created_by_user_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Adição das Novas Colunas Estruturais em Transactions
ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN paid_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN is_shared BOOLEAN DEFAULT false NOT NULL;

-- 5. Limpeza de Colunas Antigas 
ALTER TABLE public.transactions DROP COLUMN IF EXISTS cartao_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS origem;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS categoria;

-- 6. APLICAÇÃO DE ROW LEVEL SECURITY (RLS) RIGOROSOS DE ACORDO COM O PRD
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Limpar Políticas Antigas de Transactions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Users can view workspace transactions" ON public.transactions;

-- Limpar Políticas Antigas de Workspaces e Members
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view own workspace memberships" ON public.workspace_members;

CREATE POLICY "Users can view own workspace memberships" 
ON public.workspace_members FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Owners can manage workspace memberships" 
ON public.workspace_members FOR ALL 
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'
    )
);

CREATE POLICY "Users can view workspaces they belong to" 
ON public.workspaces FOR SELECT 
USING (
    id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Owners can delete their workspaces" 
ON public.workspaces FOR DELETE 
USING (
    id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'
    )
);

CREATE POLICY "Transactions Select Policy" ON public.transactions FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Transactions Insert Policy" ON public.transactions FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Transactions Update Policy" ON public.transactions FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Transactions Delete Policy" ON public.transactions FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Categories Select Policy" ON public.categories FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Categories Insert Policy" ON public.categories FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Categories Update Policy" ON public.categories FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Categories Delete Policy" ON public.categories FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Accounts Select Policy" ON public.accounts FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Accounts Insert Policy" ON public.accounts FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Accounts Update Policy" ON public.accounts FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Accounts Delete Policy" ON public.accounts FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));
