import { describe, expect, it } from 'vitest'
import { classIds, type ClassId } from '../src/content/classes'
import { advanceBattle, availableTargets, playerAction, shieldOf, skillBlocked, startBattle, type Battle } from '../src/domain/battle'
import { attributesFor, decodeProfile, equip, hire, isProfile, moveRecruit, newProfile, settleAttempt, startAttempt, type Profile } from '../src/domain/profile'

function finishRound(battle: Battle): Battle {
  while (battle.phase === 'resolution') battle = advanceBattle(battle).state
  return battle
}

function fight(battle: Battle): Battle {
  for (let round = 0; round < 30 && battle.phase === 'player'; round++) {
    const hero = battle.units[0]!
    let skill = battle.skills[0]!
    const heavy = battle.skills.find((entry) => ['charge', 'barrage', 'rain'].includes(entry.id))!
    const heal = battle.skills.find((entry) => entry.id === 'renew')
    if (heal && hero.hp + 40 < hero.maxHp && !skillBlocked(battle, heal)) skill = heal
    else if (!skillBlocked(battle, heavy)) skill = heavy
    const targets = availableTargets(battle, skill)
    const target = skill === heal ? hero : targets.find((entry) => entry.id !== 'reinforcement') ?? targets[0]!
    battle = finishRound(playerAction(battle, skill.id, target.id).state)
  }
  return battle
}

function atRuins(classId: ClassId = 'warrior', seed = 30): Profile {
  return startAttempt(newProfile('Alda', classId, 'feminine'), 'ruins', seed)
}

describe('motor tático', () => {
  it('repete a mesma transição com a mesma seed sem mutar o estado', () => {
    const first = startBattle(atRuins())
    const second = startBattle(atRuins())
    const move = playerAction(first, 'strike', 'crawler')
    expect(move).toEqual(playerAction(second, 'strike', 'crawler'))
    expect(first.units.find((entry) => entry.id === 'crawler')?.hp).toBe(50)
    expect(move.state.phase).toBe('resolution')
    expect(move.state.queue).toEqual(['wisp', 'guide', 'crawler'])
    expect(move.state.energy).toBe(32)
    expect(() => playerAction(move.state, 'strike', 'crawler')).toThrow()
  })

  it('restringe alvo, recurso e recarga', () => {
    const start = startBattle(atRuins())
    expect(availableTargets(start, start.skills[0]!).map((entry) => entry.id)).toEqual(['crawler'])
    expect(() => playerAction(start, 'strike', 'wisp')).toThrow('Alvo inválido')
    expect(() => playerAction(start, 'charge', 'crawler')).toThrow('indisponível')
    const next = finishRound(playerAction(start, 'wall', 'hero').state)
    expect(next.round).toBe(2)
    expect(next.energy).toBe(5)
    expect(next.cooldowns.wall).toBe(2)
    expect(() => playerAction(next, 'wall', 'hero')).toThrow('indisponível')
  })

  it('protege com escudo, resolve queimadura e expira efeitos', () => {
    const start = startBattle(atRuins())
    const shielded = playerAction(start, 'wall', 'guide').state
    expect(shieldOf(shielded.units.find((entry) => entry.id === 'guide')!)).toBe(32)
    const second = finishRound(shielded)
    const guide = second.units.find((entry) => entry.id === 'guide')!
    expect(guide.hp).toBe(72)
    expect(shieldOf(guide)).toBeLessThan(32)
    const third = finishRound(playerAction(second, 'strike', 'crawler').state)
    expect(shieldOf(third.units.find((entry) => entry.id === 'guide')!)).toBe(0)
    const mage = startBattle(atRuins('mage'))
    const burned = playerAction(mage, 'rain', 'wisp').state
    expect(burned.units.find((entry) => entry.id === 'wisp')?.effects).toMatchObject([{ kind: 'burning', rounds: 2 }])
    expect(finishRound(burned).units.find((entry) => entry.id === 'wisp')?.effects).toMatchObject([{ kind: 'burning', rounds: 1 }])
  })

  it('pode perder e reiniciar com uma nova tentativa', () => {
    const profile = atRuins('warrior', 10)
    const battle = startBattle(profile)
    const hero = battle.units[0]!
    hero.hp = 1
    const result = finishRound(playerAction(battle, 'strike', 'crawler').state)
    expect(result.phase).toBe('defeat')
    const lost = settleAttempt(profile, profile.pending!, 'defeat')
    expect(lost.gold).toBe(0)
    const retried = startAttempt(lost, 'ruins', 55)
    expect(retried.pending?.id).toBe(2)
    expect(startBattle(retried).units[0]?.hp).toBe(hero.maxHp)
  })

  it.each(classIds)('%s vence os dois encontros e recebe cada recompensa uma vez', (classId) => {
    for (const seed of [9, 500, 212366153]) {
      let profile = atRuins(classId, seed)
      const tutorial = fight(startBattle(profile))
      expect(tutorial.phase).toBe('victory')
      profile = settleAttempt(profile, tutorial.attempt, 'victory')
      expect(settleAttempt(profile, tutorial.attempt, 'victory')).toBe(profile)
      const equipped = equip(profile, 'dawn-brooch')
      expect(attributesFor(equipped).power).toBe(attributesFor(profile).power + 3)
      const recruited = hire(hire(equipped, 'sentry'), 'bowman')
      const moved = moveRecruit(recruited, 'bowman', 5)
      expect(moved.recruits.find((unit) => unit.id === 'bowman')?.slot).toBe(5)
      expect(() => moveRecruit(moved, 'bowman', 1)).toThrow('Posição indisponível')
      profile = startAttempt(moved, 'gate', seed)
      const gate = fight(startBattle(profile))
      expect(gate.phase).toBe('victory')
      expect(gate.reinforced).toBe(true)
      const complete = settleAttempt(profile, gate.attempt, 'victory')
      expect(complete.completed).toEqual(['ruins', 'gate'])
      expect(complete.relicary.relics.map((item) => item.id)).toEqual(['dawn-brooch', 'gate-insignia'])
      expect(complete.hero.xp).toBe(140)
      expect(complete.gold).toBe(60 - 24 - 27 + 85)
      expect(isProfile(complete)).toBe(true)
    }
  })

  it('migra a fundação v1 com a aparência e o progresso originais', () => {
    const old = { schemaVersion: 1, revision: '01', hero: { name: 'Liora', classId: 'archer', presentation: 'feminine', xp: 10 }, gold: 3, supplies: 0 }
    const migrated = decodeProfile(old)
    expect(migrated).toMatchObject({ schemaVersion: 9, revision: '01', hero: old.hero, gold: 3, relicary: { relics: [] }, pending: null })
    expect(isProfile(migrated)).toBe(true)
    expect(decodeProfile({ ...old, schemaVersion: 10 })).toBeNull()
  })
})
