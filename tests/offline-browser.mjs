import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const fixture = await mkdtemp(join(tmpdir(), 'aurora-offline-'))
const generator = fileURLToPath(new URL('../scripts/offline.mjs', import.meta.url))
const html = (title) => `<!doctype html><title>${title}</title><h1>${title}</h1><script>navigator.serviceWorker.register('/service-worker.js')</script>`
let title = 'Versão em cache'
let status = 200
let worker
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  if (path === '/index.html') return response.writeHead(307, { Location: '/' }).end()
  if (path === '/service-worker.js') return response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(worker)
  if (path !== '/') return response.writeHead(404).end()
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html(title))
})

let browser
try {
  await mkdir(join(fixture, 'dist'))
  await writeFile(join(fixture, 'dist/index.html'), html(title))
  execFileSync(process.execPath, [generator], { cwd: fixture })
  worker = await readFile(join(fixture, 'dist/service-worker.js'))
  await new Promise((resolve) => server.listen(0, resolve))
  const url = `http://localhost:${server.address().port}/`
  browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  title = 'Versão atualizada'
  await page.reload()
  assert.equal(await page.title(), title)
  await page.goto(`${url}index.html`)
  assert.equal(page.url(), url)
  assert.equal(await page.title(), title)

  status = 401
  title = 'Entre com a sua conta'
  const response = await page.reload()
  assert.equal(response.status(), 401)
  assert.equal(await page.title(), title)

  await context.setOffline(true)
  await page.reload()
  assert.equal(await page.title(), 'Versão em cache')
  await page.goto(`${url}index.html`)
  assert.equal(await page.title(), 'Versão em cache')
  console.log('Redirecionamento, atualização online, login e retomada offline verificados.')
} finally {
  await browser?.close()
  await new Promise((resolve) => server.close(resolve))
  await rm(fixture, { recursive: true, force: true })
}
