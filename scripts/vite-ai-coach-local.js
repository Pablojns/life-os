import { assertCoachAccess, readServerEnv, requestCoachAnalysis } from './ai-coach-core.mjs'

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

export function aiCoachLocalPlugin() {
  return {
    name: 'lifeos-ai-coach-local',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/ai-coach')) return next()
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          return res.end()
        }
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
        if (!req.headers.authorization) {
          return json(res, 401, { error: 'Não autorizado' })
        }

        try {
          const payload = await readBody(req)
          assertCoachAccess(payload.plan, payload.analysisType)
          const env = readServerEnv()
          const apiKey = env.ANTHROPIC_API_KEY
          if (!apiKey || apiKey.includes('COLE_')) {
            return json(res, 400, { error: 'ANTHROPIC_API_KEY ausente em supabase/.env.' })
          }

          const analysis = await requestCoachAnalysis({
            apiKey,
            analysisType: payload.analysisType,
            habits: payload.habits || [],
            quests: payload.quests || [],
            finances: payload.finances || {},
          })

          return json(res, 200, {
            analysis,
            type: payload.analysisType,
            generatedAt: new Date().toISOString(),
          })
        } catch (error) {
          return json(res, 400, { error: error.message })
        }
      })
    },
  }
}
