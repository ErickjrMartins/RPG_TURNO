import { classIds, type ClassId, type Presentation } from '../content/classes'
import { plazaGround, type Position } from './plaza-ground'

export interface PlazaHero { name: string; classId: ClassId; presentation: Presentation; level: number }
export type Visitor = PlazaHero & Position & { id: string }

export interface PlazaState {
  phase: 'idle' | 'connecting' | 'online' | 'offline'
  visitors: Visitor[]
  self: string
  position: Position
  notice: string
}

const endpoint = new URL('api/plaza', document.baseURI)
const initialPosition = { x: 0.5, y: 0.67 }

function decodeVisitors(value: unknown): Visitor[] {
  if (!Array.isArray(value)) throw new Error('Resposta da praça indisponível.')
  return value.slice(0, 48).filter((entry): entry is Visitor => entry && typeof entry.id === 'string'
    && /^[0-9a-f]{16}$/.test(entry.id) && typeof entry.name === 'string' && entry.name.length <= 24
    && classIds.includes(entry.classId) && ['masculine', 'feminine'].includes(entry.presentation)
    && Number.isSafeInteger(entry.level) && entry.level > 0
    && Number.isFinite(entry.x) && entry.x >= 0.07 && entry.x <= 0.93
    && Number.isFinite(entry.y) && entry.y >= 0.15 && entry.y <= 0.84)
    .map((entry) => ({ ...entry, ...plazaGround(entry.x, entry.y) }))
}

async function request(method: string, body: unknown, keepalive = false) {
  const result = await fetch(endpoint, { method, body: JSON.stringify(body), keepalive, cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, signal: keepalive ? undefined : AbortSignal.timeout(5000) })
  if (!result.ok) {
    if (result.status === 410) throw new Error('A conexão da praça expirou. Entre novamente.')
    if (result.status === 503) throw new Error('A praça está cheia. Tente entrar novamente.')
    throw new Error('O servidor da praça está indisponível.')
  }
  if (!result.headers.get('content-type')?.includes('application/json')) throw new Error('O servidor da praça está indisponível.')
  return result.json()
}

export class Plaza {
  state: PlazaState = { phase: 'idle', visitors: [], self: '', position: initialPosition, notice: '' }
  private token = ''
  private generation = 0
  private timer: number | undefined
  private moving = false

  constructor(private readonly changed: (state: PlazaState) => void) {}

  private show(part: Partial<PlazaState>): void {
    this.state = { ...this.state, ...part }
    this.changed(this.state)
  }

  async join(hero: PlazaHero): Promise<void> {
    if (this.state.phase === 'online' || this.state.phase === 'connecting') return
    if (!['http:', 'https:'].includes(location.protocol)) {
      this.show({ phase: 'offline', notice: 'Abra o jogo em um servidor com a Pátio de Alvor para encontrar outros jogadores.' })
      return
    }
    const generation = ++this.generation
    this.show({ phase: 'connecting', notice: '' })
    try {
      const data = await request('POST', hero)
      if (typeof data.token !== 'string' || typeof data.id !== 'string') throw new Error('Servidor da praça indisponível.')
      if (generation !== this.generation) {
        void request('DELETE', { token: data.token }, true).catch(() => {})
        return
      }
      const visitors = decodeVisitors(data.players)
      const own = visitors.find((entry) => entry.id === data.id)
      if (!own) throw new Error('Servidor da praça indisponível.')
      this.token = data.token
      this.show({ phase: 'online', visitors, self: own.id, position: { x: own.x, y: own.y }, notice: '' })
      this.timer = window.setInterval(() => { void this.refresh() }, 1750)
    } catch (cause) {
      if (generation === this.generation) this.show({ phase: 'offline', notice: cause instanceof Error ? cause.message : 'Servidor da praça indisponível.' })
    }
  }

  move(x: number, y: number): void {
    const position = plazaGround(x, y)
    this.show({ position })
    if (this.state.phase === 'online') void this.refresh()
  }

  private async refresh(): Promise<void> {
    if (!this.token || this.moving) return
    this.moving = true
    const generation = this.generation
    try {
      const data = await request('PUT', { token: this.token, ...this.state.position })
      if (generation === this.generation) this.show({ visitors: decodeVisitors(data.players) })
    } catch (cause) {
      if (generation === this.generation) {
        this.leave()
        this.show({ phase: 'offline', notice: cause instanceof Error ? cause.message : 'Conexão interrompida.' })
      }
    } finally {
      if (generation === this.generation) this.moving = false
    }
  }

  leave(): void {
    if (this.state.phase === 'idle') return
    const token = this.token
    ++this.generation
    this.token = ''
    this.moving = false
    window.clearInterval(this.timer)
    this.timer = undefined
    this.show({ phase: 'idle', visitors: [], self: '', notice: '', position: initialPosition })
    if (token) void request('DELETE', { token }, true).catch(() => {})
  }
}
