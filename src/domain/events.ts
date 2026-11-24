import { coutureCost, loginRewards, packs, rechargeGoals, seasonCost, spinCost, spinPity, spinRate, threadCost, type PackId } from '../content/events'
import { appearance, type AppearanceId } from '../content/wardrobe'
import type { Profile } from './profile'
import { addStock } from './relicary'
import { unlockAppearance } from './wardrobe'

export interface Events {
  cycle: number
  day: number
  signIns: number[]
  cash: number
  recharged: number
  goals: number[]
  receipts: string[]
  freeSpins: number
  pity: number
  season: boolean
  lastSpin: 'aura' | 'threads' | null
}

export function newEvents(): Events {
  return { cycle: -1, day: 0, signIns: [], cash: 0, recharged: 0, goals: [], receipts: [], freeSpins: 0, pity: 0, season: false, lastSpin: null }
}

function within(value: unknown, size: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= size
}

export function isEvents(value: unknown): value is Events {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (data.cycle === -1 || within(data.cycle, Number.MAX_SAFE_INTEGER)) && within(data.day, 7)
    && Array.isArray(data.signIns) && new Set(data.signIns).size === data.signIns.length && data.signIns.every((day) => within(day, 7) && day > 0)
    && within(data.cash, Number.MAX_SAFE_INTEGER) && within(data.recharged, Number.MAX_SAFE_INTEGER)
    && Array.isArray(data.goals) && new Set(data.goals).size === data.goals.length && data.goals.every((goal) => within(goal, 2))
    && Array.isArray(data.receipts) && new Set(data.receipts).size === data.receipts.length && data.receipts.every((key) => typeof key === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(key))
    && within(data.freeSpins, 99) && within(data.pity, spinPity - 1) && typeof data.season === 'boolean'
    && (data.lastSpin === null || data.lastSpin === 'aura' || data.lastSpin === 'threads')
}

export function isPack(value: unknown): value is PackId { return typeof value === 'string' && Object.hasOwn(packs, value) }

export function currentEvents(events: Events, now: number): Events {
  const clock = new Date(now)
  const dayNumber = Math.floor(Date.UTC(clock.getFullYear(), clock.getMonth(), clock.getDate()) / 86_400_000) + 3
  const cycle = Math.floor(dayNumber / 7)
  const day = (dayNumber % 7) + 1
  if (cycle < events.cycle || (cycle === events.cycle && day <= events.day)) return events
  if (cycle === events.cycle) return { ...events, day }
  return { ...newEvents(), cycle, day, cash: events.cash, receipts: events.receipts }
}

export function claimLogin(profile: Profile, now: number): Profile {
  const events = currentEvents(profile.events, now)
  if (profile.pending || events.day === 0 || events.signIns.includes(events.day)) throw new Error('Recompensa de hoje já resgatada ou indisponível.')
  return {
    ...profile, events: { ...events, signIns: [...events.signIns, events.day] },
    relicary: addStock(profile.relicary, loginRewards[events.day - 1]!),
    wardrobe: events.day === 7 ? unlockAppearance(profile.wardrobe, 'watch-aura') : profile.wardrobe,
  }
}

export function simulateRecharge(profile: Profile, pack: PackId, receipt: string, now: number): Profile {
  const events = currentEvents(profile.events, now)
  if (profile.pending) throw new Error('Aguarde o fim do encontro.')
  if (events.receipts.includes(receipt)) return profile
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(receipt)) throw new Error('Recibo inválido.')
  const { cash } = packs[pack]
  return { ...profile, events: { ...events, cash: events.cash + cash, recharged: events.recharged + cash, receipts: [...events.receipts, receipt] } }
}

export function claimRecharge(profile: Profile, index: number, now: number): Profile {
  const events = currentEvents(profile.events, now)
  const offer = rechargeGoals[index]
  if (profile.pending || !offer || events.recharged < offer.amount || events.goals.includes(index)) throw new Error('Meta de recarga indisponível.')
  return { ...profile, events: { ...events, goals: [...events.goals, index] }, relicary: addStock(profile.relicary, offer.reward) }
}

function pay(events: Events, cash: number): Events {
  if (events.cash < cash) throw new Error('Cash simulado insuficiente.')
  return { ...events, cash: events.cash - cash }
}

export function openSeason(profile: Profile, now: number): Profile {
  const events = currentEvents(profile.events, now)
  if (profile.pending || events.season) throw new Error('A trilha já está ativa ou indisponível.')
  return { ...profile, events: { ...pay(events, seasonCost), season: true } }
}

export function earnAppearance(profile: Profile, id: AppearanceId, now: number): Profile {
  if (profile.pending || profile.wardrobe.unlocked.includes(id)) throw new Error('Indumentária já liberada ou indisponível.')
  let events = currentEvents(profile.events, now)
  let relicary = profile.relicary
  const item = appearance(id)
  if (item.set === 'purge') relicary = addStock(relicary, { 'profaned-thread': -threadCost })
  else if (item.set === 'watch') {
    if (!profile.campaign.zones.watch?.clears) throw new Error('Conclua o Posto das Cinzas.')
    if ((item.slot === 'projection' || item.slot === 'aura') && !events.season) throw new Error('Ative a trilha simulada da temporada.')
  } else {
    if (item.slot === 'aura') throw new Error('Manifeste esta Aura na Roleta do Altar Selado.')
    events = pay(events, coutureCost)
  }
  return { ...profile, events, relicary, wardrobe: unlockAppearance(profile.wardrobe, id) }
}

export function spinAltar(profile: Profile, now: number, roll: number): Profile {
  let events = currentEvents(profile.events, now)
  if (profile.pending) throw new Error('Retorne à base para girar.')
  events = events.freeSpins > 0 ? { ...events, freeSpins: events.freeSpins - 1 } : pay(events, spinCost)
  const hit = roll < spinRate || events.pity + 1 >= spinPity
  const newLook = hit && !profile.wardrobe.unlocked.includes('nocturne-aura')
  return {
    ...profile, events: { ...events, pity: hit ? 0 : events.pity + 1, lastSpin: newLook ? 'aura' : 'threads' },
    wardrobe: hit ? unlockAppearance(profile.wardrobe, 'nocturne-aura') : profile.wardrobe,
    relicary: newLook ? profile.relicary : addStock(profile.relicary, { 'profaned-thread': hit ? 4 : 2 }),
  }
}

export function eventMission(profile: Profile, now: number): Profile {
  const events = currentEvents(profile.events, now)
  return { ...profile, relicary: addStock(profile.relicary, { 'profaned-thread': 2 }), events: { ...events, freeSpins: Math.min(99, events.freeSpins + 1) } }
}
