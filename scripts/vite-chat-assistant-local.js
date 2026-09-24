import { readServerEnv } from './ai-coach-core.mjs'
import { requestChatReply } from './chat-assistant-core.mjs'

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

export function chatAssistantLocalPlugin() {
  return {
    name: 'lifeos-chat-assistant-local',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/chat-assistant')) return next()
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          return res.end()
        }
        if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
        if (!req.headers.authorization) return json(res, 401, { error: 'Não autorizado' })

        try {
          const payload = await readBody(req)
          const env = readServerEnv()
          const apiKey = env.ANTHROPIC_API_KEY
          if (!apiKey || apiKey.includes('COLE_')) {
            return json(res, 400, { error: 'ANTHROPIC_API_KEY ausente em supabase/.env.' })
          }
          const result = await requestChatReply({
            apiKey,
            message: payload.message,
            context: payload.context,
            theme: payload.theme,
          })
          return json(res, 200, result)
        } catch (error) {
          return json(res, 400, { error: error.message })
        }
      })
    },
  }
}
