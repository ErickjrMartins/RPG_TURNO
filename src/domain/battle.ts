import { abyssSpecs, effectNames, skillsByClass, troops, type EffectKind, type Skill, type Visual } from '../content/adventure'
import { zone } from '../content/campaign'
import type { BossId } from '../content/bosses'
import { monsters, type MonsterId } from '../content/monsters'
import type { Attributes, ClassId } from '../content/classes'
import { configuredMageSpell, isMageSpell, mageBonuses } from './mage'
import { isZone } from './campaign'
import { styleBonuses } from './wardrobe'
import { glyphFamily, type Mastery } from './relicary'
import { attributesFor, levelFor, recruitAttributes, type Attempt, type Profile } from './profile'

export type Team = 'allies' | 'enemies'
export type Phase = 'player' | 'resolution' | 'victory' | 'defeat'
type Art = 'hero' | 'sentry' | 'bowman' | 'crawler' | 'wisp' | 'warden' | MonsterId

interface Effect {
  kind: EffectKind
  strength: number
  rounds: number
}

export interface Unit extends Attributes {
  id: string
  name: string
  art: Art
  team: Team
  slot: number
  maxHp: number
  effects: Effect[]
  precision: number
  resistance: number
  boss?: BossId
}

export interface Abyss {
  classId: ClassId
  rounds: number
  rank: number
  target: string
  rear: boolean
}

export interface Battle {
  attempt: Attempt
  phase: Phase
  round: number
  units: Unit[]
  energy: number
  cooldowns: Record<string, number>
  skills: readonly Skill[]
  seed: number
  queue: string[]
  reinforced: boolean
  classId: ClassId
  abyss: Abyss | null
  abyssRank: number
  jurasUnlocked: boolean
  macula: number
  corrosion: number
  affinity: number
  glyph: 'pest' | 'void' | null
  mastery: Record<string, Mastery>
  nucleus: boolean
  magePulse: number
  mageHealing: number
  sealed: boolean
}

export interface BattleEvent {
  kind: 'damage' | 'heal' | 'effect' | 'summon' | 'action' | 'round' | 'abyss-start' | 'abyss-end' | 'jura'
  text: string
  target?: string
  actor?: string
  amount?: number
  visual?: Visual
  spell?: string
  ability?: string
  targets?: string[]
}

interface Transition {
  state: Battle
  events: BattleEvent[]
}

const basicNpcSkill: Skill = {
  id: 'npc-attack', name: 'Ataque', icon: '', description: '', cost: 0, cooldown: 0, target: 'front', damage: 1,
}

function unit(id: string, name: string, art: Art, team: Team, slot: number, attributes: Attributes & { precision?: number; resistance?: number }): Unit {
  return { id, name, art, team, slot, ...attributes, maxHp: attributes.hp, precision: attributes.precision ?? 0, resistance: attributes.resistance ?? 0, effects: [] }
}

