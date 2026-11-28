import { boundCurses, isBoundCurse, type BoundCurseId } from '../content/bindings'
import type { EncounterId } from '../content/adventure'
import type { Profile } from './profile'

export interface Bindings {
  active: BoundCurseId | null
  experience: Partial<Record<BoundCurseId, number>>
}

export const bindingRankLimit = 5
export const bindingRankExperience = 30
export const bindingWinExperience = 24
const experienceLimit = (bindingRankLimit - 1) * bindingRankExperience

export function newBindings(): Bindings {
  return { active: null, experience: {} }
}

export function curseUnlocked(completed: readonly EncounterId[], id: BoundCurseId): boolean {
  return completed.includes(boundCurses[id].unlock)
}

export function isBindings(value: unknown, completed: readonly EncounterId[]): value is Bindings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const { active, experience } = value as Partial<Bindings>
  return (active === null || (isBoundCurse(active) && curseUnlocked(completed, active)))
    && !!experience && typeof experience === 'object' && !Array.isArray(experience)
    && Object.entries(experience).every(([id, xp]) => isBoundCurse(id) && curseUnlocked(completed, id)
      && Number.isSafeInteger(xp) && xp >= 0 && xp <= experienceLimit)
}

export function bindCurse(profile: Profile, id: BoundCurseId | null): Profile {
  if (profile.pending) throw new Error('Conclua o combate atual antes de trocar o vínculo.')
  if (id && !curseUnlocked(profile.completed, id)) throw new Error('Contenha a maldição para firmar este vínculo.')
  return { ...profile, bindings: { ...profile.bindings, active: id } }
}

export function bindingRank(bindings: Bindings, id: BoundCurseId): number {
  return Math.floor((bindings.experience[id] ?? 0) / bindingRankExperience) + 1
}

export function bindingAttributes(id: BoundCurseId, rank: number) {
  const base = boundCurses[id].attributes
  const growth = rank - 1
  return { ...base, hp: base.hp + growth * 7, power: base.power + growth * 2, defense: base.defense + growth }
}

export function rewardBinding(bindings: Bindings): Bindings {
  const id = bindings.active
  if (!id) return bindings
  const xp = Math.min(experienceLimit, (bindings.experience[id] ?? 0) + bindingWinExperience)
  return { ...bindings, experience: { ...bindings.experience, [id]: xp } }
}
