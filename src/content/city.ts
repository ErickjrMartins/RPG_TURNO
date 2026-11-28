export const baseName = 'Central de Contenção'
export const plazaName = 'Pátio de Alvor'

export const buildings = {
  council: {
    name: 'Sala de Comando', icon: '⌖',
    description: 'Coordena a quarentena e amplia o nível máximo das instalações.',
    position: [27, 37], upgrades: [{ gold: 18, supplies: 1, seconds: 12 }, { gold: 28, supplies: 2, seconds: 30 }],
  },
  barracks: {
    name: 'Quartel das Maldições', icon: '⛨',
    description: 'Reúne agentes de campo e define o nível máximo do treinamento.',
    position: [75, 36], upgrades: [{ gold: 14, supplies: 1, seconds: 15 }, { gold: 23, supplies: 2, seconds: 35 }],
  },
  farm: {
    name: 'Laboratório', icon: '⌬',
    description: 'Prepara provisões para equipar as equipes antes do expurgo.',
    position: [23, 68], upgrades: [{ gold: 12, supplies: 1, seconds: 12 }, { gold: 20, supplies: 2, seconds: 30 }],
  },
  treasury: {
    name: 'Cofre de Contenção', icon: '◇',
    description: 'Protege a reserva de créditos e aumenta o limite de armazenamento.',
    position: [76, 69], upgrades: [{ gold: 16, supplies: 1, seconds: 16 }, { gold: 25, supplies: 2, seconds: 36 }],
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
