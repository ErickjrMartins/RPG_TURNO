import { expect, it } from 'vitest'
import { advanceBattle, availableTargets, playerAction, startBattle, type Battle } from '../src/domain/battle'
import { bindCurse, bindingRank, curseUnlocked } from '../src/domain/bindings'
import { decodeProfile, newProfile, settleAttempt, startAttempt, type Profile } from '../src/domain/profile'
import { skyGround } from '../src/game/plaza-ground'

function veteran(): Profile {
  const profile = newProfile('Alda', 'warrior', 'feminine')
  return { ...profile, completed: ['ruins'], hero: { ...profile.hero, xp: 80 } }
}

function playRound(battle: Battle) {
  const skill = battle.skills[0]!
  let transition = playerAction(battle, skill.id, availableTargets(battle, skill)[0]!.id)
  const events = [...transition.events]
  while (transition.state.phase === 'resolution') {
    transition = advanceBattle(transition.state)
    events.push(...transition.events)
  }
  return { state: transition.state, events }
}

it('migra a versão 8, mantém a campanha e desbloqueia as maldições pelo histórico', () => {
  const profile = veteran()
  const legacy = { ...profile, schemaVersion: 8, bindings: undefined }
  const migrated = decodeProfile(legacy)
  expect(migrated).toEqual(profile)
  expect(curseUnlocked(migrated!.completed, 'bound-cinder')).toBe(true)
  expect(() => bindCurse(migrated!, 'bound-omen')).toThrow('Contenha a maldição')
  expect(decodeProfile({ ...profile, bindings: { active: 'bound-omen', experience: {} } })).toBeNull()
})

it('coloca uma maldição na iniciativa e protege o aliado com menos vida', () => {
  const profile = bindCurse({ ...veteran(), recruits: [{ id: 'sentry', slot: 0, level: 1 }] }, 'bound-cinder')
  const pending = startAttempt(profile, 'gate', 61)
  expect(() => bindCurse(pending, null)).toThrow('Conclua o combate')
  const battle = startBattle(pending)
  const sentry = battle.units.find((unit) => unit.id === 'sentry')!
  sentry.hp = 28
  expect(battle.units.find((unit) => unit.id === 'bound-curse')).toMatchObject({ slot: 4, team: 'allies', bindingRank: 1 })
  const { events, state } = playRound(battle)
  expect(events).toContainEqual(expect.objectContaining({ actor: 'bound-curse', spell: 'cinder-shell', target: 'sentry' }))
  expect(events).toContainEqual(expect.objectContaining({ kind: 'damage', target: 'sentry', text: expect.stringContaining('11 no escudo') }))
  expect(playRound(state).events).toContainEqual(expect.objectContaining({ actor: 'bound-curse', spell: 'cinder-bite' }))
})

it('mantém as seis vagas do treino e aplica a marca do Vigia a partir da primeira rodada', () => {
  const profile = bindCurse({ ...veteran(), completed: ['ruins', 'gate'] }, 'bound-omen')
  const battle = startBattle(startAttempt(profile, 'drill', 172))
  const allies = battle.units.filter((unit) => unit.team === 'allies')
  expect(allies).toHaveLength(6)
  expect(new Set(allies.map((unit) => unit.slot)).size).toBe(6)
  const { events, state } = playRound(battle)
  const mark = events.find((event) => event.actor === 'bound-curse' && event.spell === 'omen-mark')
  expect(mark).toBeDefined()
  expect(state.units.find((unit) => unit.id === mark?.target)?.effects).toContainEqual(expect.objectContaining({ kind: 'marked' }))
  expect(playRound(state).events).toContainEqual(expect.objectContaining({ actor: 'bound-curse', spell: 'omen-needle' }))
})

it('recompensa só vitórias válidas, uma vez, e conserva o nível ao trocar o vínculo', () => {
  const active = bindCurse(veteran(), 'bound-cinder')
  const pending = startAttempt(active, 'gate', 64)
  expect(settleAttempt(pending, pending.pending!, 'defeat').bindings).toEqual(active.bindings)
  const won = settleAttempt(pending, pending.pending!, 'victory')
  expect(won.bindings.experience['bound-cinder']).toBe(24)
  expect(settleAttempt(won, pending.pending!, 'victory')).toBe(won)
  const drill = startAttempt(won, 'drill', 66)
  expect(settleAttempt(drill, drill.pending!, 'victory').bindings).toEqual(won.bindings)
  const expedition = startAttempt(won, 'watch', 65)
  const advanced = settleAttempt(expedition, expedition.pending!, 'victory')
  expect(bindingRank(advanced.bindings, 'bound-cinder')).toBe(2)
  expect(bindCurse(advanced, 'bound-omen').bindings).toEqual({ active: 'bound-omen', experience: { 'bound-cinder': 48 } })
})

it('limita o Passo de Fenda e a caminhada ao piso da estação', () => {
  expect(skyGround(0.01, 0.02)).toEqual({ x: 0.28, y: 0.48 })
  expect(skyGround(0.78, 0.62)).toEqual({ x: 0.78, y: 0.62 })
  expect(skyGround(0.99, 0.99)).toEqual({ x: 0.87, y: 0.77 })
})
