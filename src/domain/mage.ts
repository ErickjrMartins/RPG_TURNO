import { mageNodeIds, mageNodes, magePassives, mageSpells, mageStarterSpells, maxMageActives, maxMagePassives,
  type MageActiveId, type MageNodeId, type MagePassiveId, type MageSpellId } from '../content/mage'
import type { Skill } from '../content/adventure'
import type { Profile } from './profile'

export type MageRanks = Partial<Record<MageNodeId, number>>
export interface MageLoadout { active: MageActiveId[]; passive: MagePassiveId[] }

export function startingMageLoadout(): MageLoadout {
  return { active: [...mageStarterSpells], passive: ['rift', 'oath', 'seal'] }
}

export function isMageSpell(id: string): id is MageSpellId {
  return Object.hasOwn(mageSpells, id)
}

export function isMageActive(id: unknown): id is MageActiveId {
  return typeof id === 'string' && (mageStarterSpells.some((starter) => starter === id) || isMageSpell(id))
}

export function isMagePassive(id: unknown): id is MagePassiveId {
  return magePassives.some((passive) => passive === id)
}

export function validMageLoadout(value: unknown, ranks: MageRanks, mage: boolean): value is MageLoadout | null {
  if (!mage) return value === null
  if (!value || typeof value !== 'object') return false
  const { active, passive } = value as Record<string, unknown>
  return Array.isArray(active) && active.length <= maxMageActives && active[0] === 'spark'
    && new Set(active).size === active.length && active.every((id) => isMageActive(id) && (!isMageSpell(id) || ranks[id]))
    && Array.isArray(passive) && passive.length <= maxMagePassives && new Set(passive).size === passive.length
    && passive.every((id) => isMagePassive(id) && (id !== 'restoration' || ranks[id]))
}

export function isMageNode(value: unknown): value is MageNodeId {
  return typeof value === 'string' && Object.hasOwn(mageNodes, value)
}

function pointBudget(xp: number): number {
  return 2 + 2 * Math.floor(xp / 100)
}

export function magePoints(profile: Pick<Profile, 'hero' | 'mageRanks'>): number {
  return pointBudget(profile.hero.xp) - Object.values(profile.mageRanks).reduce((sum, rank) => sum + rank, 0)
}

export function validMageRanks(value: unknown, xp: number, mage: boolean): value is MageRanks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const ranks = value as Record<string, unknown>
  const entries = Object.entries(ranks)
  if (!mage && entries.length) return false
  if (!entries.every(([id, rank]) => isMageNode(id) && typeof rank === 'number' && Number.isInteger(rank)
    && rank >= 1 && rank <= mageNodes[id].max && mageNodes[id].parents.every((parent) => typeof ranks[parent] === 'number' && ranks[parent] as number >= 1))) return false
  return Object.values(ranks).reduce<number>((sum, rank) => sum + (rank as number), 0) <= pointBudget(xp)
}

export function mageBlocked(profile: Profile, id: MageNodeId): string | undefined {
  if (profile.hero.classId !== 'mage' || profile.pending || !profile.completed.includes('ruins')) return 'Disponível para o Canalizador no Refúgio.'
  if ((profile.mageRanks[id] ?? 0) >= mageNodes[id].max) return 'Nível máximo.'
  const parents = mageNodes[id].parents.filter((parent) => !profile.mageRanks[parent])
  if (parents.length) return `Requer ${parents.map((parent) => mageNodes[parent].name).join(' e ')}.`
  if (magePoints(profile) < 1) return 'Pontos de habilidade insuficientes.'
  return undefined
}

export function trainMageNode(profile: Profile, id: MageNodeId): Profile {
  const blocked = mageBlocked(profile, id)
  if (blocked) throw new Error(blocked)
  return { ...profile, mageRanks: { ...profile.mageRanks, [id]: (profile.mageRanks[id] ?? 0) + 1 } }
}

export function resetMageTree(profile: Profile): Profile {
  if (profile.hero.classId !== 'mage' || profile.pending) throw new Error('Reinicie a árvore na base.')
  return { ...profile, mageRanks: {}, mageLoadout: startingMageLoadout() }
}

export function mageSlotBlocked(profile: Profile, id: MageNodeId): string | undefined {
  const loadout = profile.mageLoadout
  if (!loadout || profile.pending || !profile.completed.includes('ruins')) return 'Prepare as habilidades no Refúgio.'
  if (id === 'spark') return 'A Centelha sempre ocupa o primeiro espaço e gera Foco.'
  if (isMageActive(id)) {
    if (isMageSpell(id) && !profile.mageRanks[id]) return 'Aprenda a habilidade antes de equipá-la.'
    if (!loadout.active.includes(id) && loadout.active.length >= maxMageActives) return 'Libere um espaço ativo.'
  } else if (isMagePassive(id)) {
    if (id === 'restoration' && !profile.mageRanks[id]) return 'Aprenda a passiva antes de equipá-la.'
    if (!loadout.passive.includes(id) && loadout.passive.length >= maxMagePassives) return 'Libere um espaço passivo.'
  }
  return undefined
}

export function toggleMageSlot(profile: Profile, id: MageNodeId): Profile {
  const reason = mageSlotBlocked(profile, id)
  if (reason) throw new Error(reason)
  const { active, passive } = profile.mageLoadout!
  if (isMageActive(id)) {
    return { ...profile, mageLoadout: { active: active.includes(id) ? active.filter((skill) => skill !== id) : [...active, id], passive } }
  }
  if (isMagePassive(id)) {
    return { ...profile, mageLoadout: { active, passive: passive.includes(id) ? passive.filter((skill) => skill !== id) : [...passive, id] } }
  }
  return profile
}

export function configuredMageSpell(id: MageSpellId, ranks: MageRanks): Skill {
  const spell = mageSpells[id]
  const additional = Math.max(0, (ranks[id] ?? 1) - 1)
  if (id === 'thread' || id === 'dawn') {
    const healPercent = (spell.healPercent ?? 0) + additional * (id === 'thread' ? 0.03 : 0.04)
    return { ...spell, healPercent, description: `${spell.description} Cura neste nível: ${Math.round(healPercent * 100)}%.` }
  }
  if (id === 'dew' || id === 'prism') {
    const effect = spell.effect!
    const strength = effect.strength + additional * (id === 'dew' ? 0.01 : 6)
    const value = id === 'dew' ? `${Math.round(strength * 100)}% por rodada` : `${strength} de absorção`
    return { ...spell, effect: { ...effect, strength }, description: `${spell.description} Neste nível: ${value}.` }
  }
  const damage = (spell.damage ?? 0) + additional * 0.05
  return { ...spell, damage, description: `${spell.description} Potência neste nível: ${Math.round(damage * 100)}%.` }
}

export function mageBonuses(ranks: MageRanks, loadout: MageLoadout | null) {
  const rank = (id: MageNodeId) => ranks[id] ?? 0
  const passive = (id: MagePassiveId) => loadout?.passive.includes(id) ? rank(id) : 0
  return { focus: 4 * rank('focus'), spark: 0.12 * rank('spark'), burn: 3 * rank('rain'), renew: 6 * rank('renew'),
    chorus: 4 * rank('chorus'), pulse: 3 * passive('rift'), affinity: 2 * passive('oath'), macula: 5 * passive('seal'),
    healing: 0.08 * passive('restoration'), abyssDiscount: 5 * rank('void-circle') }
}

export const mageLinks = mageNodeIds.flatMap((id) => mageNodes[id].parents.map((source) => ({ id, source })))