export function startBattle(profile: Profile): Battle {
  const attempt = profile.pending
  if (!attempt) throw new Error('Não há um encontro em andamento.')
  const heroStats = attributesFor(profile)
  const hero = unit('hero', profile.hero.name, 'hero', 'allies', 1, heroStats)
  const units = [hero]
  if (attempt.encounter === 'ruins') {
    units.push(
      unit('guide', 'Guarda de Alvor', 'sentry', 'allies', 0, { hp: 72, power: 15, defense: 7, speed: 8 }),
      unit('crawler', 'Rastejante de Pedra', 'crawler', 'enemies', 1, { hp: 50, power: 14, defense: 5, speed: 6 }),
      unit('wisp', 'Vulto do Véu', 'wisp', 'enemies', 4, { hp: 37, power: 14, defense: 3, speed: 9 }),
    )
  } else if (attempt.encounter === 'drill') {
    drillFormation(units);
  } else {
    for (const recruit of profile.recruits) {
      units.push(unit(recruit.id, troops[recruit.id].name, recruit.id, 'allies', recruit.slot, recruitAttributes(recruit, profile.relicary)))
    }
    if (isZone(attempt.encounter)) {
      const stage = zone(attempt.encounter)
      for (let slot = 0; slot < stage.focus; slot++) {
        const id = stage.monsters?.[slot]
        const position = [1, 4, 0][slot]!
        if (id) {
          const monster = monsters[id]
          units.push(unit(`focus-${slot}`, monster.name, monster.art, 'enemies', position, monster))
        } else {
          units.push(unit(`focus-${slot}`, `Foco de Mácula ${slot + 1}`, slot % 2 ? 'wisp' : 'crawler', 'enemies', position,
            { hp: 29 + slot * 8, power: 10 + slot, defense: 5, speed: 6 + slot }))
        }
      }
      for (let seat = 2; seat <= (attempt.teamSize ?? 1); seat++) {
        const slot = [0, 2, 3, 4, 5].find((spot) => !units.some((entry) => entry.team === 'allies' && entry.slot === spot))!
        units.push(unit(`local-${seat}`, `Aliado local ${seat}`, seat % 2 ? 'bowman' : 'sentry', 'allies', slot,
          { hp: 73, power: 13, defense: 6, speed: 7 + seat }))
      }
    } else {
      units.push({ ...unit('warden', 'Guardião do Portão', 'warden', 'enemies', 1, { hp: 120, power: 21, defense: 9, speed: 9 }), boss: 'gate' })
    }
  }
  const classId = profile.hero.classId
  const jurasUnlocked = attempt.encounter !== 'ruins'
  const abyssRank = levelFor(profile.hero.xp) >= 2 && (profile.city.buildings.council.level >= 2 || profile.completed.includes('gate')) ? 2 : 1
  const glyph = glyphFamily(profile.relicary)
  const arcana = mageBonuses(profile.mageRanks, profile.mageLoadout)
  const baseSkills = skillsByClass[classId].map((skill): Skill => {
    if (classId !== 'mage') return skill
    if (skill.id === 'spark' && arcana.spark) return { ...skill, damage: (skill.damage ?? 0) * (1 + arcana.spark), description: `${skill.description} Árvore: +${Math.round(arcana.spark * 100)}% de potência.` }
    if (skill.id === 'rain' && skill.effect && arcana.burn) return { ...skill, effect: { ...skill.effect, strength: skill.effect.strength + arcana.burn }, description: `${skill.description} Árvore: +${arcana.burn} dano periódico.` }
    const extraHeal = skill.id === 'renew' ? arcana.renew : skill.id === 'chorus' ? arcana.chorus : 0
    return extraHeal && skill.heal ? { ...skill, heal: skill.heal + extraHeal, description: `${skill.description} Árvore: +${extraHeal} cura.` } : skill
  })
  const loadout = profile.mageLoadout
  const readySkills = loadout ? loadout.active.flatMap((id) => isMageSpell(id)
    ? [configuredMageSpell(id, profile.mageRanks)] : baseSkills.filter((skill) => skill.id === id)) : baseSkills
  const abyss = { ...abyssSpecs[classId], cost: abyssSpecs[classId].cost - arcana.abyssDiscount }
  return {
    attempt,
    phase: 'player',
    round: 1,
    units,
    energy: (glyph === 'pest' ? 30 : 20) + styleBonuses(profile.wardrobe).energy + arcana.focus,
    cooldowns: {},
    skills: jurasUnlocked ? [...readySkills, abyss] : baseSkills.filter((skill) => skill.id !== 'chorus'),
    seed: attempt.seed,
    queue: [],
    reinforced: false,
    classId,
    jurasUnlocked,
    abyssRank,
    abyss: null,
    macula: jurasUnlocked ? 24 + arcana.macula : 0,
    corrosion: 0,
    affinity: heroStats.affinity + arcana.affinity,
    glyph,
    mastery: profile.relicary.mastery,
    nucleus: false,
    magePulse: arcana.pulse,
    mageHealing: 1 + arcana.healing,
    sealed: false,
  }
}

