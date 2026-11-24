export const buildings = {
  council: {
    name: 'Salão do Conselho', icon: '♜',
    description: 'Amplia o nível máximo dos outros edifícios.',
    position: [29, 36], upgrades: [{ gold: 18, supplies: 1, seconds: 12 }, { gold: 28, supplies: 2, seconds: 30 }],
  },
  barracks: {
    name: 'Quartel dos Guardiões', icon: '⚔︎',
    description: 'Recruta tropas e define o nível máximo de treinamento.',
    position: [72, 36], upgrades: [{ gold: 14, supplies: 1, seconds: 15 }, { gold: 23, supplies: 2, seconds: 35 }],
  },
  farm: {
    name: 'Fazenda do Vale', icon: '✿',
    description: 'Acumula provisões para coletar e usar no Refúgio.',
    position: [24, 74], upgrades: [{ gold: 12, supplies: 1, seconds: 12 }, { gold: 20, supplies: 2, seconds: 30 }],
  },
  treasury: {
    name: 'Tesouraria', icon: '◇',
    description: 'Aumenta o limite de ouro da campanha.',
    position: [75, 73], upgrades: [{ gold: 16, supplies: 1, seconds: 16 }, { gold: 25, supplies: 2, seconds: 36 }],
  },
} as const

export type BuildingId = keyof typeof buildings
export const buildingIds = Object.keys(buildings) as BuildingId[]
export const maxBuildingLevel = 3
export const farmRates = [
  { seconds: 12, capacity: 8 },
  { seconds: 9, capacity: 13 },
  { seconds: 6, capacity: 20 },
] as const
export const goldLimits = [500, 750, 1000] as const
