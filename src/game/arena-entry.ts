import type Phaser from 'phaser'
import { classes, type ClassId } from '../content/classes'
import type { Unit } from '../domain/battle'
import { arenaWidth, pointFor } from './layout'

const strideRigs: Readonly<Record<string, readonly [number, number]>> = {
  'warrior-masculine': [0.40, 0.68],
  'warrior-feminine': [0.39, 0.69],
  'archer-masculine': [0.35, 0.62],
  'archer-feminine': [0.35, 0.60],
  'mage-masculine': [0.38, 0.61],
  'mage-feminine': [0.34, 0.60],
  sentry: [0.27, 0.62],
  warden: [0.39, 0.77],
  crawler: [0.23, 0.78],
  rootbound: [0.34, 0.69],
  frostcat: [0.16, 0.82],
  glacier: [0.36, 0.75],
}

const frames = 12
const columns = 4
const height = 160
const heroStride = {
  warrior: { duration: 2300, cycles: 3, lift: 2.2, tilt: 0.009, finalLean: 0.022, finalDrop: 5 },
  archer: { duration: 2120, cycles: 3, lift: 4.1, tilt: 0.015, finalLean: -0.027, finalDrop: -2 },
  mage: { duration: 2480, cycles: 2, lift: 1.2, tilt: 0.006, finalLean: 0.010, finalDrop: -4 },
} as const

export interface ArenaEntry {
  origin: ReturnType<typeof pointFor>
  home: ReturnType<typeof pointFor>
  direction: number
  delay: number
  duration: number
  cycles: number
  floating: boolean
  audible: boolean
  elapsed: number
  step: number
  heroClass?: ClassId
  boss: boolean
}

export function arenaEntry(unit: Unit, initial: boolean, heroClass?: ClassId): ArenaEntry {
  const home = pointFor(unit)
  const direction = unit.team === 'allies' ? 1 : -1
  // Each fighter comes forward along its own lane, with a small perspective convergence.
  const origin = {
    x: home.x + (arenaWidth / 2 - home.x) * 0.05,
    y: Math.max(104, home.y - (initial ? 119 : 86)),
  }
  const floating = unit.art === 'wisp' || unit.art === 'moth'
  const stride = heroClass && heroStride[heroClass]
  return {
    origin, home, direction, floating,
    delay: initial ? (unit.slot >= 3 ? 75 : 0) + (unit.slot % 3) * 63 + (direction === 1 ? 0 : 110) : 0,
    duration: stride ? stride.duration : initial ? (unit.boss ? 2470 : 2210) : unit.boss ? 1680 : 1290,
    cycles: stride ? stride.cycles : initial && unit.slot < 3 ? 3 : 2,
    audible: !floating && (unit.id === 'hero' || (!initial && !!unit.boss)),
    elapsed: 0,
    step: 0,
    heroClass,
    boss: Boolean(unit.boss),
  }
}

export function entryPose(entry: ArenaEntry) {
  const progress = Math.max(0, Math.min(1, (entry.elapsed - entry.delay) / entry.duration))
  const walking = Math.min(1, progress / 0.88)
  const settle = Math.max(0, (progress - 0.88) / 0.12)
  const stride = walking * entry.cycles
  const swing = stride * Math.PI * 2
  const strength = Math.min(1, walking * 7, (1 - walking) * 8)
  const style = entry.heroClass && heroStride[entry.heroClass]
  const landing = Math.sin(settle * Math.PI)
  const travel = walking + (walking - walking ** 3) * 0.42 - Math.sin(swing * 2) * 0.007 * strength
  const lift = entry.floating ? (1 - Math.cos(swing)) * 3.8 * strength : Math.sin(swing) ** 2 * (style ? style.lift : 3.1) * strength
  const groundY = entry.origin.y + (entry.home.y - entry.origin.y) * travel
  return {
    x: entry.origin.x + (entry.home.x - entry.origin.x) * travel,
    y: groundY - lift + landing * (style ? style.finalDrop : 0),
    groundY,
    scale: 0.64 + travel * 0.36,
    tilt: entry.direction * (Math.sin(swing) * (style ? style.tilt : 0.010) * strength + landing * (style ? style.finalLean : 0.012)),
    frame: Math.floor((stride % 1) * frames),
    step: Math.floor(stride * 2 + 0.00001),
    opacity: Math.min(1, progress * 12),
    signature: Math.max(0, (progress - 0.78) / 0.22),
    complete: progress === 1,
  }
}

