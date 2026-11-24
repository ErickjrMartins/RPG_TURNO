import type Phaser from 'phaser'
import { pointFor } from './layout'
import type { Unit } from '../domain/battle'

const spells = ['spark', 'rain', 'renew', 'chorus', 'void-circle', 'void-pulse']

function rune(ink: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, alpha: number, color: number): void {
  ink.lineStyle(2, color, alpha)
  ink.strokeEllipse(x, y, radius * 2, radius * 0.57)
  ink.strokeEllipse(x, y, radius * 1.68, radius * 0.45)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const cos = Math.cos(angle)
    const sin = Math.sin(angle) * 0.3
    ink.lineBetween(x + cos * radius * 0.73, y + sin * radius * 0.73, x + cos * radius, y + sin * radius)
  }
}

function particles(ink: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, t: number, count: number, color: number): void {
  for (let i = 0; i < count; i++) {
    const angle = i * 2.3999632297 + t
    ink.fillStyle(i % 3 ? color : 0xfff2d6, (1 - t) * 0.87)
    ink.fillCircle(x + Math.cos(angle) * radius * t, y + Math.sin(angle) * radius * t, (1 - t) * (2 + i % 3) + 0.6)
  }
}

export function animateMageSpell(scene: Phaser.Scene, spell: string, origin: Unit | undefined, targets: Unit[], speed: number): boolean {
  if (!spells.includes(spell)) return false
  const ambient = spell === 'void-circle'
  const ink = scene.add.graphics().setDepth(875)
  const points = targets.map(pointFor)
  const source = origin && pointFor(origin)
  const duration = (ambient ? 365 : 340) / speed
  const draw = (t: number) => {
    ink.clear()
    for (const point of points) {
      const x = point.x
      const ground = point.y - 8
      const hit = ground - 51
      if (spell === 'spark' && source) {
        const fly = Math.min(1, t / 0.48)
        const travelX = source.x + (x - source.x) * fly
        const travelY = source.y - 62 + (hit - source.y + 62) * fly - Math.sin(fly * Math.PI) * 20
        const trail = Math.max(0, fly - 0.17)
        const tailX = source.x + (x - source.x) * trail
        const tailY = source.y - 62 + (hit - source.y + 62) * trail - Math.sin(trail * Math.PI) * 20
        if (t < 0.57) {
          ink.lineStyle(14, 0x775ae8, 0.25)
          ink.lineBetween(tailX, tailY, travelX, travelY)
          ink.lineStyle(4, 0xd6a5ff, 0.95)
          ink.lineBetween(tailX, tailY, travelX, travelY)
          ink.fillStyle(0xfdf1ff, 0.95)
          ink.fillCircle(travelX, travelY, 6)
        }
        if (t > 0.43) particles(ink, x, hit, 46, (t - 0.43) / 0.57, 13, 0xc582ff)
      } else if (spell === 'rain') {
        rune(ink, x, ground, 32 + t * 21, 1 - t, 0xc59bff)
        for (let i = 0; i < 5; i++) {
          const drop = Math.max(0, Math.min(1, t * 2.55 - i * 0.16))
          const beamX = x + (i - 2) * 14
          const beamY = hit - 101 * (1 - drop)
          ink.lineStyle(7, 0x6a49bd, (1 - t) * 0.7)
          ink.lineBetween(beamX + 15, beamY - 29, beamX, beamY)
          ink.lineStyle(2, 0xffd69c, 1 - t)
          ink.lineBetween(beamX + 15, beamY - 29, beamX, beamY)
        }
        particles(ink, x, hit, 68, t, 19, 0xe0a1ff)
      } else if (spell === 'renew') {
        rune(ink, x, ground, 46, 1 - t, 0xaef3b9)
        for (let i = 0; i < 9; i++) {
          const theta = t * 10 + (i * Math.PI) / 4
          const y = ground - i * 9 - t * 28
          ink.fillStyle(i % 2 ? 0xbaf5c9 : 0x52d4a4, (1 - t) * 0.85)
          ink.fillCircle(x + Math.cos(theta) * 24, y, 4)
        }
        ink.fillStyle(0x72e1a1, Math.sin(t * Math.PI) * 0.19)
        ink.fillEllipse(x, hit, 65, 112)
      } else if (spell === 'chorus') {
        for (let ring = 0; ring < 3; ring++) {
          const phase = Math.max(0, Math.min(1, t * 1.55 - ring * 0.23))
          rune(ink, x, ground - ring * 10, 19 + phase * 52, (1 - phase) * 0.86, ring % 2 ? 0xc8ffe4 : 0x5ad8dc)
        }
        particles(ink, x, hit, 52, t, 10, 0x79e8d5)
      } else {
        const radius = 34 + t * (ambient ? 112 : 44)
        ink.fillStyle(0x3b1a62, (1 - t) * 0.42)
        ink.fillEllipse(x, ground, radius * 2, radius * 0.57)
        rune(ink, x, ground, radius, 1 - t, 0xe6adff)
        for (let i = 0; i < 6; i++) {
          const orbit = t * 4 + i * Math.PI / 3
          const fleckX = x + Math.cos(orbit) * radius * 0.67
          const fleckY = hit + Math.sin(orbit) * radius * 0.24
          ink.fillStyle(i % 2 ? 0xf4c9ff : 0x8a6fef, 1 - t)
          ink.fillTriangle(fleckX - 4, fleckY, fleckX + 4, fleckY, fleckX, fleckY - 13)
        }
      }
    }
  }
  draw(0)
  scene.tweens.addCounter({ from: 0, to: 1, duration, onUpdate: (tween) => draw(tween.getValue() ?? 1), onComplete: () => ink.destroy() })
  return true
}
