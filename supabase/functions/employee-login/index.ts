import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
const PBKDF2_PREFIX = 'pbkdf2'

const verifyPassword = async (password: string, stored: string) => {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== PBKDF2_PREFIX) {
    return false
  }
  const iterations = Number(parts[1] || 0)
  const salt = parts[2] || ''
  const hash = parts[3] || ''
  if (!iterations || !salt || !hash) {
    return false
  }
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256
  )
  const hashBytes = new Uint8Array(bits)
  const candidate = btoa(String.fromCharCode(...hashBytes))
  return candidate === hash
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const hashToken = async (value: string) => {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const generateToken = () => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
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
    const body = await req.json()
    const code = String(body?.code || '').toLowerCase().trim()
    const password = String(body?.password || '')

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'employee-login/index.ts:34',message:'employeeLogin:start',data:{hasCode:!!code,codeLength:code.length,hasPassword:!!password},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    if (!code || !password) {
      return new Response(
        JSON.stringify({ error: 'Código y contraseña son requeridos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, organization_id, code, role, active, team_member_id, team_members(employee_name, employee_phone, custom_role_id, role)')
      .eq('code', code)
      .single()

    if (employeeError || !employee) {
      const { data: teamMember, error: teamMemberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('employee_code', code)
        .eq('is_employee', true)
        .eq('status', 'active')
        .maybeSingle()

      if (!teamMemberError && teamMember?.id) {
        const fallback = await supabaseAdmin
          .from('employees')
          .select('id, organization_id, code, role, active, team_member_id, team_members(employee_name, employee_phone, custom_role_id, role)')
          .eq('team_member_id', teamMember.id)
          .single()
        employee = fallback.data || null
        employeeError = fallback.error || null
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H9',location:'employee-login/index.ts:55',message:'employee:lookup_failed',data:{hasEmployee:!!employee,hasError:!!employeeError,errorMessage:employeeError?.message || null,fallbackUsed:!!employee},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      if (!employee) {
        return new Response(
          JSON.stringify({ error: 'Credenciales inválidas', code: 'EMPLOYEE_NOT_FOUND' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    }

    if (!employee.active) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H9',location:'employee-login/index.ts:64',message:'employee:inactive',data:{employeeId:employee.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      return new Response(
        JSON.stringify({ error: 'Empleado desactivado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { data: employeeAuth, error: authError } = await supabaseAdmin
      .from('employees')
      .select('password_hash')
      .eq('id', employee.id)
      .single()

    if (authError || !employeeAuth?.password_hash) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H9',location:'employee-login/index.ts:78',message:'employee:missing_hash',data:{employeeId:employee.id,hasHash:!!employeeAuth?.password_hash,hasError:!!authError},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const matches = await verifyPassword(password, employeeAuth.password_hash)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H9',location:'employee-login/index.ts:87',message:'employee:verify',data:{employeeId:employee.id,matches},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    if (!matches) {
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas', code: 'INVALID_PASSWORD' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = generateToken()
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

    const { error: sessionError } = await supabaseAdmin
      .from('employee_sessions')
      .insert([{
        employee_id: employee.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }])

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: 'Error al crear sesión' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const customRoleId = employee?.team_members?.custom_role_id || null
    let permissions = null
    if (customRoleId) {
      const { data: customRole } = await supabaseAdmin
        .from('custom_roles')
        .select('permissions')
        .eq('id', customRoleId)
        .maybeSingle()
      permissions = customRole?.permissions || null
    }

    const responsePayload = {
      token,
      expiresAt,
      permissions,
      employee: {
        id: employee.id,
        code: employee.code,
        role: employee?.team_members?.role || employee.role,
        organization_id: employee.organization_id,
        name: employee.team_members?.employee_name || null,
        phone: employee.team_members?.employee_phone || null,
        custom_role_id: customRoleId
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'employee-login/index.ts:97',message:'employeeLogin:success',data:{employeeId:employee.id,role:employee.role,hasSession:true},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
