import type { ReactNode } from 'react'
import { StripeProvider } from '@stripe/stripe-react-native'
import { env } from '../lib/env'

export function StripeGate({ children }: { children: ReactNode }) {
  if (!env.stripeKey) return <>{children}</>
  return (
    <StripeProvider publishableKey={env.stripeKey} merchantIdentifier="merchant.app.lifeos">
      <>{children}</>
    </StripeProvider>
  )
}
