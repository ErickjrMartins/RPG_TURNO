import type { ZoneId } from './campaign'

export type BossId = 'gate' | ZoneId

interface BossPhase {
  name: string
  energy: readonly [string, string]
}

interface BossSpec {
  level: number
  layers: 1 | 2 | 3 | 4
  rune: string
  metal: string
  ornament: 'spines' | 'hooks' | 'shards'
  particles: 'embers' | 'mist' | 'sparks'
  change: 'reinforced' | 'barrier-broken' | 'last-layer'
  phases: readonly [BossPhase, BossPhase]
}

export const bosses: Readonly<Record<BossId, BossSpec>> = {
  gate: {
    level: 2, layers: 4, rune: 'ᛟ', metal: '#a6856c', ornament: 'spines', particles: 'sparks', change: 'reinforced',
    phases: [
      { name: 'Vigília do Bloqueio', energy: ['#8345e6', '#74d8ff'] },
      { name: 'Corte do Véu', energy: ['#c53065', '#ffb46d'] },
    ],
  },
  watch: {
    level: 3, layers: 2, rune: 'ᚲ', metal: '#c48356', ornament: 'hooks', particles: 'embers', change: 'last-layer',
    phases: [
      { name: 'Brasa contida', energy: ['#bb4923', '#ffe487'] },
      { name: 'Brasa exposta', energy: ['#df3d25', '#ff9260'] },
    ],
  },
  hollow: {
    level: 4, layers: 3, rune: 'ᛁ', metal: '#83a598', ornament: 'hooks', particles: 'mist', change: 'last-layer',
    phases: [
      { name: 'Névoa do Brejo', energy: ['#227f83', '#c0ffd6'] },
      { name: 'Névoa profunda', energy: ['#3b5fa1', '#74fcfb'] },
    ],
  },
  core: {
    level: 5, layers: 4, rune: 'ᛉ', metal: '#a490b9', ornament: 'spines', particles: 'mist', change: 'last-layer',
    phases: [
      { name: 'Véu intacto', energy: ['#823cbd', '#e8a1ff'] },
      { name: 'Véu em ruína', energy: ['#603dcd', '#98dcff'] },
    ],
  },
  drowned: {
    level: 6, layers: 3, rune: 'ᛒ', metal: '#a79e61', ornament: 'hooks', particles: 'mist', change: 'last-layer',
    phases: [
      { name: 'Raízes submersas', energy: ['#477746', '#d3ff99'] },
      { name: 'Raízes expostas', energy: ['#8a651d', '#fcdf86'] },
    ],
  },
  mothvault: {
    level: 7, layers: 3, rune: 'ᛈ', metal: '#bc87b8', ornament: 'spines', particles: 'sparks', change: 'last-layer',
    phases: [
      { name: 'Escamas abissais', energy: ['#a64192', '#ffc8fa'] },
      { name: 'Escamas incandescentes', energy: ['#bb3b67', '#ffb2ab'] },
    ],
  },
  frostpath: {
    level: 8, layers: 3, rune: 'ᛋ', metal: '#8aa8bd', ornament: 'shards', particles: 'sparks', change: 'last-layer',
    phases: [
      { name: 'Geada', energy: ['#4078c2', '#e2faff'] },
      { name: 'Degelo', energy: ['#277281', '#8bffe9'] },
    ],
  },
  observatory: {
    level: 9, layers: 4, rune: 'ᚺ', metal: '#a2b6c7', ornament: 'shards', particles: 'mist', change: 'last-layer',
    phases: [
      { name: 'Gelo antigo', energy: ['#416dc4', '#b0eaff'] },
      { name: 'Gelo fraturado', energy: ['#437da6', '#fcfdff'] },
    ],
  },
  nest: {
    level: 5, layers: 4, rune: 'ᛞ', metal: '#b78394', ornament: 'shards', particles: 'embers', change: 'barrier-broken',
    phases: [
      { name: 'Barreira erguida', energy: ['#6b477a', '#cbadff'] },
      { name: 'Barreira rompida', energy: ['#b42e62', '#ffb493'] },
    ],
  },
}
