import { corsHeaders } from 'npm:@supabase/supabase-js/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: transactions = [] } = await supabase
      .from('transactions')
      .select('tipo, subtipo, valor, categoria, reference_month, reference_year, descricao, origem')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(500)

    const { data: profile } = await supabase
      .from('profiles')
      .select('pj_ativo, regime_tributario, renda_principal')
      .eq('user_id', user.id)
      .single()

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({
        insights: [
          { icon: '📊', text: 'Adicione transações ou importe planilhas para receber insights personalizados sobre suas finanças.' }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Group by month
    const byMonth: Record<string, { receitas: number; despesas: number; categorias: Record<string, number> }> = {}
    for (const t of transactions) {
      const m = t.reference_month
      if (!byMonth[m]) byMonth[m] = { receitas: 0, despesas: 0, categorias: {} }
      const val = Number(t.valor)
      if (t.tipo === 'receita') byMonth[m].receitas += val
      else byMonth[m].despesas += val
      byMonth[m].categorias[t.categoria] = (byMonth[m].categorias[t.categoria] || 0) + val
    }

    const months = Object.keys(byMonth).sort().reverse()
    const currentMonth = months[0]
    const prevMonth = months[1]
    const importedCount = transactions.filter(t => t.origem === 'importado').length

    // Build summary for AI
    const summaryLines: string[] = []
    summaryLines.push(`Usuário: ${profile?.pj_ativo ? 'PJ ativo' : 'PF'}`)
    if (profile?.renda_principal) summaryLines.push(`Renda principal: R$${Number(profile.renda_principal).toFixed(2)}`)
    summaryLines.push(`Total de transações: ${transactions.length} (${importedCount} importadas)`)
    summaryLines.push(`Meses com dados: ${months.join(', ')}`)

    for (const m of months.slice(0, 6)) {
      const d = byMonth[m]
      const topCats = Object.entries(d.categorias).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, v]) => `${c}: R$${v.toFixed(0)}`).join(', ')
      summaryLines.push(`${m}: Receitas R$${d.receitas.toFixed(0)}, Despesas R$${d.despesas.toFixed(0)}. Top: ${topCats}`)
    }

    const prompt = `Você é um consultor financeiro pessoal. Analise os dados abaixo e gere 4-5 insights práticos e curtos (máx 2 linhas cada). Use emojis. Foque em: tendências de gastos, comparação entre meses, categorias que mais cresceram, previsão de fechamento, e dicas práticas. Se houver dados importados, mencione como o histórico ajuda na análise. Responda em JSON: {"insights": [{"icon": "emoji", "text": "insight"}]}

Dados:
${summaryLines.join('\n')}`

    // Try AI call
    let aiInsights: { icon: string; text: string }[] | null = null
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
      if (LOVABLE_API_KEY) {
        const aiResponse = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Você é um assistente financeiro brasileiro. Responda sempre em JSON válido.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const content = aiData.choices?.[0]?.message?.content
          if (content) {
            const parsed = JSON.parse(content)
            aiInsights = parsed.insights
          }
        }
      }
    } catch (e) {
      console.log('AI gateway unavailable, using fallback:', e.message)
    }

    // If AI failed, use rule-based fallback
    if (!aiInsights) {
      aiInsights = generateFallbackInsights(byMonth, currentMonth, prevMonth, profile)
    }

    return new Response(JSON.stringify({ insights: aiInsights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI insights error:', error)
    return new Response(JSON.stringify({
      insights: [{ icon: '⚠️', text: 'Não foi possível gerar insights no momento. Tente novamente.' }]
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function generateFallbackInsights(
  byMonth: Record<string, { receitas: number; despesas: number; categorias: Record<string, number> }>,
  currentMonth: string | undefined,
  prevMonth: string | undefined,
  profile: { pj_ativo: boolean | null; renda_principal: number | null } | null
) {
  const insights: Array<{ icon: string; text: string }> = []

  if (currentMonth && byMonth[currentMonth]) {
    const curr = byMonth[currentMonth]
    const saldo = curr.receitas - curr.despesas
    insights.push({
      icon: saldo >= 0 ? '✅' : '🔴',
      text: `Saldo do mês: R$${saldo.toFixed(0)}. ${saldo >= 0 ? 'Você está no positivo!' : 'Atenção: gastos acima da receita.'}`,
    })

    const topCat = Object.entries(curr.categorias).sort((a, b) => b[1] - a[1])[0]
    if (topCat) {
      insights.push({ icon: '📊', text: `Maior gasto: ${topCat[0]} com R$${topCat[1].toFixed(0)}.` })
    }
  }

  if (currentMonth && prevMonth && byMonth[prevMonth]) {
    const diff = byMonth[currentMonth!].despesas - byMonth[prevMonth].despesas
    const pct = byMonth[prevMonth].despesas > 0 ? ((diff / byMonth[prevMonth].despesas) * 100).toFixed(0) : '0'
    insights.push({
      icon: diff > 0 ? '📈' : '📉',
      text: `Gastos ${diff > 0 ? 'subiram' : 'caíram'} ${Math.abs(Number(pct))}% em relação ao mês anterior.`,
    })
  }

  if (profile?.pj_ativo && currentMonth && byMonth[currentMonth]) {
    const impostos = byMonth[currentMonth].receitas * 0.15
    insights.push({ icon: '🏢', text: `Impostos PJ estimados: R$${impostos.toFixed(0)} (15% sobre receita).` })
  }

  if (insights.length === 0) {
    insights.push({ icon: '💡', text: 'Continue registrando suas transações para receber insights personalizados.' })
  }

  return insights
}
