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

    // Find user by email
    const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers()
    if (listErr) throw listErr
    
    const target = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    if (!target) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado. O email precisa ter uma conta no app.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check if already member
    const { data: existing } = await adminClient.from('workspace_members').select('id').eq('workspace_id', workspace_id).eq('user_id', target.id).single()
    if (existing) {
      return new Response(JSON.stringify({ error: 'Usuário já é membro deste espaço' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Add member
    const { error: insertErr } = await adminClient.from('workspace_members').insert({
      workspace_id,
      user_id: target.id,
      role,
    })
    if (insertErr) throw insertErr

    return new Response(JSON.stringify({ success: true, user_id: target.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Invite error:', error)
    return new Response(JSON.stringify({ error: 'Erro interno ao convidar membro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
