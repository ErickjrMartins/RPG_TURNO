import { expect, it } from 'vitest'
import { abyssSpecs } from '../src/content/adventure'
import { classIds, type ClassId } from '../src/content/classes'
import { advanceBattle, availableTargets, playerAction, shieldOf, startBattle, type Battle } from '../src/domain/battle'
import { newProfile, startAttempt } from '../src/domain/profile'
import { arenaHeight, arenaWidth, pointFor } from '../src/game/layout'

function practice(classId: ClassId): Battle {
  const profile = { ...newProfile('Hélia', classId, 'feminine'), completed: ['ruins', 'gate'] as const }
  return startBattle(startAttempt({ ...profile, completed: [...profile.completed] }, 'drill', 788))
}

function round(battle: Battle): Battle {
  while (battle.phase === 'resolution') battle = advanceBattle(battle).state
  return battle
}

it.each(classIds)('abre e encerra o Abismo de %s com duas formações completas', (id) => {
  let battle = { ...practice(id), macula: 100 }
  expect(battle.units.filter((entry) => entry.team === 'allies')).toHaveLength(6)
  for (const unit of battle.units) {
    const point = pointFor(unit)
    expect(point.x).toBeGreaterThan(0)
    expect(point.x).toBeLessThan(arenaWidth)
    expect(point.y).toBeLessThan(arenaHeight - 50)
  }
  const skill = abyssSpecs[id]
  const target = availableTargets(battle, skill)[0]!
  const start = playerAction(battle, skill.id, target.id)
  expect(start.events.some((event) => event.kind === 'abyss-start')).toBe(true)
  expect(start.state.abyss?.rounds).toBe(2)
  expect(start.state.macula).toBe(40)
  if (id === 'warrior') expect(start.state.units.filter((unit) => shieldOf(unit) === 20)).toHaveLength(6)
  if (id === 'archer') expect(start.state.abyss?.target).toBe(target.id)
  battle = round(start.state)
  expect(battle.abyss?.rounds).toBe(1)
  const basic = battle.skills[0]!
  battle = round(playerAction(battle, basic.id, availableTargets(battle, basic)[0]!.id).state)
  expect(battle.abyss).toBeNull()
})

it('cobra vida e acumula corrosão na Jura sem descontar energia duas vezes', () => {
  const battle = practice('mage')
  const action = playerAction(battle, 'rain', 'drill-enemy-0', true)
  expect(action.state.corrosion).toBe(1)
  expect(action.state.energy).toBe(0)
  expect(action.state.units[0]!.hp).toBe(battle.units[0]!.hp - 12)
  expect(action.events.find((entry) => entry.visual === 'blast')?.targets).toHaveLength(3)
  expect(round(action.state).energy).toBe(5)
})
