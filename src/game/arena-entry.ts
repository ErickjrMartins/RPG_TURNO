import type Phaser from 'phaser'
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

export interface ArenaEntry {
  fromX: number
  home: ReturnType<typeof pointFor>
  direction: number
  delay: number
  duration: number
  cycles: number
  floating: boolean
  audible: boolean
  elapsed: number
  step: number
}

export function arenaEntry(unit: Unit, width: number, initial: boolean): ArenaEntry {
  const home = pointFor(unit)
  const direction = unit.team === 'allies' ? 1 : -1
  const edge = direction === 1 ? -width / 2 : arenaWidth + width / 2
  // Reinforcements join from the near wings so they do not hold up the next turn.
  const fromX = initial ? edge : home.x - direction * Math.min(Math.abs(edge - home.x), unit.boss ? 246 : 170)
  const floating = unit.art === 'wisp' || unit.art === 'moth'
  return {
    fromX, home, direction, floating,
    delay: initial ? (unit.slot >= 3 ? 112 : 0) + (unit.slot % 3) * 52 + (direction === 1 ? 0 : 88) : 0,
    duration: initial ? (unit.boss ? 2470 : 2210) : unit.boss ? 1680 : 1290,
    cycles: initial ? (unit.slot >= 3 ? 2 : 3) : 2,
    audible: !floating && (unit.id === 'hero' || (!initial && !!unit.boss)),
    elapsed: 0,
    step: 0,
  }
}

export function entryPose(entry: ArenaEntry) {
  const progress = Math.max(0, Math.min(1, (entry.elapsed - entry.delay) / entry.duration))
  const walking = Math.min(1, progress / 0.88)
  const settle = Math.max(0, (progress - 0.88) / 0.12)
  const stride = walking * entry.cycles
  const swing = stride * Math.PI * 2
  const strength = Math.min(1, walking * 7, (1 - walking) * 8)
  const travel = walking + (walking - walking ** 3) * 0.42 - Math.sin(swing * 2) * 0.007 * strength
  const lift = entry.floating ? (1 - Math.cos(swing)) * 3.8 * strength : Math.sin(swing) ** 2 * 3.1 * strength
  return {
    x: entry.fromX + (entry.home.x - entry.fromX) * travel,
    y: entry.home.y - lift,
    tilt: entry.direction * (Math.sin(swing) * 0.026 * strength - Math.sin(settle * Math.PI) * 0.018),
    frame: Math.floor((stride % 1) * frames),
    step: Math.floor(stride * 2 + 0.00001),
    opacity: Math.min(1, progress * 12),
    complete: progress === 1,
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
      const sourceX = boundPixel(x - (left - right) * swing * width * 0.062, width - 1)
      const sourceY = boundPixel(y + (swing >= 0 ? left : right) * Math.abs(swing) * 7, height - 1)
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
