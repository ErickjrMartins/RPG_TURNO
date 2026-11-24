import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { createPlazaMiddleware } from './plaza.mjs'

const dist = resolve('dist')
const plaza = createPlazaMiddleware()
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function asset(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return }
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const file = resolve(dist, pathname === '/' ? 'index.html' : '.' + pathname)
  const type = types[extname(file)]
  if (!file.startsWith(dist + sep) || !type) { response.writeHead(404).end(); return }
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) { response.writeHead(404).end(); return }
  response.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' })
  if (request.method === 'HEAD') { response.end(); return }
  createReadStream(file).on('error', () => response.destroy()).pipe(response)
}

const server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, (request, response) => {
  plaza(request, response, () => {
    void asset(request, response).catch(() => response.writeHead(400).end())
  })
})
const port = Number(process.env.PORT ?? 8080)
server.listen(port, '0.0.0.0', () => console.log(`Reinos da Aurora · porta ${server.address().port}`))
