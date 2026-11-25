import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const root = 'dist'
const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name !== 'service-worker.js')
  .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort()
const hash = createHash('sha256')
hash.update(await readFile(new URL(import.meta.url)))
for (const file of files) {
  hash.update(file)
  hash.update(await readFile(join(root, file)))
}
const revision = hash.digest('hex').slice(0, 16)
const source = `const scope = new URL(self.registration.scope)
const prefix = 'reinos-da-aurora:' + scope.href + ':'
const cacheName = prefix + ${JSON.stringify(revision)}
const paths = ${JSON.stringify(files.filter((file) => file !== 'index.html'))}
const assets = new Set(paths.map((path) => new URL(path, scope).href))
const home = scope.href
const homeAlias = new URL('index.html', scope)

self.addEventListener('install', (event) => {
  // Sites redirects /index.html. Cache the canonical document without a redirect.
  const document = new Request(home, { cache: 'reload', redirect: 'error' })
  event.waitUntil(caches.open(cacheName).then(async (cache) => {
    await cache.addAll([document, ...paths])
    const legacy = await caches.match(homeAlias.href).catch(() => undefined)
    // Replace a broken worker even if a tab is still stuck on its navigation.
    if (legacy?.redirected) await self.skipWaiting()
  }))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(async (keys) => {
    await Promise.all(keys.filter((key) => key.startsWith(prefix) && key !== cacheName).map((key) => caches.delete(key)))
    await self.clients.claim()
  }))
})

async function navigate(request) {
  try {
    return await fetch(request)
  } catch (error) {
    const cached = await caches.match(home, { cacheName })
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (request.mode === 'navigate' && url.origin === scope.origin && [scope.pathname, homeAlias.pathname].includes(url.pathname)) {
    event.respondWith(navigate(request))
    return
  }
  if (assets.has(request.url)) {
    event.respondWith(caches.match(request, { cacheName }).catch(() => undefined).then((cached) => cached ?? fetch(request)))
  }
})
`
await writeFile(join(root, 'service-worker.js'), source)
console.log(`Modo offline preparado com ${files.length} arquivos da build.`)
