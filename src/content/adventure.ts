import { zones } from './campaign'
import type { ClassId } from './classes'

export type TargetRule = 'front' | 'enemy' | 'row' | 'ally' | 'self' | 'allies' | 'enemies'
export type EffectKind = 'shield' | 'marked' | 'weakened' | 'burning'

export type Visual = 'slash' | 'arrow' | 'bolt' | 'blast' | 'heal' | 'healing-field' | 'ward' | 'hex' | 'abyss'

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  cooldown: number
  target: TargetRule
  visual?: Visual
  abyss?: true
  damage?: number
  heal?: number
  energy?: number
  effect?: { kind: EffectKind; strength: number; rounds: number }
}

export const skillsByClass: Record<ClassId, readonly Skill[]> = {
  warrior: [
    { id: 'strike', visual: 'slash', name: 'Golpe Firme', icon: '⚔︎', description: 'Fere um inimigo na linha de frente e gera 12 de Ímpeto.', cost: 0, cooldown: 0, target: 'front', damage: 1, energy: 12 },
    { id: 'wall', visual: 'ward', name: 'Muralha', icon: '⬡', description: 'Concede a um aliado um escudo que absorve até 32 de dano por duas rodadas.', cost: 20, cooldown: 2, target: 'ally', effect: { kind: 'shield', strength: 32, rounds: 2 } },
    { id: 'charge', visual: 'slash', name: 'Investida', icon: '✦', description: 'Causa dano pesado e enfraquece o ataque do alvo por duas rodadas.', cost: 35, cooldown: 2, target: 'enemy', damage: 1.65, effect: { kind: 'weakened', strength: 0.25, rounds: 2 } },
  ],
  archer: [
    { id: 'shot', visual: 'arrow', name: 'Disparo', icon: '➶', description: 'Atinge qualquer inimigo e gera 12 de Concentração.', cost: 0, cooldown: 0, target: 'enemy', damage: 0.9, energy: 12 },
    { id: 'barrage', visual: 'arrow', name: 'Rajada Dupla', icon: '❯', description: 'Dispara uma rajada precisa contra um único alvo.', cost: 20, cooldown: 1, target: 'enemy', damage: 1.65 },
    { id: 'mark', visual: 'hex', name: 'Marca da Caça', icon: '◎', description: 'Causa dano extra e aumenta o dano recebido pelo alvo por duas rodadas.', cost: 35, cooldown: 3, target: 'enemy', damage: 1.3, effect: { kind: 'marked', strength: 0.3, rounds: 2 } },
  ],
  mage: [
    { id: 'spark', visual: 'bolt', name: 'Centelha', icon: '✧', description: 'Atinge qualquer inimigo e gera 12 de Foco.', cost: 0, cooldown: 0, target: 'enemy', damage: 0.92, energy: 12 },
    { id: 'rain', visual: 'blast', name: 'Chuva Astral', icon: '✶', description: 'Atinge a fileira do alvo e deixa os inimigos em chamas.', cost: 20, cooldown: 2, target: 'row', damage: 1.12, effect: { kind: 'burning', strength: 5, rounds: 2 } },
    { id: 'renew', visual: 'heal', name: 'Renovação', icon: '✚', description: 'Restaura até 45 de vida de um aliado.', cost: 35, cooldown: 2, target: 'ally', heal: 45 },
    { id: 'chorus', visual: 'healing-field', name: 'Coro Vital', icon: '✺', description: 'Cura até 22 de vida em todos os aliados.', cost: 45, cooldown: 3, target: 'allies', heal: 22 },
  ],
}

export const abyssSpecs = {
  warrior: {
    name: 'Bastião de Cinzas', visual: 'abyss', id: 'ash-bastion', target: 'allies',
    icon: '⬡', cost: 60, cooldown: 3, abyss: true,
    description: 'Ergue escudos para toda a formação e reduz em 30% o dano dos inimigos.',
    tint: '#e4ab6e',
  },
  archer: {
    name: 'Firmamento da Caça', visual: 'abyss', id: 'hunter-firmament', target: 'enemy',
    icon: '◎', cost: 60, cooldown: 3, abyss: true,
    description: 'Marca a presa. Toda a formação causa 40% a mais de dano contra ela. A marca salta se o alvo cair.',
    tint: '#c8e688',
  },
  mage: {
    name: 'Círculo do Vazio', visual: 'abyss', id: 'void-circle', target: 'row',
    icon: '✶', cost: 60, cooldown: 3, abyss: true,
    description: 'Desacelera a fileira inimiga escolhida e causa dano a suas unidades no fim de cada rodada.',
    tint: '#c4a5f9',
  },
} as const satisfies Record<ClassId, Skill & { tint: string }>

export const encounters = {
  watch: { ...zones.watch, reward: { xp: 40, gold: 22, supplies: 2, itemId: null } },
  hollow: { ...zones.hollow, reward: { xp: 40, gold: 28, supplies: 2, itemId: null } },
  core: { ...zones.core, reward: { xp: 40, gold: 34, supplies: 3, itemId: null } },
  drowned: { ...zones.drowned, reward: { xp: 50, gold: 38, supplies: 3, itemId: null } },
  mothvault: { ...zones.mothvault, reward: { xp: 55, gold: 42, supplies: 3, itemId: null } },
  frostpath: { ...zones.frostpath, reward: { xp: 60, gold: 46, supplies: 4, itemId: null } },
  observatory: { ...zones.observatory, reward: { xp: 65, gold: 50, supplies: 4, itemId: null } },
  nest: { ...zones.nest, reward: { xp: 60, gold: 40, supplies: 3, itemId: null } },
  ruins: {
    name: 'Ruínas do Farol',
    intro: 'Ninguém atravessa o Véu sozinho. Escolha uma habilidade e indique o alvo.',
    reward: { xp: 60, gold: 60, supplies: 5, itemId: 'dawn-brooch' },
  },
  gate: {
    name: 'Portão Caído',
    intro: 'O antigo Guardião do Portão despertou. Ele chama um reforço e muda de ataque abaixo de metade da vida.',
    reward: { xp: 80, gold: 85, supplies: 3, itemId: 'gate-insignia' },
  },
  drill: {
    name: 'Campo de Treino',
    intro: 'Exercício com doze posições. Teste Juras e Abismos com uma formação completa.',
    reward: { xp: 0, gold: 0, supplies: 0, itemId: null },
  },
} as const

export const items = {
  'dawn-brooch': { name: 'Broche do Alvorecer', power: 3, defense: 2 },
  'gate-insignia': { name: 'Insígnia do Portão', power: 5, defense: 3 },
} as const

export type ItemId = keyof typeof items
export type EncounterId = keyof typeof encounters

export const troops = {
  sentry: { name: 'Sentinela', role: 'Absorve golpes na frente', gold: 24, supplies: 2, hp: 76, power: 16, defense: 9, speed: 5 },
  bowman: { name: 'Besteiro', role: 'Ataca da retaguarda', gold: 27, supplies: 2, hp: 52, power: 21, defense: 4, speed: 11 },
} as const

export type TroopId = keyof typeof troops
