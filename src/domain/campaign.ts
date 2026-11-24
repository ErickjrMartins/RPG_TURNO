import { challengeBonus, coreExchange, dailyEnergy, sweepCost, zones, type ZoneId } from '../content/campaign'
import type { RelicId, StockId } from '../content/relics'
import type { Attempt, Profile } from './profile'
import { addRelic, addStock, isRelicId, isStock } from './relicary'

interface RecordOfZone { clears: number; stars: number }
export interface Spoil {
  seat: number
  rewards: Partial<Record<StockId, number>>
  relic: RelicId | null
}

export interface Campaign {
  zones: Partial<Record<ZoneId, RecordOfZone>>
  chargeDay: string
  usedEnergy: number
  last: { attempt: number; zone: ZoneId; stars: number; first: boolean; spoils: Spoil[] } | null
}

export interface BattleScore {
  rounds: number
  fallen: number
  corrosion: number
}

export function newCampaign(): Campaign {
  return { zones: {}, chargeDay: '', usedEnergy: 0, last: null }
}

export function isZone(value: unknown): value is ZoneId { return typeof value === 'string' && Object.hasOwn(zones, value) }

export function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^(\d{4}-\d{2}-\d{2}|)$/.test(value)
}

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function count(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max
}

export function isCampaign(value: unknown): value is Campaign {
  if (!record(value) || !record(value.zones) || !isDay(value.chargeDay) || !count(value.usedEnergy, dailyEnergy)) return false
  const valid = Object.entries(value.zones).every(([id, zone]) => isZone(id) && record(zone) && count(zone.clears) && count(zone.stars, 3))
  if (!valid || value.last === null) return valid
  const last = value.last
  return record(last) && count(last.attempt) && isZone(last.zone) && count(last.stars, 3) && typeof last.first === 'boolean'
    && Array.isArray(last.spoils) && last.spoils.length >= 1 && last.spoils.length <= 4
    && last.spoils.every((loot) => record(loot) && count(loot.seat, 4) && record(loot.rewards)
      && Object.entries(loot.rewards).every(([id, amount]) => isStock(id) && count(amount))
      && (loot.relic === null || isRelicId(loot.relic)))
}

export function localDay(now: number): string {
  const date = new Date(now)
  const two = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
}

export function energyLeft(campaign: Campaign, now: number): number {
  return dailyEnergy - (localDay(now) <= campaign.chargeDay ? campaign.usedEnergy : 0)
}

export function zoneUnlocked(profile: Profile, zone: ZoneId): boolean {
  const prerequisite = zones[zone].prerequisite
  return prerequisite === 'gate' ? profile.completed.includes('gate') : !!profile.campaign.zones[prerequisite as ZoneId]?.clears
}

function lootRoll(seed: number, seat: number): number {
  return ((Math.imul(seed ^ Math.imul(seat, 2630859367), 1664525) + 1013904223) >>> 0) / 0x100000000
}

export function expeditionSpoils(attempt: Attempt, zone: ZoneId, first: boolean): Spoil[] {
  const spec = zones[zone]
  return Array.from({ length: zone === 'nest' ? attempt.teamSize ?? 2 : 1 }, (_, index) => {
    const seat = index + 1
    const chance = Math.min(1, spec.rate + (attempt.challenge ? challengeBonus : 0))
    const roll = lootRoll(attempt.seed, seat)
    const rewards: Spoil['rewards'] = { ...spec.loot, marks: spec.marks * (attempt.challenge ? 2 : 1) }
    if (roll < chance) rewards[roll < chance * 0.24 ? 'core-void' : 'core-pest'] = 1
    if (first && zone !== 'nest') {
      rewards.ichor = (rewards.ichor ?? 0) + 3
      rewards['curse-core'] = 1
    }
    const relic = first ? spec.relic : roll < 0.32 ? (seat % 2 ? 'ember-loop' : 'hollow-loop') : null
    return { seat, rewards, relic }
  })
}

export function rewardExpedition(profile: Profile, attempt: Attempt, zone: ZoneId, xp: number, score?: BattleScore): Profile {
  const previous = profile.campaign.zones[zone]
  const first = !previous?.clears
  const stars = 1 + Number(!!score && score.rounds <= zones[zone].ratingRounds)
    + Number(!!score && score.fallen <= (zone === 'nest' ? 1 : 0) && score.corrosion <= 1)
  const spoils = expeditionSpoils(attempt, zone, first)
  const own = spoils[0]!
  let relicary = addStock(profile.relicary, own.rewards)
  if (own.relic) relicary = addRelic(relicary, own.relic, `exp-${attempt.id}`)
  if (zone === 'watch' && first) relicary = addRelic(relicary, 'ember-loop', 'ember-loop')
  if (zone === 'hollow' && first) relicary = addRelic(relicary, 'hollow-loop', 'hollow-loop')
  return {
    ...profile,
    pending: null,
    hero: { ...profile.hero, xp: profile.hero.xp + xp },
    relicary,
    campaign: {
      ...profile.campaign,
      zones: { ...profile.campaign.zones, [zone]: { clears: (previous?.clears ?? 0) + 1, stars: Math.max(stars, previous?.stars ?? 0) } },
      last: { attempt: attempt.id, zone, stars, first, spoils },
    },
  }
}

export function sweepZone(profile: Profile, zone: ZoneId, now: number): Profile {
  const day = localDay(now)
  if (profile.pending || zone === 'nest' || profile.campaign.zones[zone]?.stars !== 3) throw new Error('A varredura exige nota máxima no solo.')
  if (energyLeft(profile.campaign, now) < sweepCost) throw new Error('Energia diária insuficiente.')
  const sameDay = day <= profile.campaign.chargeDay
  return {
    ...profile,
    relicary: addStock(profile.relicary, { ash: 6 }),
    campaign: { ...profile.campaign, chargeDay: sameDay ? profile.campaign.chargeDay : day,
      usedEnergy: (sameDay ? profile.campaign.usedEnergy : 0) + sweepCost },
  }
}

export function redeemEnergy(profile: Profile, now: number): Profile {
  if (profile.pending || energyLeft(profile.campaign, now) >= dailyEnergy) throw new Error('A energia diária já está cheia.')
  return { ...profile, relicary: addStock(profile.relicary, { energy: -1 }), campaign: { ...profile.campaign, usedEnergy: profile.campaign.usedEnergy - 1 } }
}

export function exchangeCore(profile: Profile, kind: 'pest' | 'void'): Profile {
  if (profile.pending || !profile.campaign.zones.nest?.clears) throw new Error('Conclua o Ninho da Ruptura para usar o Altar.')
  return { ...profile, relicary: addStock(profile.relicary, { marks: -coreExchange, [`core-${kind}`]: 1 }) }
}
