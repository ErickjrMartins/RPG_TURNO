import { items } from './adventure'

export const gearSlots = {
  weapon: 'Arma Maculada',
  mantle: 'Manto de Contenção',
  rosary: 'Rosário de Selamento',
  ringLeft: 'Anel de Vínculo I',
  ringRight: 'Anel de Vínculo II',
  talisman: 'Talismã de Domínio',
} as const
export type GearSlot = keyof typeof gearSlots

export interface Bonuses {
  hp?: number
  power?: number
  defense?: number
  precision?: number
  resistance?: number
}

interface RelicSpec {
  name: string
  slots: readonly GearSlot[]
  rarity: 'Comum' | 'Incomum' | 'Rara'
  bonus: Bonuses
  troop?: true
  affinity?: number
}

export const relics = {
  'dawn-brooch': { name: items['dawn-brooch'].name, slots: ['rosary'], rarity: 'Comum', bonus: { power: 3, defense: 2 }, troop: true },
  'gate-insignia': { name: items['gate-insignia'].name, slots: ['talisman'], rarity: 'Incomum', bonus: { power: 5, defense: 3 }, troop: true },
  'veil-edge': { name: 'Lâmina do Limiar', slots: ['weapon'], rarity: 'Comum', bonus: { power: 6, precision: 2 } },
  'ash-mantle': { name: 'Manto de Vigília', slots: ['mantle'], rarity: 'Incomum', bonus: { hp: 18, defense: 4 } },
  'ember-loop': { name: 'Elo da Brasa', slots: ['ringLeft', 'ringRight'], rarity: 'Comum', bonus: { power: 3, precision: 1 }, troop: true },
  'hollow-loop': { name: 'Elo do Ocaso', slots: ['ringLeft', 'ringRight'], rarity: 'Incomum', bonus: { hp: 10, resistance: 5 } },
  'veil-rosary': { name: 'Rosário do Limiar', slots: ['rosary'], rarity: 'Rara', bonus: { defense: 5, resistance: 8 }, affinity: 3 },
  'abyss-heart': { name: 'Coração do Abismo', slots: ['talisman'], rarity: 'Rara', bonus: { hp: 14, power: 8 }, affinity: 4 },
} as const satisfies Record<string, RelicSpec>

export type RelicId = keyof typeof relics
export const relicSpec = (id: RelicId): RelicSpec => relics[id]

export const stock = {
  ash: { name: 'Cinzas de Maldição', category: 'Materiais' },
  ichor: { name: 'Coágulos de Icor', category: 'Materiais' },
  graft: { name: 'Selo de Enxerto', category: 'Selos & Núcleos' },
  'pin-power': { name: 'Prego de Ataque', category: 'Selos & Núcleos' },
  'pin-life': { name: 'Prego de Vida', category: 'Selos & Núcleos' },
  'pin-guard': { name: 'Prego de Defesa', category: 'Selos & Núcleos' },
  'pin-aim': { name: 'Prego de Precisão', category: 'Selos & Núcleos' },
  'pin-resist': { name: 'Prego de Resistência', category: 'Selos & Núcleos' },
  'pin-oath': { name: 'Prego da Jura', category: 'Selos & Núcleos' },
  'glyph-pest': { name: 'Glifo da Peste', category: 'Selos & Núcleos' },
  'glyph-void': { name: 'Glifo do Vazio', category: 'Selos & Núcleos' },
  'core-pest': { name: 'Núcleo da Peste · Raro', category: 'Selos & Núcleos' },
  'core-void': { name: 'Núcleo do Vazio · Épico', category: 'Selos & Núcleos' },
  'curse-core': { name: 'Núcleo de Maldição', category: 'Selos & Núcleos' },
  awakening: { name: 'Matéria de Despertar Profano', category: 'Materiais' },
  marks: { name: 'Marcas de Expurgo', category: 'Materiais' },
  energy: { name: 'Frasco de Energia', category: 'Consumíveis / Baús' },
  'profaned-thread': { name: 'Fios Profanos', category: 'Materiais' },
} as const

export type StockId = keyof typeof stock
export const pins = {
  'pin-power': { power: 3 },
  'pin-life': { hp: 14 },
  'pin-guard': { defense: 3 },
  'pin-aim': { precision: 5 },
  'pin-resist': { resistance: 10 },
  'pin-oath': { power: 2 },
} as const satisfies Partial<Record<StockId, Bonuses>>
export type PinId = keyof typeof pins
export type GlyphId = 'glyph-pest' | 'glyph-void'
export type Lineage = 'pest' | 'void'
export const masteryPaths = { safe: 'Caminho Seguro', oath: 'Caminho da Jura' } as const
export type MasteryPath = keyof typeof masteryPaths
