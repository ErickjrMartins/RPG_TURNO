import { randomBytes } from 'node:crypto'

const classes = new Set(['warrior', 'archer', 'mage'])
const looks = new Set(['masculine', 'feminine'])
const controls = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(body))
}

async function readBody(request) {
  const parts = []
  let size = 0
  for await (const part of request) {
    size += part.length
    if (size <= 1024) parts.push(part)
  }
  if (size > 1024) return undefined
  try {
    const value = JSON.parse(Buffer.concat(parts).toString('utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
  } catch {
    return undefined
  }
}

function identity(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name.length < 2 || name.length > 24 || controls.test(name) || !classes.has(body.classId)
    || !looks.has(body.presentation) || !Number.isSafeInteger(body.level) || body.level < 1 || body.level > 9999) return undefined
  return { name, classId: body.classId, presentation: body.presentation, level: body.level }
}

function legalPosition(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0.07 && x <= 0.93 && y >= 0.15 && y <= 0.84
}

function ownOrigin(request) {
  try {
    return !request.headers.origin || new URL(request.headers.origin).host === request.headers.host
  } catch {
    return false
  }
}

const spawns = [[0.44, 0.63], [0.63, 0.69], [0.33, 0.73], [0.51, 0.78], [0.70, 0.78], [0.57, 0.56]]

export function createPlazaMiddleware({ now = Date.now, expiry = 16_000, capacity = 48 } = {}) {
  const sessions = new Map()

  async function handle(request, response) {
    if (!['POST', 'PUT', 'DELETE'].includes(request.method)) return send(response, 405, { error: 'Método indisponível.' })
    if (!ownOrigin(request)) return send(response, 403, { error: 'Origem inválida.' })
    if (!request.headers['content-type']?.startsWith('application/json')) return send(response, 415, { error: 'Use JSON.' })
    const body = await readBody(request)
    if (!body) return send(response, 400, { error: 'Dados inválidos.' })
    const time = now()
    for (const [token, entry] of sessions) if (time - entry.seenAt >= expiry) sessions.delete(token)
    const players = () => [...sessions.values()].map((entry) => entry.avatar)
    if (request.method === 'POST') {
      const hero = identity(body)
      if (!hero) return send(response, 400, { error: 'Personagem inválido.' })
      if (sessions.size >= capacity) return send(response, 503, { error: 'A praça está cheia.' })
      const token = randomBytes(24).toString('hex')
      const freeSpawn = spawns.find(([x, y]) => players().every((avatar) => Math.hypot(avatar.x - x, avatar.y - y) > 0.045))
      const spawn = freeSpawn ?? spawns[sessions.size % spawns.length]
      const avatar = { ...hero, id: randomBytes(8).toString('hex'), x: spawn[0], y: spawn[1] }
      sessions.set(token, { avatar, seenAt: time })
      return send(response, 200, { token, id: avatar.id, players: players() })
    }
    const session = typeof body.token === 'string' ? sessions.get(body.token) : undefined
    if (!session) return send(response, 410, { error: 'A sessão da praça expirou.' })
    if (request.method === 'DELETE') {
      sessions.delete(body.token)
      return send(response, 200, { players: players() })
    }
    if (!legalPosition(body.x, body.y)) return send(response, 400, { error: 'Posição fora da praça.' })
    session.seenAt = time
    session.avatar = { ...session.avatar, x: body.x, y: body.y }
    return send(response, 200, { players: players() })
  }

  return (request, response, next) => {
    const path = request.url?.split('?')[0]
    if (path !== '/api/plaza') return next()
    void handle(request, response).catch(() => {
      if (!response.headersSent) send(response, 500, { error: 'A praça está indisponível.' })
    })
  }
}
