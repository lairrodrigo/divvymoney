import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const { email, workspace_id } = await req.json()
    if (!email || !workspace_id) return json({ error: 'email e workspace_id são obrigatórios' }, 400)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
      return json({ error: 'Email inválido' }, 400)
    }

    // Auth caller
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Não autorizado' }, 401)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check caller is workspace owner
    const { data: ws } = await adminClient
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspace_id)
      .single()
    if (!ws || ws.owner_id !== user.id) {
      return json({ error: 'Apenas o dono do espaço pode convidar membros' }, 403)
    }

    // Find target user by email (efficient filtered list)
    const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({
      filter: `email.eq.${email.toLowerCase()}`,
      page: 1,
      perPage: 1,
    })

    let targetUserId: string

    if (listErr || !users || users.length === 0) {
      // User doesn't exist yet — create an invited user (not invite email, just create)
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: false,
        user_metadata: { invited_to_workspace: workspace_id },
      })
      if (createErr) {
        // If email_exists error from createUser, try listing again
        if (createErr.message?.includes('already been registered')) {
          const { data: { users: retry } } = await adminClient.auth.admin.listUsers({
            filter: `email.eq.${email.toLowerCase()}`,
            page: 1,
            perPage: 1,
          })
          if (!retry || retry.length === 0) {
            return json({ error: 'Não foi possível encontrar o usuário' }, 500)
          }
          targetUserId = retry[0].id
        } else {
          return json({ error: `Erro ao criar convite: ${createErr.message}` }, 500)
        }
      } else {
        targetUserId = newUser.user.id
      }
    } else {
      targetUserId = users[0].id
    }

    // Prevent self-invite
    if (targetUserId === user.id) {
      return json({ error: 'Você já é dono deste espaço' }, 400)
    }

    // Add to workspace (upsert via check)
    const { data: existing } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', targetUserId)

    if (existing && existing.length > 0) {
      return json({ error: 'Este usuário já é membro deste espaço' }, 400)
    }

    const { error: insertErr } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id,
        user_id: targetUserId,
        role: 'member',
      })
    if (insertErr) {
      return json({ error: `Erro ao adicionar membro: ${insertErr.message}` }, 500)
    }

    return json({ success: true, user_id: targetUserId })
  } catch (error) {
    console.error('Invite error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return json({ error: `Erro ao convidar: ${message}` }, 500)
  }
})
