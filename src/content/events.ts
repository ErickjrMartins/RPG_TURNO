import type { StockId } from './relics'

export const loginRewards: readonly Partial<Record<StockId, number>>[] = [
  { ash: 4 }, { energy: 1 }, { 'pin-life': 1 }, { ichor: 3 }, { graft: 1 }, { 'curse-core': 1 }, { ash: 10, 'profaned-thread': 4 },
]

export const packs = {
  sparks: { label: 'Centelhas', cash: 120, price: 990 },
  seal: { label: 'Selo Dourado', cash: 360, price: 2490 },
  vault: { label: 'Tesouro Selado', cash: 800, price: 4990 },
} as const
export type PackId = keyof typeof packs

export const rechargeGoals = [
  { amount: 120, reward: { ash: 8, ichor: 2 } },
  { amount: 360, reward: { 'pin-oath': 1, graft: 2 } },
  { amount: 800, reward: { 'core-void': 1, awakening: 3 } },
] as const

export const seasonCost = 120
export const coutureCost = 90
export const threadCost = 4
export const spinCost = 30
export const spinRate = 0.12
export const spinPity = 8
