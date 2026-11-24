import { expect, it } from 'vitest'
import { availableTargets, playerAction, startBattle } from '../src/domain/battle'
import { magePoints, resetMageTree, trainMageNode } from '../src/domain/mage'
import { decodeProfile, newProfile, startAttempt } from '../src/domain/profile'

const caster = () => ({ ...newProfile('Nara', 'mage', 'feminine'), completed: ['ruins' as const] })

it('respeita pré-requisitos e devolve os pontos redistribuídos', () => {
  const current = caster()
  expect(magePoints(current)).toBe(2)
  expect(() => trainMageNode(current, 'rain')).toThrow('Rastro de Cometa')
  const trained = trainMageNode(trainMageNode(current, 'focus'), 'spark')
  expect(magePoints(trained)).toBe(0)
  expect(() => trainMageNode(trained, 'rift')).toThrow('insuficientes')
  const reset = resetMageTree(trained)
  expect(magePoints(reset)).toBe(2)
  expect(reset.mageRanks).toEqual({})
})

it('aplica os nós aos feitiços e conserva o progresso ao migrar de v6', () => {
  const before = caster()
  const legacy = { ...before, schemaVersion: 6, mageRanks: undefined, events: { ...before.events, cash: 120 },
    hero: { ...before.hero, xp: 450 }, gold: 203 }
  const migrated = decodeProfile(legacy)!
  expect(migrated.events.cash).toBe(120)
  expect(migrated.gold).toBe(203)
  let profile = migrated
  for (const node of ['focus', 'spark', 'rain', 'renew', 'chorus', 'rift', 'oath', 'void-circle'] as const) profile = trainMageNode(profile, node)
  expect(decodeProfile(profile)?.mageRanks).toEqual(profile.mageRanks)
  const fight = startBattle(startAttempt(profile, 'drill', 918))
  expect(fight.energy).toBe(24)
  expect(fight.affinity).toBe(2)
  expect(fight.magePulse).toBe(3)
  expect(fight.skills.map((entry) => [entry.id, entry.cost, entry.heal, entry.effect?.strength])).toEqual([
    ['spark', 0, undefined, undefined], ['rain', 20, undefined, 8], ['renew', 35, 51, undefined],
    ['chorus', 45, 26, undefined], ['void-circle', 55, undefined, undefined],
  ])
  const area = fight.skills.find((skill) => skill.id === 'rain')!
  const action = playerAction(fight, 'rain', availableTargets(fight, area)[0]!.id)
  expect(action.events.find((event) => event.spell === 'rain')?.targets).toHaveLength(3)
})