function drillFormation(units: Unit[]): void {
  for (const slot of [0, 2, 3, 4, 5]) {
    const type = slot < 3 ? 'sentry' : 'bowman'
    units.push(unit(`drill-ally-${slot}`, `${troops[type].name} ${slot + 1}`, type, 'allies', slot,
      { hp: 65, power: 10, defense: 5, speed: slot < 3 ? 6 : 10 }))
  }
  for (let slot = 0; slot < 6; slot++) {
    const front = slot < 3
    units.push(unit(`drill-enemy-${slot}`, `${front ? 'Eco de Rocha' : 'Eco do Véu'} ${slot + 1}`,
      front ? 'crawler' : 'wisp', 'enemies', slot, { hp: front ? 72 : 55, power: 6, defense: 5, speed: 7 + slot }))
  }
}

function clone(state: Battle): Battle {
  return {
    ...state,
    units: state.units.map((entry) => ({ ...entry, effects: entry.effects.map((effect) => ({ ...effect })) })),
    cooldowns: { ...state.cooldowns },
    queue: [...state.queue],
    abyss: state.abyss ? { ...state.abyss } : null,
  }
}

export function shieldOf(entry: Unit): number {
  return entry.effects.find((effect) => effect.kind === 'shield')?.strength ?? 0
}

export function availableTargets(state: Battle, skill: Skill): Unit[] {
  const living = state.units.filter((entry) => entry.hp > 0)
  if (skill.target === 'self') return living.filter((entry) => entry.id === 'hero')
  if (skill.target === 'allies') return living.filter((entry) => entry.id === 'hero')
  if (skill.target === 'ally') return living.filter((entry) => entry.team === 'allies')
  if (skill.target === 'lowest-ally') {
    return living.filter((entry) => entry.team === 'allies')
      .sort((first, second) => first.hp * second.maxHp - second.hp * first.maxHp || first.slot - second.slot).slice(0, 1)
  }
  const enemies = living.filter((entry) => entry.team === 'enemies')
  const front = enemies.filter((entry) => entry.slot < 3)
  return skill.target === 'front' && front.length ? front : enemies
}

export function skillUsesMacula(skill: Skill): boolean {
  return Boolean(skill.abyss || skill.resource === 'macula')
}

export function skillBlocked(state: Battle, skill: Skill): string | null {
  if (state.phase !== 'player') return 'Aguarde a resolução'
  if (skill.abyss && state.abyss) return 'Abismo já ativo'
  const cooldown = state.cooldowns[skill.id] ?? 0
  if (cooldown > 0) return `${cooldown} ${cooldown === 1 ? 'rodada' : 'rodadas'} de recarga`
  if (skillUsesMacula(skill)) return state.macula < skill.cost ? 'Mácula insuficiente' : null
  if (state.energy < skill.cost) return 'Recurso insuficiente'
  return null
}

function random(state: Battle): number {
  // A full-period 32-bit LCG keeps replay independent of the renderer and Math.random.
  state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0
  return state.seed / 0x100000000
}

function damage(state: Battle, target: Unit, amount: number, source: string, events: BattleEvent[]): void {
  if (state.sealed && target.id === 'nucleus') {
    events.push({ kind: 'effect', target: target.id, text: 'A barreira do núcleo absorveu o golpe.' })
    return
  }
  if (state.abyss?.classId === 'warrior' && target.team === 'allies') {
    amount = Math.max(1, Math.round(amount * (state.abyss.rank === 2 ? 0.64 : 0.7)))
  }
  const shield = target.effects.find((effect) => effect.kind === 'shield')
  const absorbed = Math.min(amount, shield?.strength ?? 0)
  if (shield) shield.strength -= absorbed
  const hit = Math.min(target.hp, amount - absorbed)
  target.hp -= hit
  if (shield?.strength === 0) target.effects = target.effects.filter((effect) => effect !== shield)
  const blocked = absorbed > 0 ? ` (${absorbed} no escudo)` : ''
  const fallen = target.hp === 0 ? ' e caiu' : ''
  events.push({ kind: 'damage', actor: source, target: target.id, amount: hit, text: `${target.name} sofreu ${hit} de dano${blocked}${fallen}.` })
}

