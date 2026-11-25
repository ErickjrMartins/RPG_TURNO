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
const legacyWorker = `
  const page = new URL('index.html', self.registration.scope).href
  const cacheName = 'reinos-da-aurora:' + self.registration.scope + ':legacy'
  self.addEventListener('install', (event) => event.waitUntil(caches.open(cacheName).then((cache) => cache.add(page))))
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(caches.match(page, { cacheName }).then((cached) => cached ?? fetch(event.request)))
    }
  })
`
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
  const currentWorker = await readFile(join(fixture, 'dist/service-worker.js'))
  worker = legacyWorker
  await new Promise((resolve) => server.listen(0, resolve))
  const url = `http://localhost:${server.address().port}/`
  browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const brokenTab = await context.newPage()
  await assert.rejects(brokenTab.goto(url), /ERR_FAILED/)
  await brokenTab.close()
  worker = currentWorker
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration.update()
  })
  await page.waitForFunction(async () => {
    const keys = await caches.keys()
    return keys.some((key) => key.startsWith('reinos-da-aurora:')) && keys.every((key) => !key.endsWith(':legacy'))
  })

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
  console.log('Troca do cache antigo, redirecionamento, atualização online, login e retomada offline verificados.')
} finally {
  await browser?.close()
  await new Promise((resolve) => server.close(resolve))
  await rm(fixture, { recursive: true, force: true })
}
