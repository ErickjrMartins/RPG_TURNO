import { assetUrl } from '../assets'
import type { Skill } from './adventure'

export const mageIcons: Readonly<Record<string, string>> = {
  spark: 'spark', rain: 'rain', renew: 'renew', chorus: 'chorus', 'void-circle': 'void',
  focus: 'focus', oath: 'oath', seal: 'seal', rift: 'rift',
  thread: 'thread', dew: 'dew', dawn: 'dawn', prism: 'prism', tear: 'tear', restoration: 'restoration',
}

export function mageIcon(id: string): string | undefined {
  const icon = mageIcons[id]
  return icon && assetUrl(`arcana-${icon}.webp`)
}

export type MageSpellId = 'thread' | 'dew' | 'dawn' | 'prism' | 'tear'
export type MageActiveId = 'spark' | 'rain' | 'renew' | 'chorus' | MageSpellId
export type MagePassiveId = 'rift' | 'oath' | 'seal' | 'restoration'
export type MageNodeId = 'focus' | 'void-circle' | MageActiveId | MagePassiveId

export const mageStarterSpells = ['spark', 'rain', 'renew', 'chorus'] as const
export const magePassives = ['rift', 'oath', 'seal', 'restoration'] as const
export const maxMageActives = 6
export const maxMagePassives = 3

export const mageSpells: Readonly<Record<MageSpellId, Skill>> = {
  thread: { id: 'thread', name: 'Fio de Âmbar', icon: '✦', visual: 'heal', cost: 22, cooldown: 2, target: 'lowest-ally', healPercent: 0.26,
    description: 'Cura 26% da Vida máxima do aliado vivo com menor porcentagem de Vida.' },
  dew: { id: 'dew', name: 'Orvalho de Sal', icon: '❋', visual: 'healing-field', cost: 28, cooldown: 3, target: 'allies',
    effect: { kind: 'mending', strength: 0.06, rounds: 3 }, description: 'Recupera 6% da Vida máxima de cada aliado vivo no fim de cada rodada por 3 rodadas.' },
  dawn: { id: 'dawn', name: 'Alvorada de Marfim', icon: '☼', visual: 'healing-field', cost: 70, resource: 'macula', cooldown: 4, target: 'allies', healPercent: 0.32,
    description: 'Consome 70 de Mácula para curar imediatamente 32% da Vida máxima de cada aliado vivo.' },
  prism: { id: 'prism', name: 'Prisma de Selos', icon: '⬡', visual: 'ward', cost: 25, cooldown: 2, target: 'ally',
    effect: { kind: 'shield', strength: 32, rounds: 2 }, description: 'Protege um aliado com um escudo de 32 pontos por 2 rodadas.' },
  tear: { id: 'tear', name: 'Rasgo de Nanquim', icon: '◈', visual: 'blast', cost: 32, cooldown: 3, target: 'row', damage: 0.90,
    effect: { kind: 'marked', strength: 0.12, rounds: 2 }, description: 'Causa 90% do Poder a uma fileira e faz os alvos receberem 12% a mais de dano por 2 rodadas.' },
}

interface MageNode {
  name: string
  discipline: 'Condução' | 'Astral' | 'Vital' | 'Vazio'
  description: string
  max: number
  position: [number, number]
  parents: readonly MageNodeId[]
}

export const mageNodes = {
  focus: { name: 'Núcleo de Foco', discipline: 'Condução', description: 'Fundamento permanente. +4 Foco inicial por nível.', max: 3, position: [10, 50], parents: [] },
  spark: { name: 'Rastro de Cometa', discipline: 'Astral', description: '+12% de potência da Centelha por nível.', max: 3, position: [29, 15], parents: ['focus'] },
  rain: { name: 'Constelação Ardente', discipline: 'Astral', description: '+3 de dano por nível na queimadura da Chuva Astral.', max: 3, position: [49, 15], parents: ['spark'] },
  seal: { name: 'Selo de Órbita', discipline: 'Condução', description: 'Acrescenta 5 de Mácula inicial por nível.', max: 2, position: [69, 15], parents: ['rain'] },
  tear: { name: 'Rasgo de Nanquim', discipline: 'Astral', description: 'Desbloqueia o rasgo. Cada nível adicional soma 5 pontos percentuais ao dano base.', max: 3, position: [89, 15], parents: ['rain'] },
  renew: { name: 'Seiva de Estrelas', discipline: 'Vital', description: '+6 de cura por nível na Renovação.', max: 3, position: [29, 38], parents: ['focus'] },
  chorus: { name: 'Ressonância Vital', discipline: 'Vital', description: '+4 de cura por nível no Coro Vital.', max: 3, position: [49, 38], parents: ['renew'] },
  dew: { name: 'Orvalho de Sal', discipline: 'Vital', description: 'Desbloqueia a cura por rodada. Cada nível adicional soma 1 ponto percentual por pulso.', max: 3, position: [69, 38], parents: ['chorus'] },
  dawn: { name: 'Alvorada de Marfim', discipline: 'Vital', description: 'Desbloqueia a cura em massa. Cada nível adicional soma 4 pontos percentuais à cura.', max: 3, position: [89, 38], parents: ['dew'] },
  thread: { name: 'Fio de Âmbar', discipline: 'Vital', description: 'Desbloqueia a cura automática. Cada nível adicional soma 3 pontos percentuais à cura.', max: 3, position: [49, 62], parents: ['renew'] },
  restoration: { name: 'Trama Restauradora', discipline: 'Vital', description: 'Aumenta em 8% por nível as curas diretas e periódicas do Canalizador.', max: 3, position: [69, 62], parents: ['thread'] },
  prism: { name: 'Prisma de Selos', discipline: 'Condução', description: 'Desbloqueia o escudo. Cada nível adicional soma 6 pontos à absorção.', max: 3, position: [89, 62], parents: ['rift'] },
  rift: { name: 'Margem do Vazio', discipline: 'Vazio', description: '+3 de dano por nível em cada pulso do Círculo do Vazio.', max: 3, position: [29, 85], parents: ['focus'] },
  oath: { name: 'Juramento Sereno', discipline: 'Vazio', description: 'Reduz em 2 o custo de Vida das Juras por nível.', max: 3, position: [49, 85], parents: ['rift'] },
  'void-circle': { name: 'Horizonte do Abismo', discipline: 'Vazio', description: 'Reduz em 5 o custo de Mácula do Círculo do Vazio por nível.', max: 2, position: [89, 85], parents: ['chorus', 'oath'] },
} as const satisfies Record<MageNodeId, MageNode>

export const mageNodeIds = Object.keys(mageNodes) as MageNodeId[]