function heal(target: Unit, potency: number, actor: string, events: BattleEvent[]): void {
  if (target.hp <= 0) return
  const amount = Math.min(Math.round(potency), target.maxHp - target.hp)
  target.hp += amount
  events.push({ kind: 'heal', actor, target: target.id, amount, text: `${target.name} recuperou ${amount} de vida.` })
}

function applySkill(state: Battle, actor: Unit, targets: Unit[], skill: Skill, events: BattleEvent[], powerUp = 1): void {
  const visual = skill.visual ?? (skill.heal ? 'heal' : actor.art === 'bowman' ? 'arrow' : 'slash')
  events.push({ kind: 'action', actor: actor.id, target: targets[0]?.id, targets: targets.map((entry) => entry.id), visual, spell: skill.id,
    ability: actor.boss && skill.name !== basicNpcSkill.name ? skill.name : undefined, text: `${actor.name} usou ${skill.name}.` })
  const healingPower = powerUp * (actor.id === 'hero' ? state.mageHealing : 1)
  for (const target of targets) {
    if (skill.damage) {
      const hunter = state.abyss?.classId === 'archer' && state.abyss.target === target.id && actor.team === 'allies'
      const mark = (target.effects.find((effect) => effect.kind === 'marked')?.strength ?? 0) + (hunter ? (state.abyss?.rank === 2 ? 0.5 : 0.4) : 0)
      const weak = actor.effects.find((effect) => effect.kind === 'weakened')?.strength ?? 0
      const roll = random(state)
      const critical = roll < Math.min(0.35, 0.1 + actor.precision / 500)
      const power = actor.power * skill.damage * powerUp * (state.attempt.challenge && actor.team === 'enemies' ? 1.35 : 1) * (1 - weak) * (critical ? 1.45 : 0.91 + roll * 0.18)
      const inCircle = actor.id === 'hero' && state.abyss?.classId === 'mage' && (target.slot >= 3) === state.abyss.rear
      const amount = Math.max(1, Math.round((power - target.defense * 0.55) * (1 + mark) * (inCircle ? 1.2 : 1)))
      damage(state, target, amount, actor.id, events)
      if (critical) events.push({ kind: 'effect', target: target.id, text: 'Acerto crítico!' })
    }
    if (skill.heal || skill.healPercent) heal(target, ((skill.heal ?? 0) + (skill.healPercent ?? 0) * target.maxHp) * healingPower, actor.id, events)
    if (skill.effect && target.hp > 0) {
      const effect = skill.effect
      const friendly = effect.kind === 'shield' || effect.kind === 'mending'
      const scaled = effect.strength * (effect.kind === 'mending' ? healingPower : powerUp)
      const strength = effect.kind === 'shield' || effect.kind === 'burning' ? Math.round(scaled) : scaled
      const rounds = friendly ? effect.rounds : Math.max(1, effect.rounds - Math.floor(target.resistance / 10))
        + (state.glyph === 'void' && actor.id === 'hero' ? 1 : 0)
      target.effects = [...target.effects.filter((entry) => entry.kind !== effect.kind), { kind: effect.kind, strength, rounds }]
      events.push({ kind: 'effect', target: target.id, text: `${target.name} recebeu ${effectNames[effect.kind]}.` })
    }
  }
}

