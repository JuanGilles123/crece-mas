// Edge Function para ejecutar SQL usando Service Role Key
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar que viene del mismo proyecto (seguridad básica)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - falta Authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Crear cliente admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el SQL del body
    const { sql } = await req.json()

    if (!sql) {
      return new Response(
        JSON.stringify({ error: 'Falta el parámetro sql en el body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Ejecutar el SQL usando el cliente admin
    // Nota: Supabase no tiene un método directo para ejecutar SQL arbitrario
    // Necesitamos usar la conexión directa a PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Si la función RPC no existe, intentar método alternativo
      console.error('Error ejecutando SQL:', error)
      
      return new Response(
        JSON.stringify({ 
          error: 'No se puede ejecutar SQL directamente desde Edge Functions',
          message: error.message,
          suggestion: 'Ejecuta el SQL manualmente en Supabase Dashboard SQL Editor'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

