import { describe, expect, it } from 'vitest'
import { startBattle } from '../src/domain/battle'
import { newProfile } from '../src/domain/profile'
import { arenaEntry, entryPose } from '../src/game/arena-entry'

describe('entrada em profundidade', () => {
  it.each(['ruins', 'gate', 'drill'] as const)('avança do fundo e termina na formação em %s', (encounter) => {
    const battle = startBattle({ ...newProfile('Lume', 'warrior', 'masculine'), pending: { id: 1, encounter, seed: 1 } })
    for (const unit of battle.units) {
      const entry = arenaEntry(unit, true, unit.id === 'hero' ? battle.classId : undefined)
      const start = entryPose(entry)
      const middle = entryPose({ ...entry, elapsed: entry.delay + entry.duration * 0.5 })
      const end = entryPose({ ...entry, elapsed: entry.delay + entry.duration })
      expect(Math.abs(start.x - entry.home.x)).toBeLessThan(25)
      expect(middle.groundY - start.groundY).toBeGreaterThan(45)
      expect(start.scale).toBeLessThan(middle.scale)
      expect(middle.scale).toBeLessThan(end.scale)
      expect(end).toMatchObject({ x: entry.home.x, groundY: entry.home.y, scale: 1, complete: true })
      expect(end.y).toBeCloseTo(entry.home.y, 6)
      expect(end.tilt).toBeCloseTo(0, 6)
    }
  })

  it('reduz a aproximação do chefe quando ele chega no meio do combate', () => {
    const battle = startBattle({ ...newProfile('Lume', 'warrior', 'masculine'), pending: { id: 1, encounter: 'gate', seed: 1 } })
    const boss = battle.units.find((unit) => unit.boss)!
    const opening = arenaEntry(boss, true)
    const summoned = arenaEntry(boss, false)
    expect(summoned.boss).toBe(true)
    expect(summoned.origin.y).toBeGreaterThan(opening.origin.y)
    expect(summoned.duration).toBeLessThan(opening.duration)
  })
})
