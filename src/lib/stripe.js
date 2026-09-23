/**
 * Stripe.js (pk_test) — só a chave publicável entra no frontend.
 */
import { loadStripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripePromise

export function getStripe() {
  if (!publishableKey) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY não configurada.')
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}
