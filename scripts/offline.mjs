import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const root = 'dist'
const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name !== 'service-worker.js')
  .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort()
const hash = createHash('sha256')
for (const file of files) {
  hash.update(file)
  hash.update(await readFile(join(root, file)))
}
const revision = hash.digest('hex').slice(0, 16)
const source = `const scope = new URL(self.registration.scope)
const prefix = 'reinos-da-aurora:' + scope.href + ':'
const cacheName = prefix + ${JSON.stringify(revision)}
const paths = ${JSON.stringify(files)}
const assets = new Set(paths.map((path) => new URL(path, scope).href))
const home = new URL('index.html', scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(paths)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(async (keys) => {
    await Promise.all(keys.filter((key) => key.startsWith(prefix) && key !== cacheName).map((key) => caches.delete(key)))
    await self.clients.claim()
  }))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const isHome = request.mode === 'navigate' && [scope.pathname, new URL(home).pathname].includes(new URL(request.url).pathname)
  const asset = isHome ? home : request.url
  if (!assets.has(asset)) return
  event.respondWith(caches.open(cacheName).then(async (cache) => (await cache.match(asset)) ?? fetch(request)))
})
`
await writeFile(join(root, 'service-worker.js'), source)
console.log(`Modo offline preparado com ${files.length} arquivos da build.`)
