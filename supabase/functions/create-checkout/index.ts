import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  try {
    const { priceId, userEmail, plan } = await req.json()

    if (!priceId || !plan) {
      throw new Error('priceId e plan são obrigatórios.')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail || user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get('APP_URL')}/settings?success=true&plan=${plan}`,
      cancel_url: `${Deno.env.get('APP_URL')}/settings?canceled=true`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
