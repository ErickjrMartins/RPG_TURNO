import { buildingIds, buildings, farmRates, goldLimits, maxBuildingLevel, type BuildingId } from '../content/city'
import type { Profile } from './profile'

interface Building {
  level: number
  readyAt: number | null
}

export interface City {
  buildings: Record<BuildingId, Building>
  farm: { stored: number; since: number | null }
}

export function newCity(): City {
  const initial = () => ({ level: 1, readyAt: null })
  return {
    buildings: { council: initial(), barracks: initial(), farm: initial(), treasury: initial() },
    farm: { stored: 0, since: null },
  }
}

export function isBuildingId(value: unknown): value is BuildingId {
  return typeof value === 'string' && Object.hasOwn(buildings, value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isLevel(value: unknown): value is number {
  return isTimestamp(value) && value >= 1 && value <= maxBuildingLevel
}

function isBuilding(value: unknown): value is Building {
  return isRecord(value) && isLevel(value.level)
    && (value.readyAt === null || (value.level < maxBuildingLevel && isTimestamp(value.readyAt)))
}

export function isCity(value: unknown): value is City {
  if (!isRecord(value) || !isRecord(value.buildings) || !isRecord(value.farm)) return false
  const structures = value.buildings
  const farm = structures.farm
  const council = structures.council
  if (!isBuilding(council) || !isBuilding(farm)) return false
  return buildingIds.every((id) => {
    const building = structures[id]
    return isBuilding(building) && (id === 'council' || building.level + Number(building.readyAt !== null) <= council.level)
  })
    && isTimestamp(value.farm.stored) && value.farm.stored <= farmRates[farm.level - 1]!.capacity
    && (isTimestamp(value.farm.since) || (value.farm.since === null && value.farm.stored === 0))
}

export function farmRate(level: number) {
  return farmRates[level - 1]!
}

export function goldLimit(city: City): number {
  return goldLimits[city.buildings.treasury.level - 1]!
}

function produce(farm: City['farm'], level: number, until: number): City['farm'] {
  if (farm.since === null) return { ...farm, since: until }
  if (until < farm.since) return farm
  const { seconds, capacity } = farmRate(level)
  const interval = seconds * 1000
  const cycles = Math.floor((until - farm.since) / interval)
  const stored = Math.min(capacity, farm.stored + cycles)
  return { stored, since: stored === capacity ? until : farm.since + cycles * interval }
}

export function currentCity(city: City, now: number): City {
  const structures = { ...city.buildings }
  const farmBuilding = structures.farm
  let farm = city.farm
  if (farmBuilding.readyAt !== null && now >= farmBuilding.readyAt) {
    farm = produce(farm, farmBuilding.level, farmBuilding.readyAt)
    // A new production rate starts at the moment the farm is improved.
    farm = produce({ ...farm, since: Math.max(farm.since ?? 0, farmBuilding.readyAt) }, farmBuilding.level + 1, now)
  } else {
    farm = produce(farm, farmBuilding.level, now)
  }
  for (const id of buildingIds) {
    const building = structures[id]
    if (building.readyAt !== null && now >= building.readyAt) {
      structures[id] = { level: building.level + 1, readyAt: null }
    }
  }
  return { buildings: structures, farm }
}

export function updateCity(profile: Profile, now: number): Profile {
  if (!profile.completed.includes('ruins')) return profile
  return { ...profile, city: currentCity(profile.city, now) }
}

export function upgradeBlocked(profile: Profile, id: BuildingId): string | null {
  if (profile.pending || !profile.completed.includes('ruins')) return 'A cidade está indisponível durante o encontro.'
  const building = profile.city.buildings[id]
  const cost = buildings[id].upgrades[building.level - 1]
  if (building.readyAt !== null) return 'Melhoria em andamento.'
  if (!cost) return 'Nível máximo.'
  if (id !== 'council' && building.level >= profile.city.buildings.council.level) {
    return `Requer Salão do Conselho nível ${building.level + 1}.`
  }
  if (profile.gold < cost.gold || profile.supplies < cost.supplies) return 'Recursos insuficientes.'
  return null
}

export function improveBuilding(saved: Profile, id: BuildingId, now: number): Profile {
  const profile = updateCity(saved, now)
  const blocked = upgradeBlocked(profile, id)
  if (blocked) throw new Error(blocked)
  const building = profile.city.buildings[id]
  const cost = buildings[id].upgrades[building.level - 1]!
  return {
    ...profile,
    gold: profile.gold - cost.gold,
    supplies: profile.supplies - cost.supplies,
    city: { ...profile.city, buildings: { ...profile.city.buildings, [id]: { ...building, readyAt: now + cost.seconds * 1000 } } },
  }
}

export function harvestFarm(saved: Profile, now: number): Profile {
  const profile = updateCity(saved, now)
  const { stored, since } = profile.city.farm
  if (profile.pending || !profile.completed.includes('ruins') || stored === 0) {
    throw new Error('Ainda não há provisões para coletar.')
  }
  return {
    ...profile,
    supplies: profile.supplies + stored,
    city: { ...profile.city, farm: { stored: 0, since } },
  }
}
