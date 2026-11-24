import type { Attributes } from './classes'
import type { MonsterId } from './monsters'
import type { RelicId, StockId } from './relics'

export const regions = { fields: 'Campos de Alvor', marsh: 'Pântanos do Véu', ridge: 'Cordilheira Cinzenta' } as const
export type Region = keyof typeof regions

interface Zone {
  name: string
  intro: string
  prerequisite: string
  region: Region
  monsters?: readonly MonsterId[]
  focus: number
  core: { name: string; stats: Attributes; art?: MonsterId }
  ratingRounds: number
  marks: number
  rate: number
  loot: Partial<Record<StockId, number>>
  relic: RelicId
}

export const zones = {
  watch: {
    region: 'fields',
    name: 'Posto das Cinzas', intro: 'Desfaça os dois focos para revelar o núcleo da quarentena.', prerequisite: 'gate',
    focus: 2, core: { name: 'Núcleo da Vigília', stats: { hp: 82, power: 17, defense: 7, speed: 8 } },
    ratingRounds: 8, marks: 2, rate: 0.15, loot: { ash: 9, ichor: 2, 'glyph-pest': 1, 'pin-life': 1, graft: 1 }, relic: 'veil-edge',
  },
  hollow: {
    region: 'fields',
    name: 'Brejo do Silêncio', intro: 'Desfaça os três focos do brejo e detenha seu núcleo.', prerequisite: 'watch',
    focus: 3, core: { name: 'Núcleo do Silêncio', stats: { hp: 100, power: 18, defense: 7, speed: 11 } },
    ratingRounds: 10, marks: 3, rate: 0.20, loot: { ash: 12, ichor: 3, 'glyph-void': 1, 'pin-aim': 1, graft: 1 }, relic: 'ash-mantle',
  },
  core: {
    region: 'fields',
    name: 'Coração do Véu', intro: 'Expurgue os focos do capítulo e destrua o núcleo que os sustenta.', prerequisite: 'hollow',
    focus: 3, core: { name: 'Calamidade do Véu', stats: { hp: 142, power: 22, defense: 9, speed: 12 } },
    ratingRounds: 11, marks: 4, rate: 0.25, loot: { ash: 15, ichor: 4, 'glyph-void': 1, 'pin-resist': 1, graft: 1 }, relic: 'veil-rosary',
  },
  drowned: {
    region: 'marsh', name: 'Sinos Submersos', intro: 'As raízes movediças escondem a passagem para os pântanos.', prerequisite: 'core',
    focus: 3, monsters: ['rootbound', 'moth', 'rootbound'], ratingRounds: 11, marks: 5, rate: 0.27,
    core: { name: 'Patriarca das Raízes', art: 'rootbound', stats: { hp: 126, power: 21, defense: 9, speed: 8 } },
    loot: { ash: 17, ichor: 4, 'glyph-pest': 1, 'pin-resist': 1 }, relic: 'veil-rosary',
  },
  mothvault: {
    region: 'marsh', name: 'Cisterna das Mariposas', intro: 'Encontre a matriarca. Suas escamas marcam primeiro o aliado mais frágil.', prerequisite: 'drowned',
    focus: 3, monsters: ['rootbound', 'moth', 'moth'], ratingRounds: 12, marks: 6, rate: 0.30,
    core: { name: 'Matriarca da Cisterna', art: 'moth', stats: { hp: 135, power: 22, defense: 8, speed: 15 } },
    loot: { ash: 19, ichor: 5, 'glyph-pest': 1, 'pin-aim': 1 }, relic: 'hollow-loop',
  },
  frostpath: {
    region: 'ridge', name: 'Passo da Geada', intro: 'Os linces atravessam a linha de frente para atingir a retaguarda.', prerequisite: 'mothvault',
    focus: 3, monsters: ['frostcat', 'frostcat', 'glacier'], ratingRounds: 12, marks: 7, rate: 0.32,
    core: { name: 'Lince do Degelo', art: 'frostcat', stats: { hp: 145, power: 23, defense: 8, speed: 16 } },
    loot: { ash: 21, ichor: 5, 'glyph-void': 1, 'pin-guard': 1 }, relic: 'ash-mantle',
  },
  observatory: {
    region: 'ridge', name: 'Observatório das Cinzas', intro: 'Rompa a formação glacial. O Vigia ergue uma muralha a cada três rodadas.', prerequisite: 'frostpath',
    focus: 3, monsters: ['glacier', 'frostcat', 'glacier'], ratingRounds: 13, marks: 8, rate: 0.35,
    core: { name: 'Vigia do Gelo Antigo', art: 'glacier', stats: { hp: 158, power: 23, defense: 12, speed: 9 } },
    loot: { ash: 24, ichor: 6, 'pin-oath': 1, awakening: 2 }, relic: 'abyss-heart',
  },
  nest: {
    region: 'fields',
    name: 'Ninho da Ruptura', intro: 'Protótipo local. Após os focos, use um Abismo Pessoal durante a barreira do núcleo.', prerequisite: 'watch',
    focus: 3, core: { name: 'Sentinela da Ruptura', stats: { hp: 151, power: 18, defense: 9, speed: 13 } },
    ratingRounds: 12, marks: 5, rate: 0.35, loot: { ash: 15, ichor: 4, 'pin-oath': 1, awakening: 1 }, relic: 'abyss-heart',
  },
} as const satisfies Record<string, Zone>

export type ZoneId = keyof typeof zones
export const zonesIds = Object.keys(zones) as ZoneId[]
export const zone = (id: ZoneId): Zone => zones[id]
export const challengeBonus = 0.22
export const sweepCost = 1
export const dailyEnergy = 5
export const coreExchange = 10
