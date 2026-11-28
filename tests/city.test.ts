import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { goldLimit, harvestFarm, improveBuilding, updateCity } from '../src/domain/city'
import { decodeProfile, hire, newProfile, recruitAttributes, settleAttempt, startAttempt, trainRecruit } from '../src/domain/profile'
import { SaveRepository } from '../src/persistence/save'

const epoch = 200_000
function rescuedCity() {
  const active = startAttempt(newProfile('Hélia', 'warrior', 'feminine'), 'ruins', 8)
  return settleAttempt(active, active.pending!, 'victory', epoch)
}

it('aplica os ritmos da fazenda antes e depois de cada melhoria e conserva o estoque máximo', () => {
  const council = improveBuilding(rescuedCity(), 'council', epoch)
  const working = improveBuilding(council, 'farm', epoch + 12_000)
  expect(updateCity(working, epoch + 24_000).city.farm.stored).toBe(2)
  expect(updateCity(working, epoch + 33_000).city.farm.stored).toBe(3)
  const projection = updateCity(working, epoch + 9_000_000)
  expect(projection.city.farm.stored).toBe(13)
  const collected = harvestFarm(projection, epoch + 9_000_000)
  expect(collected.supplies).toBe(4 - 1 + 13)
  expect(() => harvestFarm(collected, epoch + 9_000_000)).toThrow()
  expect(updateCity(collected, epoch).city.farm.stored).toBe(0)
})

it('respeita a sequência, mantém capacidade e treina tropas no quartel', () => {
  const profile = { ...rescuedCity(), gold: 200, supplies: 10 }
  expect(() => improveBuilding(profile, 'treasury', epoch)).toThrow('Sala de Comando')
  const council = improveBuilding(profile, 'council', epoch)
  expect(() => improveBuilding(council, 'council', epoch)).toThrow('andamento')
  let city = improveBuilding(improveBuilding(council, 'treasury', epoch + 12_000), 'barracks', epoch + 12_000)
  city = updateCity(city, epoch + 30_000)
  expect(goldLimit(city.city)).toBe(750)
  const hired = hire(city, 'sentry')
  const trained = trainRecruit(hired, 'sentry')
  expect(trained.recruits[0]?.level).toBe(2)
  expect(recruitAttributes(trained.recruits[0]!).hp).toBe(86)
  expect(() => trainRecruit(trained, 'sentry')).toThrow('Quartel')
  const attempt = startAttempt({ ...trained, gold: 745 }, 'gate', 8)
  expect(settleAttempt(attempt, attempt.pending!, 'victory', epoch + 31_000).gold).toBe(750)
})

it('migra a cidade sem descartar tropa e evita débito concorrente por uma mesma melhoria', async () => {
  const old = hire(rescuedCity(), 'sentry')
  const migrated = decodeProfile({
    ...old, schemaVersion: 2, city: undefined, inventory: ['dawn-brooch'], equipped: 'dawn-brooch', recruits: [{ id: 'sentry', slot: 0 }],
  })
  expect(migrated?.recruits).toEqual([{ id: 'sentry', slot: 0, level: 1 }])
  expect(migrated?.city.farm.since).toBeNull()
  const first = await SaveRepository.open()
  const second = await SaveRepository.open()
  try {
    const saved = await first.commit(null, rescuedCity)
    const jobs = await Promise.allSettled([first, second].map((db) => (
      db.commit(saved.revision, (current) => improveBuilding(current!, 'council', epoch))
    )))
    expect(jobs.map((job) => job.status).sort()).toEqual(['fulfilled', 'rejected'])
    const reloaded = (await second.load())!
    expect(reloaded.city.buildings.council.readyAt).toBe(epoch + 12_000)
    expect(reloaded.gold).toBe(42)
  } finally {
    first.close()
    second.close()
  }
})
