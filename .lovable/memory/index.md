# Project Memory

## Core
App de finanças pessoais. Dark mode C6 Bank: bg #0A0A0A, accent gold #F5A623. Mobile-first max-w-lg.
Sempre usar YYYY-MM para reference_month. Nunca apenas nome do mês.
Cartão: billing_month calculado via fechamento_dia. Parcelamento distribuído em meses futuros.
Saldo disponível = receitas - despesas dinheiro. Saldo comprometido = disponível - cartão - impostos.
4 camadas: financeiro, compras, família. Simples, rápido, sem telas excessivas.
Usar lovable.auth.signInWithOAuth para Google login (não supabase.auth diretamente).

## Memories
- [Financial model](mem://features/financial-model) — Transaction entity, billing month rules, installment logic
- [Design tokens](mem://design/tokens) — C6 Bank dark theme, gold accent, glass cards, animations
- [Product roadmap](mem://features/product-roadmap) — 4-layer vision: finance, shopping, family
