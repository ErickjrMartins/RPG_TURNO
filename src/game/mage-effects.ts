import type Phaser from 'phaser'
import { pointFor } from './layout'
import type { Unit } from '../domain/battle'

const spells = ['spark', 'rain', 'renew', 'chorus', 'void-circle', 'void-pulse', 'thread', 'dew', 'dawn', 'prism', 'tear']

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
          ink.lineStyle(14, 0x3279ff, 0.28)
          ink.lineBetween(tailX, tailY, travelX, travelY)
          ink.lineStyle(4, 0x88daff, 0.95)
          ink.lineBetween(tailX, tailY, travelX, travelY)
          ink.fillStyle(0xe4fbff, 0.95)
          ink.fillCircle(travelX, travelY, 6)
        }
        if (t > 0.43) particles(ink, x, hit, 33, (t - 0.43) / 0.57, 8, 0x88daff)
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
      } else if (spell === 'thread') {
        rune(ink, x, ground, 27 + t * 12, 1 - t, 0xffce86)
        if (source) {
          const start = source.y - 57
          ink.lineStyle(2, 0xffebbf, Math.sin(t * Math.PI))
          ink.lineBetween(source.x, start, x, hit)
          ink.fillStyle(0xffce86, 1 - t)
          ink.fillCircle(source.x + (x - source.x) * t, start + (hit - start) * t, 6)
        }
        particles(ink, x, hit, 37, t, 12, 0xffc27e)
      } else if (spell === 'dew' || spell === 'dawn') {
        const burst = spell === 'dawn'
        const color = burst ? 0xfff0c8 : 0x94d5e4
        rune(ink, x, ground, 25 + t * (burst ? 55 : 17), 1 - t, color)
        ink.fillStyle(color, Math.sin(t * Math.PI) * (burst ? 0.31 : 0.12))
        ink.fillEllipse(x, hit, burst ? 92 : 42, burst ? 165 : 72)
        for (let ray = -2; ray <= 2; ray++) {
          const y = burst ? ground - t * (99 - 10 * Math.abs(ray)) : hit + t * 37 - (ray + 2) * 8
          ink.lineStyle(burst ? 3 : 2, color, 1 - t)
          ink.lineBetween(x + 12 * ray, y, x + 12 * ray, y - (burst ? 26 : 7))
        }
      } else if (spell === 'prism') {
        rune(ink, x, ground, 34 + t * 8, 1 - t, 0xaadfff)
        ink.lineStyle(2, 0xccedff, 1 - t)
        for (let facet = 0; facet < 6; facet++) {
          const angle = facet * Math.PI / 3 + t
          const next = angle + Math.PI / 3
          ink.lineBetween(x + 27 * Math.cos(angle), hit + 42 * Math.sin(angle), x + 27 * Math.cos(next), hit + 42 * Math.sin(next))
        }
      } else if (spell === 'tear') {
        ink.lineStyle(15, 0x120a29, 1 - t)
        ink.lineBetween(x - 37, hit + 27, x + 41, hit - 37)
        ink.lineStyle(3, 0xd48af7, 1 - t)
        ink.lineBetween(x - 40, hit + 24, x + 43, hit - 39)
        particles(ink, x, hit, 66, t, 15, 0xaf77fa)
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
