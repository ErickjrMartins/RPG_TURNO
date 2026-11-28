import { describe, expect, it } from 'vitest'
import { startBattle } from '../src/domain/battle'
import { newProfile } from '../src/domain/profile'
import { arenaEntry, entryPose } from '../src/game/arena-entry'
import { arenaHeight, arenaWidth } from '../src/game/layout'

describe('entrada lateral ao nível do chão', () => {
  it.each(['ruins', 'gate', 'drill'] as const)('entra pelo lado da equipe e termina na formação em %s', (encounter) => {
    const battle = startBattle({ ...newProfile('Lume', 'warrior', 'masculine'), pending: { id: 1, encounter, seed: 1 } })
    for (const unit of battle.units) {
      const entry = arenaEntry(unit, 120, true, unit.id === 'hero' ? battle.classId : undefined)
      const start = entryPose(entry)
      const firstSteps = entryPose({ ...entry, elapsed: entry.delay + entry.duration * 0.1 })
      const middle = entryPose({ ...entry, elapsed: entry.delay + entry.duration * 0.5 })
      const end = entryPose({ ...entry, elapsed: entry.delay + entry.duration })
      expect(start.x).toBe(unit.team === 'allies' ? -66 : arenaWidth + 66)
      expect(start.groundY).toBeGreaterThanOrEqual(arenaHeight * 0.64)
      expect(start.groundY).toBeLessThan(arenaHeight * 0.71)
      expect(firstSteps.groundY).toBe(start.groundY)
      expect(Math.abs(middle.x - entry.home.x)).toBeLessThan(Math.abs(start.x - entry.home.x))
      expect(start.scale).toBeGreaterThan(0.9)
      expect(end).toMatchObject({ x: entry.home.x, groundY: entry.home.y, scale: 1, complete: true })
      expect(end.y).toBeCloseTo(entry.home.y, 6)
      expect(end.tilt).toBeCloseTo(0, 6)
    }
  })

  it('mantém o lado de entrada e acelera a chegada do chefe no meio do combate', () => {
    const battle = startBattle({ ...newProfile('Lume', 'warrior', 'masculine'), pending: { id: 1, encounter: 'gate', seed: 1 } })
    const boss = battle.units.find((unit) => unit.boss)!
    const opening = arenaEntry(boss, 150, true)
    const summoned = arenaEntry(boss, 150, false)
    expect(summoned.boss).toBe(true)
    expect(summoned.origin).toEqual(opening.origin)
    expect(summoned.duration).toBeLessThan(opening.duration)
  })
})
