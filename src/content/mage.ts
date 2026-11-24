import { assetUrl } from '../assets'

export const mageIcons: Readonly<Record<string, string>> = {
  spark: 'spark', rain: 'rain', renew: 'renew', chorus: 'chorus', 'void-circle': 'void',
  focus: 'focus', oath: 'oath', seal: 'seal', rift: 'rift',
}

export function mageIcon(id: string): string | undefined {
  const icon = mageIcons[id]
  return icon && assetUrl(`arcana-${icon}.webp`)
}

export type MageNodeId = 'focus' | 'spark' | 'rain' | 'renew' | 'chorus' | 'rift' | 'oath' | 'seal' | 'void-circle'

interface MageNode {
  name: string
  discipline: 'Condução' | 'Astral' | 'Vital' | 'Vazio'
  description: string
  max: number
  position: [number, number]
  parents: readonly MageNodeId[]
}

export const mageNodes = {
  focus: { name: 'Núcleo de Foco', discipline: 'Condução', description: '+4 Foco inicial por nível.', max: 3, position: [11, 50], parents: [] },
  spark: { name: 'Rastro de Cometa', discipline: 'Astral', description: '+12% de potência da Centelha por nível.', max: 3, position: [33, 21], parents: ['focus'] },
  rain: { name: 'Constelação Ardente', discipline: 'Astral', description: '+3 de dano por nível na queimadura da Chuva Astral.', max: 3, position: [57, 17], parents: ['spark'] },
  renew: { name: 'Seiva de Estrelas', discipline: 'Vital', description: '+6 de cura por nível na Renovação.', max: 3, position: [33, 52], parents: ['focus'] },
  chorus: { name: 'Ressonância Vital', discipline: 'Vital', description: '+4 de cura por nível no Coro Vital.', max: 3, position: [57, 50], parents: ['renew'] },
  rift: { name: 'Margem do Vazio', discipline: 'Vazio', description: '+3 de dano por nível em cada pulso do Círculo do Vazio.', max: 3, position: [33, 82], parents: ['focus'] },
  oath: { name: 'Juramento Sereno', discipline: 'Vazio', description: 'Reduz em 2 o custo de Vida das Juras por nível.', max: 3, position: [57, 81], parents: ['rift'] },
  seal: { name: 'Selo de Órbita', discipline: 'Condução', description: 'Acrescenta 5 de Mácula inicial por nível.', max: 2, position: [76, 25], parents: ['rain'] },
  'void-circle': { name: 'Horizonte do Abismo', discipline: 'Vazio', description: 'Reduz em 5 o custo de Mácula do Círculo do Vazio por nível.', max: 2, position: [88, 61], parents: ['chorus', 'oath'] },
} as const satisfies Record<MageNodeId, MageNode>

export const mageNodeIds = Object.keys(mageNodes) as MageNodeId[]
