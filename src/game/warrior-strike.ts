import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { attackCellSize, playAttack, poseScale } from './attack-playback'
import { pointFor } from './layout'
import { paintWarriorSword } from './warrior-sword'

export type WarriorAttack = 'strike' | 'charge'
export type WarriorCue = 'warrior-step' | 'warrior-cry'

export const warriorCellHeight = 256
export const warriorCellWidth: Record<WarriorAttack, number> = { strike: 256, charge: 384 }
export const warriorTexture = (move: WarriorAttack, form: Presentation) => `warrior-${move}-${form}`
const strike = {
  approachAt: 42, arriveAt: 565, impactAt: 690, retreatAt: 965, homeAt: 1285, duration: 1300,
  poses: [
    [0, 0], [42, 1], [80, 2], [117, 3], [164, 4], [210, 5], [257, 6],
    [304, 7], [350, 8], [397, 9], [442, 10], [490, 11], [535, 12], [575, 13],
    [662, 14], [890, 15], [935, 16], [965, 3], [1003, 4], [1040, 5], [1077, 6],
    [1113, 7], [1150, 8], [1187, 9], [1223, 10], [1260, 2], [1285, 0],
  ],
} as const
const charge = {
  approachAt: 40, arriveAt: 853, impactAt: 903, retreatAt: 1250, homeAt: 1555, duration: 1575,
  originY: 340 / 384,
  poses: [
    [0, 0], [40, 1], [93, 2], [144, 3], [195, 4], [243, 5], [295, 6],
    [347, 7], [397, 8], [446, 9], [493, 10], [540, 11], [581, 12],
    [624, 13], [675, 14], [773, 15], [806, 16], [837, 17], [868, 18], [903, 19],
    [935, 20], [969, 21], [1013, 22], [1061, 23], [1111, 24], [1153, 25],
    [1186, 26], [1224, 27], [1250, 4], [1284, 5], [1318, 6], [1352, 7], [1386, 8],
    [1420, 9], [1454, 10], [1488, 6], [1523, 2], [1555, 0],
  ],
} as const
const chargeCues: readonly (readonly [at: number, cue: WarriorCue])[] = [
  [102, 'warrior-step'], [205, 'warrior-step'], [309, 'warrior-step'], [412, 'warrior-step'],
  [513, 'warrior-step'], [810, 'warrior-cry'], [1300, 'warrior-step'], [1402, 'warrior-step'], [1504, 'warrior-step'],
]

interface StrikeActor {
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  clothes?: Phaser.GameObjects.Graphics
}

function ease(progress: number): number {
  return progress - Math.sin(progress * 2 * Math.PI) * 0.078
}

function paintChargeBlast(ink: Phaser.GameObjects.Graphics, enemy: ReturnType<typeof pointFor>, fade: number): void {
  const x = enemy.x - 16
  const y = enemy.y - 5
  const shock = 27 + 88 * (1 - (1 - fade) ** 2)
  const flash = Math.max(0, 1 - fade * 3)
  ink.fillStyle(0xe37421, (1 - fade) * 0.33).fillEllipse(x, y, shock * 2, shock * 0.37)
  ink.lineStyle(3, 0xffb042, (1 - fade) * 0.92).strokeEllipse(x, y, shock * 2.05, shock * 0.52)
  ink.fillStyle(0xff9e2b, flash * 0.72).fillEllipse(x, y - 23, 98 + fade * 34, 57 + fade * 18)
  ink.fillStyle(0xffefb5, flash * 0.98).fillEllipse(x, y - 19, 62 + fade * 19, 31)
  for (let i = 0; i < 14; i++) {
    const spread = (i - 6.5) * (5.5 + fade * (11 + i % 3))
    const height = Math.sin(fade * Math.PI * 0.91) * (29 + i % 4 * 15)
    const size = (1 - fade) * (2 + i % 3 * 2)
    const chipX = x + spread
    const chipY = y - height - 9 - i % 3 * 4
    ink.fillStyle(i % 3 ? 0xff9c3f : 0xffe7a8, (1 - fade) * 0.93)
    ink.fillTriangle(chipX - size, chipY, chipX + size, chipY - 2, chipX + Math.sign(spread) * size * 1.9, chipY - size * 3.7)
  }
}

export function animateWarriorAttack(scene: Phaser.Scene, { sprite, shadow, clothes }: StrikeActor,
  move: WarriorAttack, form: Presentation, target: Unit, speed: number, impact: () => void, finish: () => void,
  playCue?: (cue: WarriorCue) => void,
) {
  const charging = move === 'charge'
  const motion = charging ? charge : strike
  const { approachAt, arriveAt, impactAt, retreatAt, homeAt } = motion
  const home = { x: sprite.x, y: sprite.y, flip: sprite.flipX, depth: sprite.depth }
  const shade = { x: shadow.x, y: shadow.y, depth: shadow.depth }
  const outfit = clothes && { x: clothes.x, y: clothes.y, depth: clothes.depth, scaleX: clothes.scaleX }
  const enemy = pointFor(target)
  const reach = (target.art === 'warden' ? 96 : 83) - (charging ? 18 : 0)
  const landing = { x: Math.max(home.x, enemy.x - reach), y: enemy.y + 1 }
  let cueIndex = 0

  function place(progress: number, facingHome: boolean, lift = 0): void {
    const distance = ease(progress)
    const dx = (landing.x - home.x) * distance
    const dy = (landing.y - home.y) * distance
    sprite.setPosition(home.x + dx, home.y + dy - lift).setDepth(home.depth + dy).setFlipX(facingHome !== home.flip)
    shadow.setPosition(shade.x + dx, shade.y + dy).setDepth(shade.depth + dy)
    if (clothes && outfit) {
      const mirror = facingHome ? 2 * (home.x - outfit.x) : 0
      clothes.setPosition(outfit.x + dx + mirror, outfit.y + dy - lift).setDepth(outfit.depth + dy)
      clothes.scaleX = facingHome ? -outfit.scaleX : outfit.scaleX
    }
  }

  function paint(ink: Phaser.GameObjects.Graphics, time: number): void {
    if (charging && playCue) {
      for (let cue = chargeCues[cueIndex]; cue && cue[0] <= time; cue = chargeCues[++cueIndex]) {
        if (time - cue[0] < 90) playCue(cue[1])
      }
    }
    if (time < retreatAt) {
      const leap = charging ? Math.max(0, Math.min(1, (time - 598) / 267)) : 0
      place(Math.max(0, Math.min(1, (time - approachAt) / (arriveAt - approachAt))), false, 33 * Math.sin(leap * Math.PI))
    } else place(Math.max(0, (homeAt - time) / (homeAt - retreatAt)), time < homeAt)

    if (!charging && time < retreatAt) paintWarriorSword(ink, sprite, time, impactAt)
    if (time < impactAt || time >= retreatAt) return
    const fade = (time - impactAt) / (retreatAt - impactAt)
    if (charging) {
      paintChargeBlast(ink, enemy, fade)
      return
    }
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

  const scale = poseScale * warriorCellHeight / attackCellSize
  return playAttack(scene, sprite, warriorTexture(move, form), { ...motion, scale }, speed, paint, impact, () => {
    place(0, false)
    finish()
  })
}
