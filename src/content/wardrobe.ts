import type { Bonuses } from './relics'

export const styleSlots = { mantle: 'Traje / Manto', mask: 'Adorno de Cabeça / Máscara', projection: 'Projeção de Arma', aura: 'Manifestação / Aura' } as const
export type StyleSlot = keyof typeof styleSlots
export type StyleSet = 'purge' | 'watch' | 'nocturne'
export const styleSlotsIds = Object.keys(styleSlots) as StyleSlot[]

const values: Record<StyleSlot, Bonuses> = { mantle: { hp: 5 }, mask: { defense: 1 }, projection: { power: 1 }, aura: { hp: 3 } }
export const styleSets = {
  purge: { name: 'Trajes de Expurgo', color: '#e8bc78', names: ['Manto do Expurgo', 'Máscara da Brasa', 'Projeção Dourada', 'Aura da Colheita'] },
  watch: { name: 'Trajes de Temporada · Vigília', color: '#9fdbcc', names: ['Manto da Vigília', 'Máscara de Jade', 'Projeção da Sentinela', 'Manifestação da Vigília'] },
  nocturne: { name: 'Alta Costura · Noturno', color: '#d1a5ff', names: ['Manto Noturno', 'Máscara de Azougue', 'Projeção da Meia-Luz', 'Manifestação do Altar'] },
} as const

export type AppearanceId = `${StyleSet}-${StyleSlot}`
export const appearanceIds = (Object.keys(styleSets) as StyleSet[]).flatMap((set) => styleSlotsIds.map((slot): AppearanceId => `${set}-${slot}`))

export function appearance(id: AppearanceId) {
  const [set, slot] = id.split('-') as [StyleSet, StyleSlot]
  return { set, slot, name: styleSets[set].names[styleSlotsIds.indexOf(slot)]!, color: styleSets[set].color, stats: values[slot] }
}
