import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { playAttack, poseScale } from './attack-playback'
import { pointFor } from './layout'

export const sparkTexture = (form: Presentation) => `mage-spark-${form}`
const aimAt = 205
const releaseAt = 400
const impactAt = 590
const duration = 750
const poses = [[0, 0], [88, 1], [aimAt, 2], [616, 1], [695, 0]] as const
const blue = 0x3279ff
const ice = 0x88daff
const core = 0xe4fbff

export function animateMageSpark(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, target: Unit,
  speed: number, impact: () => void, finish: () => void,
) {
  const staffX = sprite.x + (form === 'masculine' ? 157 : 170) * sprite.scaleX / poseScale
  const staffY = sprite.y - (form === 'masculine' ? 278 : 283) * sprite.scaleY / poseScale
  const targetPoint = pointFor(target)
  const hitX = targetPoint.x
  const hitY = targetPoint.y - 72
  const paint = (ink: Phaser.GameObjects.Graphics, time: number) => {
    if (time < aimAt) return
    if (time < releaseAt) {
      const charge = (time - aimAt) / (releaseAt - aimAt)
      ink.fillStyle(blue, 0.15 + charge * 0.17)
      ink.fillCircle(staffX, staffY, 10 + charge * 12)
      ink.fillStyle(ice, 0.35 + charge * 0.45)
      ink.fillCircle(staffX, staffY, 5 + charge * 5)
      ink.fillStyle(core, 0.65 + charge * 0.35)
      ink.fillPoints([{ x: staffX - 5, y: staffY + 3 }, { x: staffX + 6, y: staffY - 5 },
        { x: staffX + 4, y: staffY + 5 }, { x: staffX - 4, y: staffY + 7 }], true)
      return
    }
    if (time < impactAt) {
      const progress = (time - releaseAt) / (impactAt - releaseAt)
      const tail = Math.max(0, progress - 0.16)
      const x = staffX + (hitX - staffX) * progress
      const y = staffY + (hitY - staffY) * progress - 10 * Math.sin(progress * Math.PI)
      ink.lineStyle(7, blue, 0.42)
      ink.lineBetween(staffX + (hitX - staffX) * tail, staffY + (hitY - staffY) * tail - 10 * Math.sin(tail * Math.PI), x, y)
      ink.fillStyle(blue, 0.36)
      ink.fillCircle(x, y, 21)
      ink.fillStyle(ice, 0.9)
      ink.fillCircle(x, y, 11)
      ink.fillStyle(core, 0.98)
      ink.fillCircle(x + 2, y - 2, 5)
      return
    }
    const fade = (time - impactAt) / (duration - impactAt)
    ink.fillStyle(blue, (1 - fade) * 0.35)
    ink.fillCircle(hitX, hitY, 15 + fade * 13)
    ink.lineStyle(2, ice, (1 - fade) * 0.82)
    ink.strokeCircle(hitX, hitY, 8 + fade * 18)
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4 + 0.27
      const distance = 7 + fade * (17 + index % 3 * 4)
      ink.fillStyle(index % 2 ? core : ice, 1 - fade)
      ink.fillCircle(hitX + distance * Math.cos(angle), hitY + distance * Math.sin(angle), (1 - fade) * 2 + 0.6)
    }
  }
  return playAttack(scene, sprite, sparkTexture(form), { duration, impactAt, poses }, speed, paint, impact, finish)
}
