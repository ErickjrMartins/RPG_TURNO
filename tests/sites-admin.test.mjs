import { describe, expect, it } from 'vitest'
import worker from '../server/sites-worker.mjs'

const env = { AURORA_ADMIN_EMAIL: 'owner@example.com', ASSETS: { fetch: () => new Response('game') } }
const access = (headers, bindings = env, method = 'GET') => worker.fetch(new Request('https://example.test/api/test-admin/access', { headers, method }), bindings)

describe('autorização do proprietário na prévia', () => {
  it('dá acesso só ao e-mail proprietário autenticado e proíbe cache da resposta', async () => {
    const owner = { 'oai-authenticated-user-id': 'owner-user', 'oai-authenticated-user-email': 'Owner@Example.com' }
    const granted = await access(owner)
    expect(granted.status).toBe(200)
    expect(await granted.json()).toEqual({ allowed: true })
    expect(granted.headers.get('cache-control')).toBe('private, no-store')
    expect(await (await access({ ...owner, 'oai-authenticated-user-email': 'visitor@example.com' })).json()).toEqual({ allowed: false })
    expect(await (await access({ 'oai-authenticated-user-email': 'owner@example.com' })).json()).toEqual({ allowed: false })
    expect(await (await access(owner, {})).json()).toEqual({ allowed: false })
    expect((await access(owner, env, 'POST')).status).toBe(405)
  })

  it('entrega os recursos do jogo pelo serviço de arquivos', async () => {
    expect(await (await worker.fetch(new Request('https://example.test/assets/game.js'), env)).text()).toBe('game')
  })
})
