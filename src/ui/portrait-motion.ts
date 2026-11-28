import type { ClassId, Presentation } from '../content/classes'
import { fabricFrames, type Flex } from '../game/fabric-motion'

const looseEnds: Record<`${ClassId}-${Presentation}`, readonly Flex[]> = {
  'warrior-masculine': [[0.39, 0.66, 0.09, 0.12, 2.5], [0.35, 0.035, 0.10, 0.039, 1.3]],
  'warrior-feminine': [[0.37, 0.63, 0.10, 0.14, 2.8], [0.18, 0.12, 0.12, 0.096, 2.6]],
  'archer-masculine': [[0.16, 0.64, 0.15, 0.16, 3], [0.16, 0.28, 0.13, 0.09, 2.2]],
  'archer-feminine': [[0.17, 0.66, 0.16, 0.16, 3], [0.17, 0.28, 0.13, 0.09, 2.4]],
  'mage-masculine': [[0.15, 0.78, 0.15, 0.15, 3.1], [0.24, 0.23, 0.11, 0.089, 2.3]],
  'mage-feminine': [[0.15, 0.78, 0.15, 0.15, 3.3], [0.24, 0.18, 0.12, 0.078, 2.8]],
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
