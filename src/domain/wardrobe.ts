import { appearance, appearanceIds, styleSlots, type AppearanceId, type StyleSlot } from '../content/wardrobe'

export interface Wardrobe {
  unlocked: AppearanceId[]
  looks: Partial<Record<StyleSlot, AppearanceId>>
  stats: Partial<Record<StyleSlot, AppearanceId>>
}

export function newWardrobe(): Wardrobe {
  return { unlocked: [], looks: {}, stats: {} }
}

export function isAppearance(value: unknown): value is AppearanceId { return appearanceIds.some((id) => id === value) }

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }

export function isWardrobe(value: unknown): value is Wardrobe {
  if (!record(value) || !Array.isArray(value.unlocked) || !value.unlocked.every(isAppearance) || new Set(value.unlocked).size !== value.unlocked.length) return false
  const unlocked = value.unlocked
  const valid = (group: unknown) => record(group) && Object.entries(group).every(([slot, id]) => isAppearance(id)
    && Object.hasOwn(styleSlots, slot) && unlocked.includes(id) && appearance(id).slot === slot)
  return valid(value.looks) && valid(value.stats)
}

export function unlockAppearance(wardrobe: Wardrobe, id: AppearanceId): Wardrobe {
  return wardrobe.unlocked.includes(id) ? wardrobe : { ...wardrobe, unlocked: [...wardrobe.unlocked, id] }
}

export function wearAppearance(wardrobe: Wardrobe, id: AppearanceId, kind: 'looks' | 'stats'): Wardrobe {
  if (!wardrobe.unlocked.includes(id)) throw new Error('Desbloqueie a Indumentária primeiro.')
  const { slot } = appearance(id)
  const values = { ...wardrobe[kind] }
  if (values[slot] === id) delete values[slot]
  else values[slot] = id
  return { ...wardrobe, [kind]: values }
}

export function styleBonuses(wardrobe: Wardrobe) {
  const active = Object.values(wardrobe.stats).map(appearance)
  const complete = active.length === 4 && active.every((item) => item.set === active[0]?.set)
  const collection = Math.floor(wardrobe.unlocked.length / 4)
  return {
    hp: active.reduce((sum, item) => sum + (item.stats.hp ?? 0), collection * 2),
    power: active.reduce((sum, item) => sum + (item.stats.power ?? 0), 0),
    defense: active.reduce((sum, item) => sum + (item.stats.defense ?? 0), 0),
    energy: complete ? 3 : 0,
  }
}
