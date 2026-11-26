import { encounters, troops, type EncounterId, type TroopId } from '../content/adventure'
import { classIds, classes, type ClassId, type Presentation } from '../content/classes'

import { goldLimit, isCity, newCity, updateCity, type City } from './city'
import { maxBuildingLevel } from '../content/city'
import { isCampaign, isZone, newCampaign, rewardExpedition, zoneUnlocked, type BattleScore, type Campaign } from './campaign'
import { eventMission, isEvents, newEvents, type Events } from './events'
import { isWardrobe, newWardrobe, styleBonuses, type Wardrobe } from './wardrobe'
import { relicSpec } from '../content/relics'
import { addRelic, addStock, equipRelic, gearBonuses, isRelicary, isRelicId, newRelicary, type Relicary } from './relicary'

import { startingMageLoadout, validMageLoadout, validMageRanks, type MageLoadout, type MageRanks } from './mage'

export const schemaVersion = 8
export const xpPerLevel = 100

export interface Hero {
  name: string
  classId: ClassId
  presentation: Presentation
  xp: number
}

export interface Attempt {
  id: number
  encounter: EncounterId
  seed: number
  challenge?: true
  teamSize?: number
}

export interface Recruit {
  id: TroopId
  slot: number
  level: number
}

export interface Profile {
  schemaVersion: typeof schemaVersion
  revision: string
  hero: Hero
  gold: number
  supplies: number
  pending: Attempt | null
  nextAttempt: number
  completed: EncounterId[]
  relicary: Relicary
  recruits: Recruit[]
  city: City
  campaign: Campaign
  wardrobe: Wardrobe
  events: Events
  mageRanks: MageRanks
  mageLoadout: MageLoadout | null
}

export function validName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 24 && !/[\u0000-\u001f\u007f]/u.test(name)
}

export function levelFor(xp: number): number {
  return Math.floor(xp / xpPerLevel) + 1
}

export function attributesFor(profile: Profile) {
  const base = classes[profile.hero.classId].attributes
  const gear = gearBonuses(profile.relicary)
  const clothes = styleBonuses(profile.wardrobe)
  const growth = levelFor(profile.hero.xp) - 1
  return {
    hp: base.hp + growth * 8 + gear.hp + clothes.hp,
    power: base.power + growth * 2 + gear.power + clothes.power + (profile.relicary.lineage === 'pest' ? 3 : 0),
    defense: base.defense + growth + gear.defense + clothes.defense,
    precision: gear.precision,
    resistance: gear.resistance + (profile.relicary.lineage === 'void' ? 10 : 0),
    affinity: gear.affinity,
    speed: base.speed,
  }
}

export function newProfile(name: string, classId: ClassId, presentation: Presentation): Profile {
  const normalizedName = name.trim()
  if (!validName(normalizedName)) throw new Error('Use de 2 a 24 caracteres no nome.')
  return {
    schemaVersion,
    revision: '',
    hero: { name: normalizedName, classId, presentation, xp: 0 },
    gold: 0,
    supplies: 0,
    pending: null,
    nextAttempt: 1,
    completed: [],
    relicary: newRelicary(),
    recruits: [],
    city: newCity(),
    campaign: newCampaign(),
    wardrobe: newWardrobe(),
    events: newEvents(),
    mageRanks: {},
    mageLoadout: classId === 'mage' ? startingMageLoadout() : null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isHero(value: unknown): value is Hero {
  return isRecord(value)
    && typeof value.name === 'string'
    && validName(value.name)
    && classIds.some((id) => id === value.classId)
    && (value.presentation === 'masculine' || value.presentation === 'feminine')
    && isCount(value.xp)
}

function isEncounter(value: unknown): value is EncounterId {
  return typeof value === 'string' && Object.hasOwn(encounters, value)
}

export function isTroop(value: unknown): value is TroopId {
  return typeof value === 'string' && Object.hasOwn(troops, value)
}

function validSlot(value: unknown): value is number {
  return isCount(value) && value < 6 && value !== 1
}

function isRecruit(value: unknown): value is Recruit {
  return isRecord(value) && isTroop(value.id) && validSlot(value.slot)
    && isCount(value.level) && value.level >= 1 && value.level <= maxBuildingLevel
}

function isAttempt(value: unknown): value is Attempt {
  return isRecord(value) && isCount(value.id) && value.id > 0 && isEncounter(value.encounter)
    && isCount(value.seed) && value.seed <= 0xffffffff
    && (value.challenge === undefined || (value.challenge === true && isZone(value.encounter)))
    && (value.teamSize === undefined || (value.encounter === 'nest' && isCount(value.teamSize) && value.teamSize >= 2 && value.teamSize <= 4))
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value) || value.schemaVersion !== schemaVersion || !isHero(value.hero)) return false
  const { completed, recruits, nextAttempt, pending } = value
  const mage = value.hero.classId === 'mage'
  return validMageRanks(value.mageRanks, value.hero.xp, mage) && validMageLoadout(value.mageLoadout, value.mageRanks, mage)
    && isCity(value.city) && isRelicary(value.relicary) && isCampaign(value.campaign) && isWardrobe(value.wardrobe) && isEvents(value.events) && typeof value.revision === 'string' && isCount(value.gold) && isCount(value.supplies)
    && isCount(nextAttempt) && nextAttempt > 0
    && Array.isArray(completed) && completed.every(isEncounter) && new Set(completed).size === completed.length
    && Array.isArray(recruits) && recruits.every(isRecruit) && new Set(recruits.map((unit) => unit.id)).size === recruits.length
    && new Set(recruits.map((unit) => unit.slot)).size === recruits.length
    && (pending === null || (isAttempt(pending) && pending.id < nextAttempt && !completed.includes(pending.encounter)))
}