export function drawEntrySignature(
  ink: Phaser.GameObjects.Graphics, signature: ClassId | 'boss', x: number, y: number, height: number, progress: number,
): void {
  const tint = signature === 'boss' ? 0xbc92ee : Number.parseInt(classes[signature].color.slice(1), 16)
  const alpha = Math.min(1, progress * 6) * (1 - progress) ** 0.66
  const ring = (signature === 'boss' ? 76 : 48) + progress * 45
  ink.clear()
  ink.lineStyle(2, tint, alpha * 0.68)
  ink.strokeEllipse(x, y - 3, ring, ring * 0.26)
  ink.fillStyle(tint, alpha * 0.84)
  for (const offset of [-3, -2, -1, 1, 2, 3]) {
    ink.fillCircle(x + offset * (9 + progress * 12), y - 8 - progress * (18 + (4 - Math.abs(offset)) * 9), 1.3 + (4 - Math.abs(offset)) * 0.2)
  }
  switch (signature) {
    case 'warrior': {
      const reach = 17 + 35 * progress
      ink.lineStyle(2, tint, alpha)
      for (const direction of [-1, 1]) {
        ink.lineBetween(x + direction * 12, y - 2, x + reach * direction, y - 8 * progress)
        ink.fillStyle(tint, alpha)
        ink.fillCircle(x + direction * (reach + 5), y - 9 - 16 * progress, 2)
      }
      break
    }
    case 'archer': {
      const bow = x + 29
      const sight = y - height * 0.63
      const glint = 4 + 12 * progress
      ink.lineStyle(1.5, tint, alpha)
      ink.strokeCircle(bow, sight, glint)
      ink.lineBetween(bow - glint * 1.5, sight, bow + glint * 1.5, sight)
      ink.lineBetween(bow, sight - glint * 1.5, bow, sight + glint * 1.5)
      break
    }
    case 'mage':
      ink.lineStyle(1.5, tint, alpha)
      ink.strokeEllipse(x, y - 7, 44 + progress * 48, 14 + progress * 14)
      ink.strokeEllipse(x, y - 7, 30 + progress * 33, 9 + progress * 9)
      for (const direction of [-1, 1]) {
        const rune = x + direction * (18 + progress * 22)
        ink.lineBetween(rune - 3, y - 13, rune + 3, y - 19)
        ink.lineBetween(rune + 3, y - 19, rune - 3, y - 22)
      }
      break
    case 'boss':
      ink.lineStyle(2, tint, alpha)
      ink.strokeEllipse(x, y - 5, ring * 0.76, ring * 0.20)
      for (const side of [-1, 1]) {
        const edge = x + side * ring * 0.45
        ink.lineBetween(edge, y - 8, edge + side * 12, y - 16 - progress * 11)
      }
      break
  }
}

export function prepareEntryTexture(scene: Phaser.Scene, art: string): string | undefined {
  const legs = strideRigs[art]
  if (!legs) return
  const key = `entry-${art}`
  if (scene.textures.exists(key)) return key
  const source = scene.textures.get(art).getSourceImage()
  if (!(source instanceof HTMLImageElement || source instanceof HTMLCanvasElement)) return
  const originalWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const originalHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  if (!originalWidth || !originalHeight) return
  const width = Math.max(1, Math.round(height * originalWidth / originalHeight))
  const sample = document.createElement('canvas')
  sample.width = width
  sample.height = height
  const brush = sample.getContext('2d', { willReadFrequently: true })
  if (!brush) return
  brush.drawImage(source, 0, 0, width, height)
  const original = brush.getImageData(0, 0, width, height).data

  const sheet = document.createElement('canvas')
  sheet.width = width * columns
  sheet.height = height * frames / columns
  const context = sheet.getContext('2d')
  if (!context) return
  const frame = context.createImageData(width, height)
  const pixels: { x: number; y: number; offset: number; left: number; right: number }[] = []
  for (let y = Math.floor(height * 0.56); y < height; y++) {
    const depth = Math.min(1, Math.max(0, (y / height - 0.56) / 0.38))
    const influence = depth * depth * (3 - 2 * depth)
    for (let x = 0; x < width; x++) {
      const u = x / width
      const left = influence * Math.max(0, 1 - ((u - legs[0]) / 0.20) ** 2)
      const right = influence * Math.max(0, 1 - ((u - legs[1]) / 0.20) ** 2)
      if (left + right > 0.01) pixels.push({ x, y, left, right, offset: (y * width + x) * 4 })
    }
  }

  for (let index = 0; index < frames; index++) {
    frame.data.set(original)
    const swing = Math.sin(index * Math.PI * 2 / frames)
    for (const { x, y, offset, left, right } of pixels) {
      const sourceX = boundPixel(x - (left - right) * swing * width * 0.042, width - 1)
      const sourceY = boundPixel(y + (swing >= 0 ? left : right) * Math.abs(swing) * 9, height - 1)
      const x0 = Math.floor(sourceX)
      const y0 = Math.floor(sourceY)
      const x1 = Math.min(x0 + 1, width - 1)
      const y1 = Math.min(y0 + 1, height - 1)
      const u = sourceX - x0
      const v = sourceY - y0
      const a = (y0 * width + x0) * 4
      const b = (y0 * width + x1) * 4
      const c = (y1 * width + x0) * 4
      const d = (y1 * width + x1) * 4
      const wA = (1 - u) * (1 - v) * original[a + 3]!
      const wB = u * (1 - v) * original[b + 3]!
      const wC = (1 - u) * v * original[c + 3]!
      const wD = u * v * original[d + 3]!
      const alpha = wA + wB + wC + wD
      frame.data[offset + 3] = alpha
      if (!alpha) continue
      for (let channel = 0; channel < 3; channel++) {
        frame.data[offset + channel] = (original[a + channel]! * wA + original[b + channel]! * wB
          + original[c + channel]! * wC + original[d + channel]! * wD) / alpha
      }
    }
    context.putImageData(frame, index % columns * width, Math.floor(index / columns) * height)
  }

  const texture = scene.textures.addCanvas(key, sheet)
  if (!texture) return
  for (let index = 0; index < frames; index++) {
    texture.add(index, 0, index % columns * width, Math.floor(index / columns) * height, width, height)
  }
  return key
}

function boundPixel(value: number, limit: number): number {
  return Math.min(limit, Math.max(0, value))
}
