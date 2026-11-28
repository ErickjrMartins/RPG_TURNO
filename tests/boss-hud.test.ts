import { describe, expect, it } from 'vitest'
import type { EncounterId } from '../src/content/adventure'
import { zone, zonesIds } from '../src/content/campaign'
import { advanceBattle, playerAction, startBattle } from '../src/domain/battle'
import { newProfile } from '../src/domain/profile'
import { bossHudState } from '../src/ui/boss-hud'

function encounter(id: EncounterId) {
  return startBattle({ ...newProfile('Alda', 'warrior', 'feminine'), pending: { id: 1, encounter: id, seed: 1 } })
}

describe('HUD de chefes', () => {
  it('usa a Vida total para calcular camadas inteiras, parciais e derrotadas', () => {
    const battle = encounter('gate')
    const boss = battle.units.find((unit) => unit.boss)!
    expect(bossHudState(battle)).toMatchObject({ layers: 4, fill: 1, critical: false, spec: { level: 2 } })
    boss.hp = 73
    expect(bossHudState(battle)).toMatchObject({ layers: 3, fill: 13 / 30, critical: false })
    boss.hp = 30
    expect(bossHudState(battle)).toMatchObject({ layers: 1, fill: 1, critical: false })
    boss.hp = 18
    expect(bossHudState(battle)).toMatchObject({ layers: 1, fill: 0.6, critical: true })
    boss.hp = 0
    expect(bossHudState(battle)).toMatchObject({ layers: 0, fill: 0, critical: false })
  })

  it('acompanha o reforço e recebe o nome do ataque especial do Guardião', () => {
    const battle = encounter('gate')
    battle.units.find((unit) => unit.boss)!.hp = 59
    expect(bossHudState(battle)?.phase.name).toBe('Vigília do Bloqueio')
    const next = advanceBattle({ ...battle, phase: 'resolution' }).state
    expect(next.reinforced).toBe(true)
    expect(bossHudState(next)?.phase.name).toBe('Corte do Véu')
    const action = advanceBattle({ ...next, phase: 'resolution', round: 2, queue: ['warden'] })
    expect(action.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'warden', ability: 'Corte do Véu' }))
  })

  it.each(zonesIds)('mostra o chefe de %s apenas após eliminar os focos', (id) => {
    const battle = encounter(id)
    expect(bossHudState(battle)).toBeUndefined()
    for (const unit of battle.units) if (unit.team === 'enemies') unit.hp = 0
    const emerged = advanceBattle({ ...battle, phase: 'resolution' }).state
    expect(bossHudState(emerged)).toMatchObject({
      unit: { boss: id, name: zone(id).core.name, hp: zone(id).core.stats.hp, maxHp: zone(id).core.stats.hp },
      fill: 1,
    })
    if (id === 'nest') {
      expect(bossHudState(emerged)?.phase.name).toBe('Barreira erguida')
      const opened = playerAction({ ...emerged, macula: 100 }, 'ash-bastion', 'hero').state
      expect(bossHudState(opened)?.phase.name).toBe('Barreira rompida')
    }
  })

  it('mantém batalhas comuns e o treino sem HUD de chefe', () => {
    expect(bossHudState(encounter('ruins'))).toBeUndefined()
    expect(bossHudState(encounter('drill'))).toBeUndefined()
  })
})
