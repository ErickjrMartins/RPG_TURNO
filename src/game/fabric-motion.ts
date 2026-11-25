export type Flex = readonly [x: number, y: number, radiusX: number, radiusY: number, pixels: number]

interface FrameOptions {
  height: number
  frames: number
  columns: number
  rowPhase: number
}

export function fabricFrames(source: HTMLImageElement | HTMLCanvasElement, regions: readonly Flex[], options: FrameOptions) {
  const { height, frames, columns, rowPhase } = options
  const originalWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const originalHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  if (!originalWidth || !originalHeight) return undefined
  const width = Math.round(height * originalWidth / originalHeight)
  const sampling = document.createElement('canvas')
  sampling.width = width
  sampling.height = height
  const brush = sampling.getContext('2d', { willReadFrequently: true })
  if (!brush) return undefined
  brush.drawImage(source, 0, 0, width, height)
  const original = brush.getImageData(0, 0, width, height).data

  const sheet = document.createElement('canvas')
  sheet.width = width * columns
  sheet.height = height * Math.ceil(frames / columns)
  const context = sheet.getContext('2d')
  if (!context) return undefined

  // Areas outside the masks keep their original pixels, including the face, joints and weapons.
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
        const phase = v * rowPhase + region * 1.8
        sine += amount * weight ** 2 * Math.cos(phase)
        cosine += amount * weight ** 2 * Math.sin(phase)
      }
      if (Math.hypot(sine, cosine) > 0.035) motion.push({ x, offset: (y * width + x) * 4, sine, cosine })
    }
  }

  const frame = context.createImageData(width, height)
  for (let index = 0; index < frames; index++) {
    frame.data.set(original)
    const radians = index * Math.PI * 2 / frames
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
    context.putImageData(frame, index % columns * width, Math.floor(index / columns) * height)
  }
  return { sheet, width, height }
}
