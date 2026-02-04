import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const PBKDF2_ITERATIONS = 120_000

const generateSalt = () => {
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  return btoa(String.fromCharCode(...saltBytes))
}

const hashPassword = async (password: string) => {
  const salt = generateSalt()
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
  const hashBytes = new Uint8Array(bits)
  const hash = btoa(String.fromCharCode(...hashBytes))
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - falta Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - usuario inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const body = await req.json()
    const { organizationId, memberId, username, password } = body || {}

    if (!organizationId || !memberId || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const usernameSafe = String(username || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
    const passwordTrim = String(password || '').trim()

    if (usernameSafe.length < 4 || usernameSafe.length > 12) {
      return new Response(
        JSON.stringify({ error: 'El usuario debe tener entre 4 y 12 caracteres.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9]{4,12}$/.test(passwordTrim)) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener entre 4 y 12 caracteres (letras y números).' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organización no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (org.owner_id !== userData.user.id) {
      return new Response(
        JSON.stringify({ error: 'No autorizado para actualizar credenciales' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .eq('is_employee', true)
      .single()

    if (memberError || !teamMember) {
      return new Response(
        JSON.stringify({ error: 'Empleado no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const passwordHash = await hashPassword(passwordTrim)

    const { error: updateMemberError } = await supabaseAdmin
      .from('team_members')
      .update({ employee_code: usernameSafe, employee_username: usernameSafe })
      .eq('id', memberId)

    if (updateMemberError) {
      return new Response(
        JSON.stringify({ error: 'Error actualizando usuario del empleado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { error: updateEmployeeError } = await supabaseAdmin
      .from('employees')
      .update({ code: usernameSafe, password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('team_member_id', memberId)
      .eq('organization_id', organizationId)

    if (updateEmployeeError) {
      return new Response(
        JSON.stringify({ error: 'Error actualizando credenciales' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, username: usernameSafe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Error interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
