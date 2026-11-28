import type { EncounterId, Skill } from './adventure'
import type { Attributes } from './classes'

interface CurseSpec {
  name: string
  role: string
  unlock: EncounterId
  attributes: Attributes
  attack: Skill
  technique: Skill
  cadence: number
  protects: boolean
}

export const boundCurses = {
  'bound-cinder': {
    name: 'Braseiro',
    role: 'Proteção',
    unlock: 'ruins',
    attributes: { hp: 51, power: 13, defense: 7, speed: 11 },
    attack: { id: 'cinder-bite', name: 'Mordida de Cinza', icon: '', description: '', cost: 0, cooldown: 0, target: 'front', damage: 0.9 },
    technique: { id: 'cinder-shell', name: 'Casca de Brasa', icon: '', description: 'Protege o aliado sem escudo com a menor proporção de Vida.',
      cost: 0, cooldown: 0, target: 'allies', visual: 'ward', effect: { kind: 'shield', strength: 11, rounds: 2 } },
    cadence: 3,
    protects: true,
  },
  'bound-omen': {
    name: 'Vigia do Limiar',
    role: 'Dano e marcação',
    unlock: 'gate',
    attributes: { hp: 42, power: 17, defense: 4, speed: 10 },
    attack: { id: 'omen-needle', name: 'Agulha de Névoa', icon: '', description: '', cost: 0, cooldown: 0, target: 'front', damage: 1, visual: 'bolt' },
    technique: { id: 'omen-mark', name: 'Marca do Limiar', icon: '', description: 'Atinge e marca um inimigo, que passa a receber 18% a mais de dano.',
      cost: 0, cooldown: 0, target: 'front', damage: 0.8, visual: 'hex', effect: { kind: 'marked', strength: 0.18, rounds: 2 } },
    cadence: 2,
    protects: false,
  },
} as const satisfies Record<string, CurseSpec>

export type BoundCurseId = keyof typeof boundCurses
export const boundCurseIds = Object.keys(boundCurses) as BoundCurseId[]

export function isBoundCurse(id: unknown): id is BoundCurseId {
  return typeof id === 'string' && Object.hasOwn(boundCurses, id)
}