export function decodeProfile(value: unknown): Profile | null {
  if (isProfile(value)) return value
  const mageLoadout = isRecord(value) && isHero(value.hero) && value.hero.classId === 'mage' ? startingMageLoadout() : null
  if (isRecord(value) && value.schemaVersion === 7) {
    const migrated = { ...value, schemaVersion, mageLoadout }
    return isProfile(migrated) ? migrated : null
  }
  if (isRecord(value) && (value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6)) {
    const migrated = { ...value, schemaVersion, campaign: value.schemaVersion === 4 ? newCampaign() : value.campaign,
      wardrobe: value.schemaVersion === 6 ? value.wardrobe : newWardrobe(), events: value.schemaVersion === 6 ? value.events : newEvents(), mageRanks: {}, mageLoadout }
    return isProfile(migrated) ? migrated : null
  }
  if (isRecord(value) && (value.schemaVersion === 2 || value.schemaVersion === 3)
    && Array.isArray(value.recruits) && Array.isArray(value.inventory) && value.inventory.every(isRelicId)) {
    const { inventory, equipped, ...legacy } = value
    let relicary = inventory.reduce((bag, id) => addRelic(bag, id), newRelicary())
    if (isRelicId(equipped) && inventory.includes(equipped)) {
      relicary = equipRelic(relicary, equipped, relicSpec(equipped).slots[0]!)
    }
    const migrated = {
      ...legacy,
      schemaVersion,
      relicary,
      campaign: newCampaign(),
      wardrobe: newWardrobe(),
      events: newEvents(),
      mageRanks: {},
      mageLoadout,
      city: legacy.schemaVersion === 2 ? newCity() : legacy.city,
      recruits: legacy.schemaVersion === 2 ? value.recruits.map((entry) => isRecord(entry) ? { ...entry, level: 1 } : entry) : value.recruits,
    }
    return isProfile(migrated) ? migrated : null
  }
  if (isRecord(value) && value.schemaVersion === 1 && isHero(value.hero)
    && typeof value.revision === 'string' && isCount(value.gold) && isCount(value.supplies)) {
    return {
      ...newProfile(value.hero.name, value.hero.classId, value.hero.presentation),
      revision: value.revision,
      hero: value.hero,
      gold: value.gold,
      supplies: value.supplies,
    }
  }
  return null
}

export function startAttempt(profile: Profile, encounter: EncounterId, seed: number, options: { challenge?: boolean; teamSize?: number } = {}): Profile {
  if (profile.pending) {
    if (profile.pending.encounter !== encounter) throw new Error('Conclua o encontro atual antes de abrir outro.')
    return profile
  }
  if (isZone(encounter) && !zoneUnlocked(profile, encounter)) throw new Error('Conclua o encontro anterior.')
  if (profile.completed.includes(encounter)) throw new Error('Este encontro já foi concluído.')
  if (encounter !== 'ruins' && !profile.completed.includes('ruins')) throw new Error('Conclua as Ruínas do Farol primeiro.')
  return {
    ...profile,
    pending: { id: profile.nextAttempt, encounter, seed,
      ...(options.challenge && isZone(encounter) ? { challenge: true as const } : {}),
      ...(encounter === 'nest' ? { teamSize: Math.min(4, Math.max(2, Math.floor(options.teamSize ?? 2))) } : {}),
    },
    nextAttempt: profile.nextAttempt + 1,
  }
}

