import { once } from 'node:events'
import { createServer } from 'node:http'
import { expect, it } from 'vitest'
import { createPlazaMiddleware } from '../server/plaza.mjs'

it('compartilha a praça, valida movimentos e remove sessões expiras ou encerradas', async () => {
  let time = 0
  const plaza = createPlazaMiddleware({ now: () => time, expiry: 5000 })
  const server = createServer((req, res) => plaza(req, res, () => res.writeHead(404).end()))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const url = `http://127.0.0.1:${server.address().port}/api/plaza`
  const send = (method, body, headers) => fetch(url, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...headers } })
  const join = (name) => send('POST', { name, classId: 'mage', presentation: 'feminine', level: 2 })
  try {
    expect((await send('POST', {}, { Origin: 'https://example.com' })).status).toBe(403)
    const first = await (await join('Hélia')).json()
    const second = await (await join('Alda')).json()
    expect(second.players.map((avatar) => avatar.name)).toEqual(['Hélia', 'Alda'])
    expect(second.players.every((avatar) => !Object.hasOwn(avatar, 'token'))).toBe(true)
    expect((await send('PUT', { token: first.token, x: 99, y: 0.5 })).status).toBe(400)
    await send('PUT', { token: first.token, x: 0.33, y: 0.51 })
    time += 3000
    const updated = await (await send('PUT', { token: second.token, x: 0.69, y: 0.5 })).json()
    expect(updated.players.find((avatar) => avatar.id === first.id)).toMatchObject({ x: 0.33, y: 0.51 })
    time += 2100
    expect((await send('PUT', { token: first.token, x: 0.33, y: 0.51 })).status).toBe(410)
    expect((await (await send('DELETE', { token: second.token })).json()).players).toEqual([])
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
