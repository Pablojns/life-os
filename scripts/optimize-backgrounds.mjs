import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  const { execSync } = await import('child_process')
  execSync('npm install sharp --no-save', { stdio: 'inherit', cwd: process.cwd() })
  sharp = require('sharp')
}

const root = path.join(process.cwd(), 'src/assets/backgrounds')
const files = fs.readdirSync(root, { recursive: true }).filter((file) => String(file).endsWith('.jpg'))

for (const rel of files) {
  const file = path.join(root, rel)
  const buf = await sharp(file).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 68, mozjpeg: true }).toBuffer()
  fs.writeFileSync(file, buf)
  console.log(rel, Math.round(buf.length / 1024) + 'kb')
}
