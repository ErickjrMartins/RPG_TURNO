import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { playAttack, poseScale, type AttackPlayback } from './attack-playback'
import { pointFor } from './layout'

export const shotTexture = (form: Presentation) => `archer-shot-${form}`

const releaseAt = 355
const impactAt = 525
const endAt = 660
const poseTimes: Record<Presentation, readonly number[]> = {
  masculine: [0, 31, 60, 90, 123, 158, 195, 233, 267, 300, 331, releaseAt, 407, 457, 548, 613],
  feminine: [0, 55, 152, 260, releaseAt, 555],
}

export function animateArcherShot(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, target: Unit,
  speed: number, onImpact: () => void, onFinish: () => void,
): AttackPlayback {
  const { scaleX, scaleY } = sprite
  const destination = pointFor(target)
  const fromX = sprite.x + 73 * scaleX / poseScale
  const fromY = sprite.y - (form === 'masculine' ? 260 : 237) * scaleY / poseScale
  const toX = destination.x
  const toY = destination.y - 77
  const paint = (ink: Phaser.GameObjects.Graphics, time: number) => {
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
  }
  const poses = poseTimes[form].map((time, frame) => [time, frame] as const)
  return playAttack(scene, sprite, shotTexture(form), { duration: endAt, impactAt, poses }, speed, paint, onImpact, onFinish)
}
