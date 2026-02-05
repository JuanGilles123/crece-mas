import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { sendEmail, SENDERS } from './sendgrid.ts'
import { renderSubscriptionExpiring } from './emailTemplates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const toDateOnly = (date: Date) => date.toISOString().split('T')[0]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const target = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const targetDate = toDateOnly(target)

    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('id, organization_id, current_period_end')
      .eq('status', 'active')
      .is('expiration_notice_sent_at', null)
      .gte('current_period_end', `${targetDate}T00:00:00Z`)
      .lte('current_period_end', `${targetDate}T23:59:59Z`)

    if (error) {
      throw error
    }

    let notified = 0

    for (const sub of subscriptions || []) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('owner_id, name')
        .eq('id', sub.organization_id)
        .maybeSingle()

      if (!org?.owner_id) continue

      const { data: ownerData } = await supabaseAdmin.auth.admin.getUserById(org.owner_id)
      const ownerEmail = ownerData?.user?.email
      if (!ownerEmail) continue

      const html = renderSubscriptionExpiring({
        name: org?.name || 'Hola',
        endDate: toDateOnly(new Date(sub.current_period_end)),
        dashboardUrl: 'https://creceplus.app/dashboard',
      })

      await sendEmail({
        to: ownerEmail,
        subject: 'Tu suscripción está por vencer',
        html,
        from: SENDERS.BILLING,
      })

      await supabaseAdmin
        .from('subscriptions')
        .update({ expiration_notice_sent_at: new Date().toISOString() })
        .eq('id', sub.id)

      notified++
    }

    return new Response(JSON.stringify({ success: true, notified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error subscription-expiring:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Error interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
