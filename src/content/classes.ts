import { assetUrl } from '../assets'

export interface Attributes {
  hp: number
  power: number
  defense: number
  speed: number
}

export const classes = {
  warrior: {
    name: 'Vanguarda',
    feminineName: 'Vanguarda',
    role: 'Defesa e controle',
    description: 'Protege a formação com escudos e rompe a defesa inimiga.',
    personality: 'Protege os seus com firmeza e encara a ameaça de frente.',
    entranceLine: 'Fiquem atrás de mim. Quero ver ele tentar.',
    resource: 'Ímpeto',
    icon: '⚔︎',
    color: '#dcaf7a',
    attributes: { hp: 138, power: 25, defense: 12, speed: 7 },
  },
  archer: {
    name: 'Atirador',
    feminineName: 'Atiradora',
    role: 'Precisão e dano',
    description: 'Atinge alvos distantes e marca pontos fracos para o próximo disparo.',
    personality: 'Provoca com humor seco enquanto calcula o próximo disparo.',
    entranceLine: 'Já escolheu onde vai cair?',
    resource: 'Concentração',
    icon: '➶',
    color: '#b9ce9d',
    attributes: { hp: 105, power: 28, defense: 7, speed: 13 },
  },
  mage: {
    name: 'Canalizador',
    feminineName: 'Canalizadora',
    role: 'Magia e suporte',
    description: 'Conjura ataques em área e mantém os aliados de pé com cura.',
    personality: 'Fala pouco e mantém a calma quando o Véu se agita.',
    entranceLine: 'O Véu já ouviu o seu nome.',
    resource: 'Foco',
    icon: '✧',
    color: '#c9aadf',
    attributes: { hp: 112, power: 27, defense: 5, speed: 10 },
  },
} as const

export type ClassId = keyof typeof classes
export type Presentation = 'masculine' | 'feminine'

export const classIds = Object.keys(classes) as ClassId[]

export function className(classId: ClassId, presentation: Presentation): string {
  const heroClass = classes[classId]
  return presentation === 'feminine' ? heroClass.feminineName : heroClass.name
}

export function heroArt(classId: ClassId, presentation: Presentation): string {
  return assetUrl(`${classId}-${presentation}.webp`)
}
