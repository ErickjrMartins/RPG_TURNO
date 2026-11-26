import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { playAttack } from './attack-playback'
import { pointFor } from './layout'
import { sparkTexture } from './mage-spark'

const impactAt = 625
export const rainDuration = 975
const timeline = { duration: rainDuration, impactAt, poses: [[0, 0], [85, 1], [200, 2], [675, 1], [790, 0]] } as const
const crystalBlue = 0x2e78ff
const facetBlue = 0x67ceff
const frost = 0xdff9ff

const drops = [
  { offset: -30, delay: 215, size: 23, drift: 42 },
  { offset: 30, delay: 270, size: 25, drift: 34 },
  { offset: -14, delay: 304, size: 37, drift: 55 },
  { offset: 15, delay: 230, size: 33, drift: 37 },
  { offset: 0, delay: 175, size: 58, drift: 68 },
] as const

function crystal(ink: Phaser.GameObjects.Graphics, x: number, y: number, size: number, alpha: number): void {
  const high = { x: x - size * 0.43, y: y - size }
  const left = { x: x - size * 0.55, y: y - size * 0.51 }
  const right = { x: x - size * 0.10, y: y - size * 0.71 }
  const ridge = { x: x - size * 0.32, y: y - size * 0.55 }
  const tip = { x, y }
  ink.lineStyle(size * 0.46, crystalBlue, alpha * 0.17)
  ink.lineBetween(high.x - size * 0.4, high.y - size * 0.9, x, y)
  ink.fillStyle(crystalBlue, alpha)
  ink.fillPoints([high, left, tip, right], true)
  ink.fillStyle(facetBlue, alpha)
  ink.fillPoints([high, ridge, tip, right], true)
  ink.lineStyle(Math.max(1, size * 0.04), frost, alpha * 0.93)
  ink.lineBetween(high.x, high.y, ridge.x, ridge.y)
  ink.lineBetween(ridge.x, ridge.y, x, y)
}

export function paintAstralRain(ink: Phaser.GameObjects.Graphics, points: readonly ReturnType<typeof pointFor>[], time: number): void {
  for (const { x, y } of points) {
    const hit = y - 74
    const burst = Math.max(0, (time - impactAt) / (rainDuration - impactAt))
    const glow = Math.min(1, time / 180) * (1 - burst)
    ink.fillStyle(crystalBlue, glow * 0.10)
    ink.fillEllipse(x, y - 7, 84 + burst * 84, 22 + burst * 16)
    ink.lineStyle(2, facetBlue, glow * 0.47)
    ink.strokeEllipse(x, y - 7, 80 + burst * 91, 20 + burst * 14)
    for (const drop of drops) {
      const progress = (time - drop.delay) / (impactAt - drop.delay)
      if (progress <= 0 || progress >= 1) continue
      const fall = progress * progress
      const rise = Math.max(95, hit + 8)
      crystal(ink, x + drop.offset - drop.drift * (1 - fall), hit - rise * (1 - fall), drop.size, Math.min(1, progress * 6))
    }
    if (time < impactAt) continue
    ink.fillStyle(crystalBlue, (1 - burst) * 0.29)
    ink.fillCircle(x, hit, 19 + burst * 40)
    ink.fillStyle(frost, Math.max(0, 1 - burst * 6) * 0.82)
    ink.fillCircle(x, hit, 13 + burst * 18)
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.399963 + 0.18
      const radius = 6 + burst * (35 + i % 4 * 12)
      const chipX = x + radius * Math.cos(angle)
      const chipY = hit + radius * Math.sin(angle) * 0.72 + burst * burst * 18
      const size = (9 + i % 4 * 3) * (1 - burst)
      ink.fillStyle(i % 3 ? facetBlue : frost, 1 - burst)
      ink.fillTriangle(chipX - size * 0.45, chipY + size * 0.25, chipX, chipY - size * 0.75, chipX + size * 0.38, chipY + size * 0.36)
    }
  }
}

export function animateMageRain(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, targets: readonly Unit[],
  speed: number, impact: () => void, finish: () => void,
) {
  const points = targets.map(pointFor)
  return playAttack(scene, sprite, sparkTexture(form), timeline, speed, (ink, time) => paintAstralRain(ink, points, time), impact, finish)
}
