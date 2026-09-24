/**
 * Stripe.js (pk_test) — só a chave publicável entra no frontend.
 */
import { loadStripe } from '@stripe/stripe-js'

import { config } from './env'

const publishableKey = config.stripeKey

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
