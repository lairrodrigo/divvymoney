import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { email, workspace_id, role = 'member' } = await req.json()
    if (!email || !workspace_id) {
      return new Response(JSON.stringify({ error: 'email and workspace_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Auth user check
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check caller is owner
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: ws } = await adminClient.from('workspaces').select('owner_id').eq('id', workspace_id).single()
    if (!ws || ws.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only workspace owner can invite' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Invitar o usuário por email (gera convite real)
    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email)
    if (inviteErr) {
      console.error('Invite error:', inviteErr)
      // Se já existir, ignore e siga para buscar o ID (o inviteUserByEmail costuma ser idempotente)
    }

    // 2. Buscar o usuário pelo email de forma segura para obter o user_id
    const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers()
    if (listErr) throw listErr
    
    const target = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    if (!target) {
      return new Response(JSON.stringify({ error: 'Falha ao localizar usuário após convite.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Vincular ao workspace com role 'viewer' via upsert
    // Primeiro verifica se já existe para evitar erro de duplicidade ou atualizar a role
    // Usamos select em vez de single para evitar erro PGRST116 se não encontrar
    const { data: membersFound, error: findErr } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', target.id)

    if (findErr) throw new Error(`Erro ao buscar membro existente: ${findErr.message}`)
    const existingMember = membersFound && membersFound.length > 0 ? membersFound[0] : null

    if (existingMember) {
      const { error: updateErr } = await adminClient
        .from('workspace_members')
        .update({ role: 'viewer' })
        .eq('id', existingMember.id)
      if (updateErr) throw new Error(`Erro ao atualizar papel do membro: ${updateErr.message}`)
    } else {
      const { error: insertErr } = await adminClient
        .from('workspace_members')
        .insert({
          workspace_id,
          user_id: target.id,
          role: 'viewer', 
        })
      if (insertErr) throw new Error(`Erro ao inserir novo membro: ${insertErr.message}`)
    }

    return new Response(JSON.stringify({ success: true, user_id: target.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Invite error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno desconhecido'
    return new Response(JSON.stringify({ error: `Erro ao convidar: ${message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
