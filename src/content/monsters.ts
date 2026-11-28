export const monsters = {
  rootbound: { name: 'Retorcido da Raiz', art: 'rootbound', hp: 48, power: 15, defense: 7, speed: 6 },
  moth: { name: 'Mariposa Abissal', art: 'moth', hp: 43, power: 14, defense: 4, speed: 11 },
  frostcat: { name: 'Lince de Geada', art: 'frostcat', hp: 56, power: 18, defense: 6, speed: 14 },
  glacier: { name: 'Colosso Glacial', art: 'glacier', hp: 67, power: 17, defense: 10, speed: 7 },
} as const

export type MonsterId = keyof typeof monsters
export const monsterIds = Object.keys(monsters) as MonsterId[]
export const coreArt = ['curse-watch', 'curse-hollow', 'curse-veil', 'curse-rupture'] as const
export type CoreArt = typeof coreArt[number]
