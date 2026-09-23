import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const html = `<!doctype html>
<html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet" />
    <style>
      html, body { margin: 0; }
      .icon {
        width: 512px;
        height: 512px;
        display: grid;
        place-items: center;
        background: #C9A84C;
        color: #1A1510;
        font-family: Cinzel, serif;
        font-weight: 700;
        font-size: 220px;
        letter-spacing: -4px;
      }
    </style>
  </head>
  <body><div class="icon">LO</div></body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 512, height: 512 } })
await page.setContent(html, { waitUntil: 'networkidle' })
const png = await page.screenshot({ type: 'png' })
writeFileSync('public/icon-512.png', png)
const page192 = await browser.newPage({ viewport: { width: 192, height: 192 } })
await page192.setContent(html.replace('512px', '192px').replace('512px', '192px').replace('220px', '82px'), {
  waitUntil: 'networkidle',
})
writeFileSync('public/icon-192.png', await page192.screenshot({ type: 'png' }))
await browser.close()
console.log('icons written')
