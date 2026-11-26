import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { attackCellSize, playAttack, poseScale } from './attack-playback'
import { pointFor } from './layout'
import { paintWarriorSword } from './warrior-sword'

export const strikeTexture = (form: Presentation) => `warrior-strike-${form}`
export const strikeCellSize = 256
const approachAt = 42
const arriveAt = 565
const impactAt = 690
const retreatAt = 965
const homeAt = 1285
const duration = 1300
const poses = [
  [0, 0], [42, 1], [80, 2], [117, 3], [164, 4], [210, 5], [257, 6],
  [304, 7], [350, 8], [397, 9], [442, 10], [490, 11], [535, 12], [575, 13],
  [616, 14], [652, 15], [impactAt, 16], [722, 17], [753, 18],
  [784, 19], [815, 20], [845, 21], [875, 22], [910, 23], [935, 24],
  [retreatAt, 3], [1003, 4], [1040, 5], [1077, 6], [1113, 7], [1150, 8],
  [1187, 9], [1223, 10], [1260, 2], [homeAt, 0],
] as const

interface StrikeActor {
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  clothes?: Phaser.GameObjects.Graphics
}

function ease(progress: number): number {
  return progress - Math.sin(progress * 2 * Math.PI) * 0.078
}

export function animateWarriorStrike(scene: Phaser.Scene, { sprite, shadow, clothes }: StrikeActor, form: Presentation, target: Unit,
  speed: number, impact: () => void, finish: () => void,
) {
  const home = { x: sprite.x, y: sprite.y, flip: sprite.flipX, depth: sprite.depth }
  const shade = { x: shadow.x, y: shadow.y, depth: shadow.depth }
  const outfit = clothes && { x: clothes.x, y: clothes.y, depth: clothes.depth, scaleX: clothes.scaleX }
  const enemy = pointFor(target)
  const reach = target.art === 'warden' ? 96 : 83
  const landing = { x: Math.max(home.x, enemy.x - reach), y: enemy.y + 1 }

  function place(progress: number, facingHome: boolean): void {
    const distance = ease(progress)
    const dx = (landing.x - home.x) * distance
    const dy = (landing.y - home.y) * distance
    sprite.setPosition(home.x + dx, home.y + dy).setDepth(home.depth + dy).setFlipX(facingHome !== home.flip)
    shadow.setPosition(shade.x + dx, shade.y + dy).setDepth(shade.depth + dy)
    if (clothes && outfit) {
      const mirror = facingHome ? 2 * (home.x - outfit.x) : 0
      clothes.setPosition(outfit.x + dx + mirror, outfit.y + dy).setDepth(outfit.depth + dy)
      clothes.scaleX = facingHome ? -outfit.scaleX : outfit.scaleX
    }
  }

  function paint(ink: Phaser.GameObjects.Graphics, time: number): void {
    if (time < retreatAt) place(Math.max(0, Math.min(1, (time - approachAt) / (arriveAt - approachAt))), false)
    else place(Math.max(0, (homeAt - time) / (homeAt - retreatAt)), time < homeAt)

    if (time < retreatAt) paintWarriorSword(ink, sprite, time, impactAt)
    if (time < impactAt || time >= retreatAt) return
    const fade = (time - impactAt) / (retreatAt - impactAt)
    const x = enemy.x - 14
    const y = enemy.y - (target.art === 'warden' ? 96 : 72)
    const flash = Math.max(0, 1 - fade * 4)
    ink.fillStyle(0xffac43, flash * 0.33)
    ink.fillEllipse(x, y, 48 + fade * 26, 25)
    ink.fillStyle(0xffefd0, flash * 0.90)
    ink.fillTriangle(x - 18, y + 5, x + 21, y - 9, x + 5, y + 7)
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.39996 + 0.42
      const distance = (11 + fade * (19 + i % 4 * 13))
      const sparkX = x + distance * Math.cos(angle) + 15 * fade
      const sparkY = y + distance * Math.sin(angle) - (9 + i % 3 * 8) * fade
      ink.lineStyle(i % 3 ? 2 : 3, i % 3 ? 0xff9b31 : 0xffe5a3, (1 - fade) ** 1.4)
      ink.lineBetween(sparkX - 5 * Math.cos(angle), sparkY - 5 * Math.sin(angle), sparkX, sparkY)
    }
  }

  const scale = poseScale * strikeCellSize / attackCellSize
  return playAttack(scene, sprite, strikeTexture(form), { duration, impactAt, poses, scale }, speed, paint, impact, () => {
    place(0, false)
    finish()
  })
}
