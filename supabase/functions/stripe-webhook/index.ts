import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const EXPIRY_DAYS = {
  monthly: 31,
  quarterly: 92,
  semiannual: 183,
  annual: 365,
}

function supabaseAdmin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

function expiresAt(plan: string) {
  const days = EXPIRY_DAYS[plan as keyof typeof EXPIRY_DAYS] ?? 31
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

async function activatePlan(userId: string, plan: string) {
  const { error } = await supabaseAdmin()
    .from('profiles')
    .update({ plan, plan_expires_at: expiresAt(plan) })
    .eq('id', userId)

  if (error) throw error
}

async function revokePlan(userId?: string | null, email?: string | null) {
  const client = supabaseAdmin()
  if (userId) {
    const { error } = await client.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('id', userId)
    if (error) throw error
    return
  }
  if (email) {
    const { error } = await client.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('email', email)
    if (error) throw error
  }
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      if (userId && plan && plan !== 'free') {
        await activatePlan(userId, plan)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId
      let email: string | null = null
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
      if (!userId && customerId) {
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted) email = customer.email ?? null
      }
      await revokePlan(userId, email)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
