import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureStripeCatalog, parseEnvFile } from './stripe-catalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const env = parseEnvFile(fs.readFileSync(path.join(ROOT, 'supabase', '.env'), 'utf8'))
const secret = env.STRIPE_SECRET_KEY

if (!secret || secret.includes('COLE_')) {
  console.error('Cole STRIPE_SECRET_KEY (sk_test_...) em supabase/.env e rode de novo.')
  process.exit(1)
}

const catalog = await ensureStripeCatalog(secret)
const plansPath = path.join(ROOT, 'src', 'config', 'plans.js')
let source = fs.readFileSync(plansPath, 'utf8')

for (const [plan, item] of Object.entries(catalog)) {
  source = source.replace(
    new RegExp(`(id: '${plan}'[\\s\\S]*?priceId: ')([^']*)(')`),
    `$1${item.priceId}$3`,
  )
}

fs.writeFileSync(plansPath, source)
fs.writeFileSync(path.join(ROOT, 'playwright-output', 'stripe-products.json'), JSON.stringify(catalog, null, 2))
console.log(JSON.stringify(catalog, null, 2))
console.log('STRIPE_PRODUCTS_OK')