function checkOutcome(state: Battle, events: BattleEvent[]): void {
  if (state.units.find((entry) => entry.id === 'hero')?.hp === 0) state.phase = 'defeat'
  else if (state.units.every((entry) => entry.team === 'allies' || entry.hp === 0) && (state.nucleus || !isZone(state.attempt.encounter))) state.phase = 'victory'
  else {
    if (isZone(state.attempt.encounter) && !state.nucleus
      && state.units.every((entry) => entry.team === 'allies' || entry.hp === 0)) {
      const { core } = zone(state.attempt.encounter)
      state.units = state.units.filter((entry) => entry.team === 'allies')
      state.units.push({ ...unit('nucleus', core.name, core.art ?? 'warden', 'enemies', 1, core.stats), boss: state.attempt.encounter })
      state.nucleus = true
      state.sealed = state.attempt.encounter === 'nest'
      events.push({ kind: 'summon', target: 'nucleus', text: state.sealed ? 'Barreira erguida. Abra um Abismo para romper o selo.' : `${core.name} emergiu.` })
    }
    if (state.abyss?.classId === 'archer' && !state.units.some((entry) => entry.id === state.abyss?.target && entry.hp > 0)) {
      const next = state.units.filter((entry) => entry.team === 'enemies' && entry.hp > 0)
        .sort((first, second) => second.power - first.power || first.slot - second.slot)[0]!
      state.abyss.target = next.id
      events.push({ kind: 'effect', target: next.id, text: `O Firmamento marcou ${next.name}.` })
    }
    const boss = state.units.find((entry) => entry.id === 'warden')
    if (boss && boss.hp > 0 && boss.hp < boss.maxHp / 2 && !state.reinforced) {
      state.reinforced = true
      state.units.push(unit('reinforcement', 'Vulto Invocado', 'wisp', 'enemies', 4, { hp: 33, power: 14, defense: 3, speed: 10 }))
      events.push({ kind: 'summon', target: 'reinforcement', text: 'O Guardião invocou um vulto. Prepare-se para o Corte do Véu!' })
    }
  }
}

export function areaTargets(state: Battle, skill: Skill, target: Unit): Unit[] {
  if (skill.target === 'allies' || skill.target === 'enemies') {
    return state.units.filter((entry) => entry.team === (skill.target === 'allies' ? 'allies' : 'enemies') && entry.hp > 0)
  }
  if (skill.target === 'row') {
    return state.units.filter((entry) => entry.team === target.team && (entry.slot < 3) === (target.slot < 3) && entry.hp > 0)
  }
  return [target]
}

export function juraCost(state: Battle, skillId: string): number {
  const hero = state.units.find((entry) => entry.id === 'hero')!
  const mastery = state.mastery[skillId]
  const branch = Number(mastery?.[5] === 'oath') + Number(mastery?.[10] === 'oath')
  return Math.max(1, Math.ceil(hero.maxHp * 0.1) - state.affinity - branch * 2)
}

export function abyssRounds(state: Battle): number {
  return state.classId === 'mage' ? 3 : state.abyssRank + 1
}

function openAbyss(state: Battle, actor: Unit, target: Unit, targets: Unit[], skill: Skill, events: BattleEvent[]): void {
  const { classId, abyssRank: rank } = state
  const rounds = abyssRounds(state)
  state.abyss = { classId, rounds, rank, target: target.id, rear: target.slot >= 3 }
  state.macula -= skill.cost
  if (state.sealed) {
    state.sealed = false
    events.push({ kind: 'effect', target: 'nucleus', text: 'O Abismo quebrou a barreira do núcleo.' })
  }
  events.push({ kind: 'abyss-start', actor: actor.id, targets: targets.map((entry) => entry.id), visual: 'abyss', spell: skill.id, text: `${skill.name} aberto por ${rounds} rodadas.` })
  if (classId === 'warrior') {
    applySkill(state, actor, targets, { ...skill, visual: 'ward', effect: { kind: 'shield', strength: rank === 2 ? 30 : 20, rounds } }, events)
  }
}

