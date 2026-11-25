import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { pointFor } from './layout'

export const shotCellSize = 384
export const shotTexture = (form: Presentation) => `archer-shot-${form}`

// The sheets align a 320 px copy of the idle sprite at the center and bottom of each cell.
const poseScale = 320 / 512
const releaseAt = 355
const impactAt = 525
const endAt = 660
const poseTimes: Record<Presentation, readonly number[]> = {
  masculine: [0, 31, 60, 90, 123, 158, 195, 233, 267, 300, 331, releaseAt, 407, 457, 548, 613],
  feminine: [0, 55, 152, 260, releaseAt, 555],
}

interface ShotPlayback {
  adjust(speed: number, paused: boolean): void
  cancel(): void
}

export function animateArcherShot(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, target: Unit,
  speed: number, onImpact: () => void, onFinish: () => void,
): ShotPlayback {
  const idle = sprite.texture.key
  const { scaleX, scaleY } = sprite
  const poses = poseTimes[form]
  const destination = pointFor(target)
  const fromX = sprite.x + 73 * scaleX / poseScale
  const fromY = sprite.y - (form === 'masculine' ? 260 : 237) * scaleY / poseScale
  const toX = destination.x
  const toY = destination.y - 77
  const ink = scene.add.graphics().setDepth(865)
  let frame = 0
  let arrived = false

  sprite.setTexture(shotTexture(form), 0).setScale(scaleX / poseScale, scaleY / poseScale)
  const dispose = () => {
    ink.destroy()
    sprite.setTexture(idle).setScale(scaleX, scaleY)
    onFinish()
  }
  const paint = (time: number) => {
    while (frame + 1 < poses.length && time >= poses[frame + 1]!) {
      frame++
      sprite.setFrame(frame)
    }
    ink.clear()
    if (time < releaseAt) return
    if (time < impactAt) {
      const progress = (time - releaseAt) / (impactAt - releaseAt)
      const tail = Math.max(0, progress - 0.19)
      const x = fromX + (toX - fromX) * progress
      const y = fromY + (toY - fromY) * progress
      const trailX = fromX + (toX - fromX) * tail
      const trailY = fromY + (toY - fromY) * tail
      ink.lineStyle(9, 0xeb922f, 0.26)
      ink.lineBetween(trailX, trailY, x, y)
      ink.lineStyle(2.5, 0xffd178, 0.98)
      ink.lineBetween(trailX, trailY, x, y)
      ink.fillStyle(0xfff9cd, 0.98)
      ink.fillCircle(x, y, 4)
      return
    }
    const fade = (time - impactAt) / (endAt - impactAt)
    ink.lineStyle(2, 0xffd789, 1 - fade)
    ink.strokeCircle(toX, toY, 4 + fade * 19)
    for (let index = 0; index < 7; index++) {
      const angle = index * Math.PI * 2 / 7
      ink.fillStyle(0xffc565, 1 - fade)
      ink.fillCircle(toX + Math.cos(angle) * 26 * fade, toY + Math.sin(angle) * 26 * fade, 2)
    }
    if (!arrived) {
      arrived = true
      onImpact()
    }
  }

  const tween = scene.tweens.addCounter({
    from: 0, to: endAt, duration: endAt,
    onUpdate: (tween) => paint(tween.getValue() ?? endAt),
    onComplete: () => {
      if (!arrived) onImpact()
      dispose()
    },
  })
  tween.setTimeScale(speed)
  return {
    adjust(nextSpeed, paused) {
      tween.setTimeScale(nextSpeed)
      if (paused) tween.pause()
      else tween.resume()
    },
    cancel() {
      tween.stop()
      dispose()
    },
  }
}
