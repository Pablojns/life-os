import fs from 'fs'
import path from 'path'
import { createCheckoutSession, ensureStripeCatalog, parseEnvFile } from './stripe-catalog.mjs'

function readEnv() {
  const root = path.resolve(process.cwd())
  const files = [path.join(root, 'supabase', '.env'), path.join(root, '.env.local')]
  const values = {}
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    Object.assign(values, parseEnvFile(fs.readFileSync(file, 'utf8')))
  }
  return values
}

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

export function stripeLocalPlugin() {
  return {
    name: 'lifeos-stripe-local',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/create-checkout')) return next()
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          return res.end()
        }
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
        if (!req.headers.authorization) {
          return json(res, 401, { error: 'Não autorizado' })
        }

        try {
          const env = readEnv()
          const secret = env.STRIPE_SECRET_KEY
          if (!secret || secret.includes('COLE_')) {
            return json(res, 400, {
              error: 'STRIPE_SECRET_KEY ausente em supabase/.env. Cole a sk_test_ da Stripe.',
            })
          }

          const payload = await readBody(req)
          let priceId = payload.priceId
          if (!priceId || String(priceId).startsWith('COLE_')) {
            const catalog = await ensureStripeCatalog(secret)
            priceId = catalog[payload.plan]?.priceId
          }
          if (!priceId) throw new Error('Price ID do plano não encontrado.')

          const session = await createCheckoutSession(secret, {
            priceId,
            userId: payload.userId,
            userEmail: payload.userEmail,
            plan: payload.plan,
            appUrl: env.APP_URL || 'http://localhost:5173',
          })

          return json(res, 200, { url: session.url, priceId })
        } catch (error) {
          return json(res, 400, { error: error.message })
        }
      })
    },
  }
}