export function initiative(state: Battle): Unit[] {
  const effective = (unit: Unit) => unit.speed - (state.abyss?.classId === 'mage'
    && unit.team === 'enemies' && (unit.slot >= 3) === state.abyss.rear ? 4 : 0)
  return state.units.filter((entry) => entry.id !== 'hero' && entry.hp > 0)
    .sort((first, second) => effective(second) - effective(first) || first.id.localeCompare(second.id, 'en'))
}

export function playerAction(previous: Battle, skillId: string, targetId: string, overcharge = false): Transition {
  const skill = previous.skills.find((entry) => entry.id === skillId)
  if (!skill || skillBlocked(previous, skill)) throw new Error('Esta habilidade está indisponível.')
  if (!availableTargets(previous, skill).some((entry) => entry.id === targetId)) throw new Error('Alvo inválido.')
  const state = clone(previous)
  const actor = state.units.find((entry) => entry.id === 'hero')!
  const target = state.units.find((entry) => entry.id === targetId)!
  const targets = areaTargets(state, skill, target)
  const events: BattleEvent[] = []
  if (overcharge) {
    const cost = juraCost(state, skillId)
    if (!state.jurasUnlocked || skillUsesMacula(skill) || !skill.cost || actor.hp <= cost || state.corrosion >= 3) throw new Error('Jura Profana indisponível.')
    actor.hp -= cost
    state.corrosion++
    events.push({ kind: 'jura', actor: actor.id, target: actor.id, text: `Jura Profana: −${cost} Vida, Corrosão Interna ${state.corrosion}/3.` })
  }
  state.phase = 'resolution'
  if (skill.cooldown) state.cooldowns[skill.id] = skill.cooldown + 1
  if (skill.abyss) {
    openAbyss(state, actor, target, targets, skill, events)
  } else {
    if (skillUsesMacula(skill)) state.macula -= skill.cost
    else {
      state.energy = Math.min(100, state.energy - skill.cost + (skill.energy ?? 0))
      if (state.jurasUnlocked) state.macula = Math.min(100, state.macula + (overcharge ? 38 : 24))
    }
    const mastery = state.mastery[skillId]
    const chosenPath = overcharge ? 'oath' : 'safe'
    const branch = Number(mastery?.[5] === chosenPath) + Number(mastery?.[10] === chosenPath)
    const potency = 1 + (overcharge ? 0.3 : 0) + ((mastery?.level ?? 1) - 1) * 0.02 + branch * 0.06
    applySkill(state, actor, targets, skill, events, potency)
  }
  checkOutcome(state, events)
  state.queue = initiative(state).map((entry) => entry.id)
  return { state, events }
}

function targetsForNpc(state: Battle, actor: Unit): Unit[] {
  const opponents = state.units.filter((entry) => entry.team !== actor.team && entry.hp > 0)
  const front = opponents.filter((entry) => entry.slot < 3)
  if (actor.art === 'frostcat') {
    const rear = opponents.filter((entry) => entry.slot >= 3)
    if (rear.length) return rear.sort((first, second) => first.hp - second.hp)
  }
  if (actor.art === 'moth') return opponents.sort((first, second) => first.defense - second.defense)
  const preferred = actor.art === 'wisp' || actor.art === 'bowman' || front.length === 0 ? opponents : front
  return preferred.sort((first, second) => first.hp - second.hp || first.slot - second.slot)
}

