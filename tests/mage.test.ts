import { expect, it } from 'vitest'
import { mageNodeIds, type MageNodeId } from '../src/content/mage'
import { advanceBattle, availableTargets, playerAction, skillBlocked, startBattle, type Battle } from '../src/domain/battle'
import { magePoints, resetMageTree, toggleMageSlot, trainMageNode } from '../src/domain/mage'
import { decodeProfile, newProfile, startAttempt, type Profile } from '../src/domain/profile'

const caster = (): Profile => ({ ...newProfile('Nara', 'mage', 'feminine'), completed: ['ruins'] })

function trainedCaster(nodes: MageNodeId[]) {
  const profile = caster()
  return nodes.reduce(trainMageNode, { ...profile, hero: { ...profile.hero, xp: 750 } })
}

function rehearsal(profile = caster()): Battle {
  return { ...startBattle(startAttempt(profile, 'drill', 788)), energy: 100, macula: 100 }
}

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

it('migra a v7 com os 15 nós e mantém as passivas antigas equipadas', () => {
  const profile = trainedCaster(['focus', 'rift', 'oath'])
  const legacy = { ...profile, schemaVersion: 7, mageLoadout: undefined }
  const migrated = decodeProfile(legacy)!
  expect(mageNodeIds).toHaveLength(15)
  expect(migrated.mageRanks).toEqual(profile.mageRanks)
  expect(migrated.mageLoadout?.passive).toEqual(['rift', 'oath', 'seal'])
  expect(rehearsal(migrated).affinity).toBe(2)
  expect(rehearsal(toggleMageSlot(migrated, 'oath')).affinity).toBe(0)
})

it('valida espaços, pré-requisitos, equipamentos e o bloqueio durante o encontro', () => {
  const profile = trainedCaster(['focus', 'spark', 'rain', 'tear', 'renew', 'thread', 'restoration', 'chorus', 'dew'])
  expect(() => toggleMageSlot(profile, 'prism')).toThrow('Aprenda')
  expect(() => toggleMageSlot(profile, 'spark')).toThrow('primeiro espaço')
  expect(() => toggleMageSlot(profile, 'restoration')).toThrow('espaço passivo')
  const passive = toggleMageSlot(toggleMageSlot(profile, 'seal'), 'restoration')
  const full = toggleMageSlot(toggleMageSlot(passive, 'tear'), 'thread')
  expect(() => toggleMageSlot(full, 'dew')).toThrow('espaço ativo')
  expect(() => toggleMageSlot(startAttempt(full, 'drill', 1), 'tear')).toThrow('Refúgio')
  expect(decodeProfile(full)?.mageLoadout?.active).toEqual(['spark', 'rain', 'renew', 'chorus', 'tear', 'thread'])
  expect(rehearsal(full).skills.at(-1)?.id).toBe('void-circle')
  expect(rehearsal(full).mageHealing).toBe(1.08)
  expect(decodeProfile({ ...full, mageLoadout: { ...full.mageLoadout, active: ['spark', 'prism'] } })).toBeNull()
  expect(resetMageTree(full).mageLoadout?.active).toEqual(['spark', 'rain', 'renew', 'chorus'])
})

it('cura pelo menor percentual de Vida, ignorando personagens caídos', () => {
  const profile = trainedCaster(['focus', 'renew', 'thread', 'restoration'])
  const fight = rehearsal(toggleMageSlot(toggleMageSlot(toggleMageSlot(profile, 'thread'), 'seal'), 'restoration'))
  const [hero, ally, fallen] = fight.units
  hero!.maxHp = 200
  hero!.hp = 60
  ally!.maxHp = 80
  ally!.hp = 40
  fallen!.hp = 0
  const skill = fight.skills.find((entry) => entry.id === 'thread')!
  expect(availableTargets(fight, skill).map((unit) => unit.id)).toEqual(['hero'])
  expect(() => playerAction(fight, 'thread', ally!.id)).toThrow('Alvo inválido')
  const action = playerAction(fight, 'thread', 'hero')
  expect(action.events.find((event) => event.kind === 'heal')?.amount).toBe(56)
  expect(action.state.energy).toBe(78)
})

it('aplica três pulsos de cura e exige escolher entre a cura em massa e o Círculo', () => {
  const profile = trainedCaster(['focus', 'renew', 'chorus', 'dew', 'dawn'])
  let fight = rehearsal(toggleMageSlot(toggleMageSlot(profile, 'dew'), 'dawn'))
  const hero = fight.units[0]!
  hero.maxHp = 100
  hero.hp = 20
  fight = playerAction(fight, 'dew', 'hero').state
  const pulses = Array.from({ length: 3 }, () => {
    const turn = advanceBattle({ ...fight, phase: 'resolution', queue: [] })
    fight = turn.state
    return turn.events.find((event) => event.kind === 'heal' && event.target === 'hero')?.amount
  })
  expect(pulses).toEqual([6, 6, 6])
  expect(fight.units[0]!.effects).toEqual([])
  expect(() => playerAction(fight, 'dawn', 'hero', true)).toThrow('Jura Profana indisponível')
  const burst = playerAction(fight, 'dawn', 'hero')
  expect(burst.state.units[0]!.hp).toBe(70)
  expect(burst.state.energy).toBe(fight.energy)
  expect(burst.state.macula).toBe(30)
  expect(skillBlocked({ ...burst.state, phase: 'player' }, burst.state.skills.at(-1)!)).toBe('Mácula insuficiente')
})

it('amplifica os golpes do Canalizador só na fileira do Círculo', () => {
  const fight = rehearsal()
  const spell = fight.skills.at(-1)!
  const frontline = availableTargets(fight, spell).find((entry) => entry.slot < 3)!
  const backline = availableTargets(fight, spell).find((entry) => entry.slot >= 3)!
  const opened = { ...playerAction(fight, spell.id, frontline.id).state, phase: 'player' as const }
  const damage = (battle: Battle, target: string) => playerAction(battle, 'spark', target).events.find((event) => event.kind === 'damage')!.amount!
  expect(damage(opened, frontline.id)).toBeGreaterThan(damage(fight, frontline.id))
  expect(damage(opened, backline.id)).toBe(damage(fight, backline.id))
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
