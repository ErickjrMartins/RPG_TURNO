import type Phaser from 'phaser'
import { fabricFrames, type Flex } from './fabric-motion'

// Regions are normalized in the original images. Feet and the stiff parts of armor stay anchored.
const flexible: Record<string, readonly Flex[]> = {
  'warrior-masculine': [[0.37, 0.65, 0.10, 0.14, 3.2], [0.35, 0.03, 0.14, 0.05, 1.1]],
  'warrior-feminine': [[0.37, 0.63, 0.10, 0.15, 3.2], [0.18, 0.12, 0.15, 0.11, 2.7]],
  'archer-masculine': [[0.13, 0.66, 0.21, 0.21, 4.6], [0.16, 0.28, 0.18, 0.13, 2.9]],
  'archer-feminine': [[0.17, 0.65, 0.20, 0.21, 4.7], [0.17, 0.28, 0.17, 0.13, 3.3]],
  'mage-masculine': [[0.16, 0.77, 0.23, 0.18, 4.7], [0.24, 0.23, 0.12, 0.12, 2.5]],
  'mage-feminine': [[0.16, 0.77, 0.23, 0.18, 5], [0.24, 0.18, 0.12, 0.12, 3.2]],
  sentry: [[0.63, 0.63, 0.26, 0.29, 4], [0.42, 0.15, 0.21, 0.16, 3]],
  warden: [[0.46, 0.68, 0.25, 0.24, 3.5], [0.72, 0.25, 0.26, 0.20, 1.6]],
  crawler: [[0.42, 0.22, 0.34, 0.24, 2.6], [0.78, 0.58, 0.23, 0.28, 2.8]],
  wisp: [[0.66, 0.69, 0.38, 0.30, 5.7], [0.76, 0.32, 0.25, 0.25, 5.1]],
  rootbound: [[0.25, 0.64, 0.26, 0.28, 4.9], [0.71, 0.39, 0.29, 0.31, 4]],
  moth: [[0.72, 0.35, 0.38, 0.32, 4.8], [0.47, 0.72, 0.46, 0.25, 4.7]],
  frostcat: [[0.48, 0.25, 0.38, 0.27, 2.9], [0.82, 0.49, 0.22, 0.26, 3.3]],
  glacier: [[0.48, 0.20, 0.44, 0.22, 1.7], [0.75, 0.47, 0.25, 0.28, 1.3]],
  'curse-watch': [[0.21, 0.39, 0.22, 0.18, 4], [0.77, 0.78, 0.19, 0.20, 3.5]],
  'curse-hollow': [[0.70, 0.21, 0.30, 0.17, 4.5], [0.87, 0.65, 0.19, 0.30, 4]],
  'curse-veil': [[0.18, 0.66, 0.22, 0.24, 4.5], [0.76, 0.60, 0.20, 0.28, 4]],
  'curse-rupture': [[0.69, 0.17, 0.28, 0.16, 3.5], [0.86, 0.48, 0.20, 0.20, 3.2]],
}

export const idleFrames = 12
const columns = 4
const idleHeight = 192

export function prepareIdleTexture(scene: Phaser.Scene, art: string): string | undefined {
  const regions = flexible[art]
  if (!regions) return undefined
  const key = `idle-${art}`
  if (scene.textures.exists(key)) return key
  const source = scene.textures.get(art).getSourceImage()
  if (!(source instanceof HTMLImageElement || source instanceof HTMLCanvasElement)) return undefined
  const atlas = fabricFrames(source, regions, { height: idleHeight, frames: idleFrames, columns, rowPhase: 3.7 })
  if (!atlas) return undefined
  const { sheet, width, height } = atlas
  const texture = scene.textures.addCanvas(key, sheet)
  if (!texture) return undefined
  for (let index = 0; index < idleFrames; index++) {
    texture.add(index, 0, index % columns * width, Math.floor(index / columns) * height, width, height)
  }
  return key
}
