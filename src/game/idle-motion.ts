import type Phaser from 'phaser'

type Flex = readonly [x: number, y: number, radiusX: number, radiusY: number, pixels: number]

// Regions are normalized in the original images. Feet and the stiff parts of armor stay anchored.
const flexible: Record<string, readonly Flex[]> = {
  'warrior-masculine': [[0.53, 0.65, 0.17, 0.26, 4], [0.47, 0.10, 0.16, 0.14, 1.6]],
  'warrior-feminine': [[0.54, 0.67, 0.17, 0.24, 4], [0.34, 0.20, 0.19, 0.20, 3.2]],
  'archer-masculine': [[0.25, 0.66, 0.25, 0.27, 4.6], [0.47, 0.08, 0.15, 0.13, 1.7]],
  'archer-feminine': [[0.24, 0.68, 0.26, 0.28, 4.7], [0.34, 0.22, 0.18, 0.24, 3.5]],
  'mage-masculine': [[0.30, 0.67, 0.27, 0.29, 4.7], [0.47, 0.07, 0.17, 0.14, 1.8]],
  'mage-feminine': [[0.28, 0.70, 0.29, 0.26, 5], [0.34, 0.23, 0.20, 0.24, 4.1]],
  sentry: [[0.63, 0.63, 0.26, 0.29, 4], [0.42, 0.15, 0.21, 0.16, 3]],
  warden: [[0.46, 0.68, 0.25, 0.24, 3.5], [0.72, 0.25, 0.26, 0.20, 1.6]],
  crawler: [[0.42, 0.22, 0.34, 0.24, 2.6], [0.78, 0.58, 0.23, 0.28, 2.8]],
  wisp: [[0.66, 0.69, 0.38, 0.30, 5.7], [0.76, 0.32, 0.25, 0.25, 5.1]],
  rootbound: [[0.25, 0.64, 0.26, 0.28, 4.9], [0.71, 0.39, 0.29, 0.31, 4]],
  moth: [[0.72, 0.35, 0.38, 0.32, 4.8], [0.47, 0.72, 0.46, 0.25, 4.7]],
  frostcat: [[0.48, 0.25, 0.38, 0.27, 2.9], [0.82, 0.49, 0.22, 0.26, 3.3]],
  glacier: [[0.48, 0.20, 0.44, 0.22, 1.7], [0.75, 0.47, 0.25, 0.28, 1.3]],
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
  const height = idleHeight
  const width = Math.round(height * source.width / source.height)
  const sampling = document.createElement('canvas')
  sampling.width = width
  sampling.height = height
  const brush = sampling.getContext('2d', { willReadFrequently: true })
  if (!brush) return undefined
  brush.drawImage(source, 0, 0, width, height)
  const original = brush.getImageData(0, 0, width, height).data
  const sheet = scene.textures.createCanvas(key, width * columns, height * Math.ceil(idleFrames / columns))
  if (!sheet) return undefined

  // Store only pixels affected by loose fabric or hair. Each atlas is shared by actors of the same art.
  const motion: { x: number; offset: number; sine: number; cosine: number }[] = []
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1)
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      let sine = 0
      let cosine = 0
      for (let region = 0; region < regions.length; region++) {
        const [cx, cy, rx, ry, amount] = regions[region]!
        const weight = Math.max(0, 1 - ((u - cx) / rx) ** 2 - ((v - cy) / ry) ** 2)
        const phase = v * 3.7 + region * 1.8
        sine += amount * weight ** 2 * Math.cos(phase)
        cosine += amount * weight ** 2 * Math.sin(phase)
      }
      if (Math.hypot(sine, cosine) > 0.035) motion.push({ x, offset: (y * width + x) * 4, sine, cosine })
    }
  }
  const frame = sheet.context.createImageData(width, height)
  for (let index = 0; index < idleFrames; index++) {
    frame.data.set(original)
    const radians = index * Math.PI * 2 / idleFrames
    const sine = Math.sin(radians)
    const cosine = Math.cos(radians)
    for (const pixel of motion) {
      const sourceX = Math.min(width - 1, Math.max(0, pixel.x - pixel.sine * sine - pixel.cosine * cosine))
      const left = Math.floor(sourceX)
      const first = pixel.offset + (left - pixel.x) * 4
      const second = left < width - 1 ? first + 4 : first
      const fraction = sourceX - left
      const a = original[first + 3]! * (1 - fraction)
      const b = original[second + 3]! * fraction
      const alpha = a + b
      frame.data[pixel.offset + 3] = alpha
      if (!alpha) continue
      for (let channel = 0; channel < 3; channel++) {
        frame.data[pixel.offset + channel] = (original[first + channel]! * a + original[second + channel]! * b) / alpha
      }
    }
    const x = index % columns * width
    const y = Math.floor(index / columns) * height
    sheet.context.putImageData(frame, x, y)
    sheet.add(index, 0, x, y, width, height)
  }
  sheet.refresh()
  return key
}
