import { mageNodeIds, mageNodes, type MageNodeId } from '../content/mage'
import type { Profile } from './profile'

export type MageRanks = Partial<Record<MageNodeId, number>>

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
  return { ...profile, mageRanks: {} }
}

export function mageBonuses(ranks: MageRanks) {
  const rank = (id: MageNodeId) => ranks[id] ?? 0
  return { focus: 4 * rank('focus'), spark: 0.12 * rank('spark'), burn: 3 * rank('rain'), renew: 6 * rank('renew'),
    chorus: 4 * rank('chorus'), pulse: 3 * rank('rift'), affinity: 2 * rank('oath'), macula: 5 * rank('seal'), abyssDiscount: 5 * rank('void-circle') }
}

export const mageLinks = mageNodeIds.flatMap((id) => mageNodes[id].parents.map((source) => ({ id, source })))
