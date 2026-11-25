import type { ClassId, Presentation } from '../content/classes'
import { fabricFrames, type Flex } from '../game/fabric-motion'

const looseEnds: Record<`${ClassId}-${Presentation}`, readonly Flex[]> = {
  'warrior-masculine': [[0.52, 0.75, 0.067, 0.103, 1.9], [0.575, 0.615, 0.062, 0.1, 1.25], [0.494, 0.041, 0.038, 0.045, 0.75]],
  'warrior-feminine': [[0.486, 0.796, 0.083, 0.105, 2.45], [0.63, 0.598, 0.069, 0.117, 1.4], [0.413, 0.152, 0.052, 0.126, 2.4]],
  'archer-masculine': [[0.188, 0.711, 0.12, 0.165, 2.7], [0.48, 0.602, 0.057, 0.105, 1.4], [0.442, 0.042, 0.058, 0.053, 0.82]],
  'archer-feminine': [[0.182, 0.706, 0.119, 0.169, 3], [0.238, 0.825, 0.078, 0.11, 1.55], [0.319, 0.237, 0.048, 0.113, 2.8]],
  'mage-masculine': [[0.244, 0.716, 0.089, 0.174, 2.75], [0.386, 0.837, 0.097, 0.089, 1.8], [0.44, 0.053, 0.062, 0.072, 0.95]],
  'mage-feminine': [[0.238, 0.854, 0.109, 0.117, 2.8], [0.351, 0.803, 0.094, 0.11, 1.5], [0.314, 0.226, 0.059, 0.106, 2.9]],
}

const columns = 6
const frameCount = 24
const period = 3070

export function mountPortraitMotion(host: HTMLElement, classId: ClassId, form: Presentation, preference: MediaQueryList): () => void {
  const image = host.querySelector('img')
  const canvas = host.querySelector('canvas')
  const context = canvas?.getContext('2d')
  if (!image || !canvas || !context) return () => {}

  let generation = 0
  let frameRequest = 0
  let atlas: ReturnType<typeof fabricFrames>

  const stop = () => {
    generation++
    cancelAnimationFrame(frameRequest)
    canvas.hidden = true
    host.classList.remove('is-animated')
  }
  const start = async () => {
    const request = ++generation
    try {
      await image.decode()
      if (request !== generation || preference.matches) return
      // Swing each loose end as a single piece, with no wave traveling down the image.
      atlas ??= fabricFrames(image, looseEnds[`${classId}-${form}`], { height: 384, frames: frameCount, columns, rowPhase: 0 })
      if (!atlas) return
      const { sheet, width, height } = atlas
      canvas.width = width
      canvas.height = height
      let previous = -1
      const first = performance.now()
      const draw = (now: number) => {
        const elapsed = Math.max(0, now - first)
        const frame = Math.floor((elapsed % period) / period * frameCount)
        if (frame !== previous) {
          context.clearRect(0, 0, width, height)
          context.drawImage(sheet, frame % columns * width, Math.floor(frame / columns) * height, width, height, 0, 0, width, height)
          previous = frame
        }
        frameRequest = requestAnimationFrame(draw)
      }
      draw(first)
      canvas.hidden = false
      host.classList.add('is-animated')
    } catch {
      // Keep the original portrait visible if the browser cannot decode or draw the animation.
    }
  }
  const sync = () => {
    if (preference.matches) stop()
    else void start()
  }
  preference.addEventListener('change', sync)
  sync()
  return () => {
    stop()
    preference.removeEventListener('change', sync)
    if (atlas) {
      atlas.sheet.width = 0
      atlas.sheet.height = 0
      atlas = undefined
    }
  }
}