export function advanceBattle(previous: Battle): Transition {
  if (previous.phase !== 'resolution') throw new Error('A batalha não está em resolução.')
  const state = clone(previous)
  const events: BattleEvent[] = []
  const actorId = state.queue.shift()
  if (actorId) {
    const actor = state.units.find((entry) => entry.id === actorId)
    if (actor && actor.hp > 0) {
      const targets = targetsForNpc(state, actor)
      const wounded = state.units.find((entry) => entry.team === actor.team && entry.id !== actor.id && entry.hp > 0 && entry.hp < entry.maxHp * 0.33)
      if (actor.art === 'rootbound' && state.round % 2 === 0) {
        applySkill(state, actor, targets.slice(0, 1), { ...basicNpcSkill, name: 'Raízes Afogadas', visual: 'hex',
          damage: 0.85, effect: { kind: 'weakened', strength: 0.26, rounds: 2 } }, events)
      } else if (actor.art === 'moth' && state.round % 2 === 1) {
        applySkill(state, actor, targets.slice(0, 1), { ...basicNpcSkill, name: 'Escamas do Abismo', visual: 'hex',
          damage: 0.75, effect: { kind: 'marked', strength: 0.25, rounds: 2 } }, events)
      } else if (actor.art === 'glacier' && state.round % 3 === 0) {
        applySkill(state, actor, [actor], { ...basicNpcSkill, name: 'Muralha Glacial', visual: 'ward',
          damage: 0, effect: { kind: 'shield', strength: 25, rounds: 2 } }, events)
      } else if (actor.art === 'frostcat') {
        applySkill(state, actor, targets.slice(0, 1), { ...basicNpcSkill, name: 'Salto de Geada', damage: 1.12 }, events)
      } else if (actor.art === 'wisp' && wounded && state.round % 2 === 0) {
        applySkill(state, actor, [wounded], { ...basicNpcSkill, name: 'Sopro do Véu', damage: 0, heal: 13 }, events)
      } else if (actor.art === 'warden' && state.reinforced && state.round % 2 === 0) {
        applySkill(state, actor, targets.slice(0, 2), { ...basicNpcSkill, name: 'Corte do Véu', damage: 1.1 }, events)
      } else {
        applySkill(state, actor, targets.slice(0, 1), basicNpcSkill, events)
      }
    }
    checkOutcome(state, events)
    return { state, events }
  }
  for (const entry of state.units) {
    if (entry.hp <= 0) continue
    for (const effect of entry.effects) {
      if (effect.kind === 'burning') damage(state, entry, effect.strength, entry.id, events)
      if (effect.kind === 'mending') heal(entry, entry.maxHp * effect.strength, 'hero', events)
      effect.rounds--
    }
    entry.effects = entry.effects.filter((effect) => effect.rounds > 0)
  }
  if (state.abyss) {
    if (state.abyss.classId === 'mage') {
      const affected = state.units.filter((entry) => entry.hp > 0 && entry.team === 'enemies' && (entry.slot >= 3) === state.abyss?.rear)
      if (affected.length) events.push({ kind: 'action', actor: 'hero', visual: 'blast', spell: 'void-pulse', targets: affected.map((entry) => entry.id), text: 'O Círculo do Vazio pulsa.' })
      for (const entry of affected) damage(state, entry, (state.abyss.rank === 2 ? 12 : 9) + state.magePulse, 'hero', events)
    }
    state.abyss.rounds--
    if (state.abyss.rounds === 0) {
      events.push({ kind: 'abyss-end', text: `${abyssSpecs[state.abyss.classId].name} se desfez.` })
      state.abyss = null
    }
  }
  const hero = state.units.find((entry) => entry.id === 'hero')!
  if (state.corrosion > 0) {
    const harm = Math.min(hero.hp, state.corrosion * 2)
    hero.hp -= harm
    events.push({ kind: 'damage', target: 'hero', amount: harm, text: `Corrosão Interna causou ${harm} de dano.` })
  }
  checkOutcome(state, events)
  if (state.phase === 'resolution') {
    state.round++
    state.energy = Math.min(100, state.energy + 5)
    for (const key of Object.keys(state.cooldowns)) state.cooldowns[key] = Math.max(0, (state.cooldowns[key] ?? 0) - 1)
    state.phase = 'player'
    events.push({ kind: 'round', text: `Rodada ${state.round}. Escolha sua habilidade.` })
  }
  return { state, events }
}
