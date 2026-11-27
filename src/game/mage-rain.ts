import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { playAttack } from './attack-playback'
import { pointFor } from './layout'
import { sparkTexture } from './mage-spark'

const landAt = 510
const blastDuration = 304
const targetDelay = 26
const drops = [
  { offset: -17, start: 142, land: landAt, size: 20, drift: 67 },
  { offset: 22, start: 222, land: 604, size: 16, drift: 42 },
  { offset: -36, start: 303, land: 699, size: 12, drift: 59 },
  { offset: 11, start: 397, land: 794, size: 22, drift: 75 },
  { offset: -12, start: 489, land: 886, size: 16, drift: 51 },
  { offset: 34, start: 584, land: 982, size: 13, drift: 55 },
] as const
export const rainDuration = 1360
const timeline = { duration: rainDuration, impactAt: landAt, poses: [[0, 0], [85, 1], [200, 2], [705, 1], [820, 0]] } as const
const flame = 0x275cff
const ice = 0x64ddff
const frost = 0xe1faff

function meteor(ink: Phaser.GameObjects.Graphics, x: number, y: number, size: number, time: number, alpha: number): void {
  const fireLength = size * (3.05 + Math.sin(time * 0.055) * 0.28)
  ink.fillStyle(flame, alpha * 0.25).fillCircle(x, y, size * 1.42)
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(time * 0.045 + i * 2.4) * size * 0.3
    const offset = (i - 1.5) * size * 0.49
    const tailX = x - fireLength * (0.42 - i * 0.026) + sway
    const tailY = y - fireLength * (1 - i * 0.12)
    ink.fillStyle(i % 2 ? ice : flame, alpha * (i % 2 ? 0.63 : 0.79))
    ink.fillPoints([
      { x: x + offset - size * 0.47, y: y + size * 0.23 },
      { x: tailX + size * 0.16, y: tailY + fireLength * 0.38 },
      { x: tailX, y: tailY },
      { x: tailX + size * 0.54, y: tailY + fireLength * 0.33 },
      { x: x + offset + size * 0.46, y: y + size * 0.27 },
    ], true)
  }
  const body = [
    { x: x - size * 0.76, y: y - size * 0.40 },
    { x: x - size * 0.24, y: y - size * 0.94 },
    { x: x + size * 0.34, y: y - size * 0.76 },
    { x: x + size * 0.82, y: y - size * 0.22 },
    { x: x + size * 0.61, y: y + size * 0.48 },
    { x: x + size * 0.13, y: y + size * 0.85 },
    { x: x - size * 0.51, y: y + size * 0.60 },
  ]
  ink.fillStyle(0x142b6a, alpha).fillPoints(body, true)
  ink.lineStyle(1.6, ice, alpha * 0.86).strokePoints(body, true)
  ink.fillStyle(0x3d7fc8, alpha).fillPoints([body[0]!, body[1]!, body[2]!, { x: x + size * 0.12, y: y + size * 0.16 }, body[6]!], true)
  ink.lineStyle(1.3, frost, alpha * 0.88).lineBetween(x - size * 0.23, y - size * 0.60, x + size * 0.11, y + size * 0.12)
  for (let i = 0; i < 3; i++) {
    const length = fireLength * (0.64 + i * 0.21)
    ink.fillStyle(i % 2 ? frost : ice, alpha * (0.75 - i * 0.14))
    ink.fillCircle(x - length * 0.32 + Math.sin(time * 0.052 + i * 6) * size * 0.47, y - length, 1.45 + size * 0.038)
  }
}

function burstOnGround(ink: Phaser.GameObjects.Graphics, x: number, y: number, size: number, age: number): void {
  const t = age / blastDuration
  const alpha = (1 - t) ** 1.22
  const radius = (size * 0.86 + 49 * t)
  ink.fillStyle(flame, alpha * 0.31).fillEllipse(x, y, radius * 2.27, radius * 0.73)
  ink.lineStyle(2, ice, alpha * 0.86).strokeEllipse(x, y, radius * 2, radius * 0.57)
  const flash = Math.max(0, 1 - t * 3.6)
  ink.fillStyle(ice, flash * 0.75).fillEllipse(x, y - 8, size * 3.15, size * 1.75)
  ink.fillStyle(frost, flash).fillEllipse(x, y - 7, size * 1.85, size * 0.89)
  for (let i = 0; i < 8; i++) {
    const spread = (i - 3.5) * (size * 0.17 + t * (12 + i % 3 * 4))
    const height = Math.sin(t * Math.PI) * (19 + (i % 4) * 10) + 5 + i % 4 * 4
    const shard = (2.8 + i % 3 * 1.3) * alpha + 0.4
    const chipX = x + spread
    const chipY = y - height
    ink.fillStyle(i % 3 ? ice : frost, alpha)
    ink.fillTriangle(chipX - shard, chipY, chipX + shard, chipY - shard * 0.7, chipX - Math.sign(spread) * shard, chipY - shard * 3.3)
  }
}

export function paintAstralRain(ink: Phaser.GameObjects.Graphics, points: readonly ReturnType<typeof pointFor>[], time: number): void {
  points.forEach(({ x, y }, index) => {
    const local = time - index * targetDelay
    for (const drop of drops) {
      if (local < drop.start || local >= drop.land + blastDuration) continue
      const groundX = x + drop.offset
      const groundY = y - 5 + drop.offset * 0.08
      if (local >= drop.land) {
        burstOnGround(ink, groundX, groundY, drop.size, local - drop.land)
        continue
      }
      const progress = (local - drop.start) / (drop.land - drop.start)
      const fall = progress * (0.30 + progress * 0.70)
      const altitude = (groundY + 17) * (1 - fall)
      meteor(ink, groundX - drop.drift * (1 - fall), groundY - altitude - drop.size * 0.70, drop.size, local, Math.min(1, progress * 5))
    }
  })
}

export function animateMageRain(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, targets: readonly Unit[],
  speed: number, impact: () => void, finish: () => void,
) {
  const points = targets.map(pointFor)
  return playAttack(scene, sprite, sparkTexture(form), timeline, speed, (ink, time) => paintAstralRain(ink, points, time), impact, finish)
}
