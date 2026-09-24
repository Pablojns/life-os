/**
 * Inicia o Checkout do Stripe via Edge Function create-checkout.
 */
import { useCallback, useState } from 'react'
import { PLANS } from '../config/plans'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from './useNotifications.jsx'

export function useCheckout() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null)

  const startCheckout = useCallback(
    async (planId) => {
      const plan = PLANS[planId]
      if (!plan || plan.id === 'free') {
        notify('O plano gratuito não precisa de checkout.', 'error')
        return
      }
      if (!user?.id || !user?.email) {
        notify('Entre na jornada para assinar um plano.', 'error')
        return
      }

      setLoading(true)
      setLoadingPlan(planId)
      try {
        const payload = {
          priceId: plan.priceId,
          userId: user.id,
          userEmail: user.email,
          plan: planId,
        }

        let url = null
        const { data, error } = await supabase.functions.invoke('create-checkout', { body: payload })
        if (!error && data?.url) {
          url = data.url
        } else if (import.meta.env.DEV) {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify(payload),
          })
          const local = await response.json()
          if (!response.ok || local.error) {
            throw new Error(local.error || error?.message || 'Falha ao criar a sessão de pagamento.')
          }
          url = local.url
        } else if (error) {
          throw error
        } else if (data?.error) {
          throw new Error(data.error)
        }

        if (!url) throw new Error('O Stripe não devolveu a URL de pagamento.')
        window.location.assign(url)
      } catch (error) {
        notify(error.message || 'Não foi possível iniciar o pagamento.', 'error')
        setLoading(false)
        setLoadingPlan(null)
      }
    },
    [notify, user],
  )

  return { startCheckout, loading, loadingPlan }
}
