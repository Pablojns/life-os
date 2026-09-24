export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY,
  stripeKey:   import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  appUrl:      import.meta.env.VITE_APP_URL,
}

if (import.meta.env.DEV) {
  Object.entries(config).forEach(([key, val]) => {
    if (!val) console.warn(`Variável faltando: ${key}`)
  })
}
