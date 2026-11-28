import { expect, it } from 'vitest'
import { classIds } from '../src/content/classes'
import { startBattle } from '../src/domain/battle'
import { newProfile, startAttempt, type Profile } from '../src/domain/profile'
import { arenaEntry, entryPose } from '../src/game/arena-entry'
import { arenaHeight, pointFor } from '../src/game/layout'
import { plazaGround } from '../src/game/plaza-ground'

it.each(classIds)('mantém a entrada da classe %s e dos cinco aliados na área pavimentada', (classId) => {
  const profile: Profile = { ...newProfile('Alda', classId, 'feminine'), completed: ['ruins'] }
  const units = startBattle(startAttempt(profile, 'drill', 42)).units
  const allies = units.filter((unit) => unit.team === 'allies')
  expect(allies).toHaveLength(6)
  for (const ally of allies) {
    // O piso contínuo dos cenários atuais começa abaixo de 63% da imagem.
    expect(pointFor(ally).y).toBeGreaterThanOrEqual(arenaHeight * 0.64)
    const entry = arenaEntry(ally, 90, true, ally.id === 'hero' ? classId : undefined)
    for (let step = 0; step <= 24; step++) {
      entry.elapsed = entry.delay + entry.duration * step / 24
      const pose = entryPose(entry)
      expect(pose.groundY).toBeGreaterThanOrEqual(arenaHeight * 0.64)
      expect(pose.y).toBe(pose.groundY)
    }
    expect(entryPose(entry)).toMatchObject({ ...pointFor(ally), complete: true })
  }
})

it('limita a praça ao contorno pavimentado, inclusive nos cantos', () => {
  expect(plazaGround(0.07, 0.15)).toEqual({ x: 0.20, y: 0.48 })
  expect(plazaGround(0.93, 0.84)).toEqual({ x: 0.88, y: 0.77 })
  expect(plazaGround(0.4, 0.67)).toEqual({ x: 0.4, y: 0.67 })
})