export function settleAttempt(profile: Profile, attempt: Attempt, result: 'victory' | 'defeat', now = Date.now(), score?: BattleScore): Profile {
  const active = profile.pending
  if (active?.id !== attempt.id || active.encounter !== attempt.encounter || active.seed !== attempt.seed) {
    return profile
  }
  profile = updateCity(profile, now)
  if (result === 'defeat' || attempt.encounter === 'drill') return { ...profile, pending: null }
  const reward = encounters[attempt.encounter].reward
  const gold = Math.max(profile.gold, Math.min(goldLimit(profile.city), profile.gold + reward.gold))
  if (isZone(attempt.encounter)) {
    const prepared = { ...profile, gold, supplies: profile.supplies + reward.supplies }
    return eventMission(rewardExpedition(prepared, active, attempt.encounter, reward.xp, score), now)
  }
  return {
    ...profile,
    pending: null,
    completed: [...profile.completed, attempt.encounter],
    gold,
    supplies: profile.supplies + reward.supplies,
    hero: { ...profile.hero, xp: profile.hero.xp + reward.xp },
    relicary: addStock(reward.itemId ? addRelic(profile.relicary, reward.itemId) : profile.relicary, attempt.encounter === 'ruins'
      ? { ash: 12, ichor: 3, 'pin-power': 1, graft: 1 }
      : { ash: 18, ichor: 6, 'pin-guard': 1, 'curse-core': 1 }),
    city: profile.city.farm.since === null ? { ...profile.city, farm: { stored: 0, since: now } } : profile.city,
  }
}

export function hire(profile: Profile, id: TroopId): Profile {
  const troop = troops[id]
  if (!profile.completed.includes('ruins') || profile.pending) throw new Error('O recrutamento está indisponível.')
  if (profile.recruits.some((unit) => unit.id === id)) throw new Error('Esta tropa já está na sua formação.')
  if (profile.gold < troop.gold || profile.supplies < troop.supplies) throw new Error('Recursos insuficientes.')
  const preferred = id === 'sentry' ? [0, 2, 3, 4, 5] : [4, 3, 5, 0, 2]
  const slot = preferred.find((position) => profile.recruits.every((unit) => unit.slot !== position))
  if (slot === undefined) throw new Error('A formação está cheia.')
  return {
    ...profile,
    gold: profile.gold - troop.gold,
    supplies: profile.supplies - troop.supplies,
    recruits: [...profile.recruits, { id, slot, level: 1 }],
  }
}

export function moveRecruit(profile: Profile, id: TroopId, slot: number): Profile {
  if (profile.pending || !validSlot(slot)) throw new Error('Posição indisponível.')
  if (!profile.recruits.some((unit) => unit.id === id)) throw new Error('Recrute esta tropa primeiro.')
  if (profile.recruits.some((unit) => unit.id !== id && unit.slot === slot)) throw new Error('Uma tropa já ocupa esta posição.')
  return { ...profile, recruits: profile.recruits.map((unit) => unit.id === id ? { ...unit, slot } : unit) }
}

export function equip(profile: Profile, key: string, slot?: Parameters<typeof equipRelic>[2]): Profile {
  if (profile.pending) throw new Error('Equipe a relíquia na base.')
  const item = profile.relicary.relics.find((entry) => entry.key === key)
  if (!item) throw new Error('Esta relíquia está indisponível.')
  const destination = slot ?? relicSpec(item.id).slots[0]!
  if (isTroop(destination) && !profile.recruits.some((entry) => entry.id === destination)) throw new Error('Recrute a tropa primeiro.')
  return { ...profile, relicary: equipRelic(profile.relicary, key, destination) }
}

export function trainingCost(level: number) {
  return { gold: 8 * level, supplies: 2 * level }
}

export function trainRecruit(profile: Profile, id: TroopId): Profile {
  const recruit = profile.recruits.find((entry) => entry.id === id)
  if (!recruit || profile.pending) throw new Error('Treinamento indisponível.')
  if (recruit.level >= profile.city.buildings.barracks.level) {
    throw new Error('Melhore o Quartel para aumentar o limite de treinamento.')
  }
  const { gold, supplies } = trainingCost(recruit.level)
  if (profile.gold < gold || profile.supplies < supplies) throw new Error('Recursos insuficientes.')
  return {
    ...profile,
    gold: profile.gold - gold,
    supplies: profile.supplies - supplies,
    recruits: profile.recruits.map((entry) => entry.id === id ? { ...entry, level: entry.level + 1 } : entry),
  }
}

export function recruitAttributes(recruit: Recruit, relicary = newRelicary()) {
  const unit = troops[recruit.id]
  const growth = recruit.level - 1
  const gear = gearBonuses(relicary, recruit.id)
  return { hp: unit.hp + 10 * growth + gear.hp, power: unit.power + 3 * growth + gear.power, defense: unit.defense + growth + gear.defense, speed: unit.speed, precision: gear.precision, resistance: gear.resistance }
}
