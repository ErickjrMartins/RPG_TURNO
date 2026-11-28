import type Phaser from 'phaser'
import type { Presentation } from '../content/classes'
import type { Unit } from '../domain/battle'
import { playAttack, type AttackPose } from './attack-playback'
import { pointFor } from './layout'

export const sparkTexture = (form: Presentation) => `mage-spark-${form}`
export const sparkAnchor = 0.52
const aimAt = 205
const releaseAt = 400
const impactAt = 680
export const sparkDuration = 925
const orbRadius = 31 // The previous glow stopped at radius 21.
const cobalt = 0x2256ff
const electric = 0x199fff
const cyan = 0x65ecff
const core = 0xecfeff
const turn = Math.PI * 2
type Point = ReturnType<typeof pointFor>

function lightning(ink: Phaser.GameObjects.Graphics, x: number, y: number, direction: number, reach: number, phase: number): void {
  const cos = Math.cos(direction)
  const sin = Math.sin(direction)
  ink.beginPath()
  const root = reach * 0.18
  ink.moveTo(x + root * cos, y + root * sin)
  for (let i = 1; i <= 6; i++) {
    const forward = root + (reach - root) * i / 6
    const side = Math.sin(i * 11.7 + phase) * reach * (i % 2 ? 0.13 : 0.075)
    ink.lineTo(x + forward * cos - side * sin, y + forward * sin + side * cos)
  }
  ink.strokePath()
}

function sphere(ink: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, time: number, alpha: number): void {
  ink.fillStyle(cobalt, alpha * 0.12).fillCircle(x, y, radius * 1.32)
  ink.fillStyle(electric, alpha * 0.14).fillCircle(x, y, radius * 1.13)
  ink.fillStyle(0x102dc2, alpha * 0.56).fillCircle(x, y, radius)
  ink.fillStyle(cobalt, alpha * 0.53).fillCircle(x - radius * 0.14, y + radius * 0.08, radius * 0.76)
  ink.fillStyle(electric, alpha * 0.39).fillCircle(x + radius * 0.06, y - radius * 0.12, radius * 0.48)
  ink.lineStyle(5, cobalt, alpha * 0.59).strokeCircle(x, y, radius)
  ink.lineStyle(1.9, cyan, alpha * 0.92).strokeCircle(x, y, radius)

  for (let i = 0; i < 7; i++) {
    const direction = i * turn / 7 + time * (i % 2 ? 0.0028 : -0.0024)
    const jitter = Math.floor(time / 31) * 2.19 + i * 4.1
    ink.lineStyle(i % 2 ? 1.05 : 1.65, i % 2 ? electric : cyan, alpha * (i % 2 ? 0.76 : 0.94))
    lightning(ink, x, y, direction, radius * (1.06 + (i % 3) * 0.10), jitter)
    ink.lineStyle(2.1, i % 3 ? electric : core, alpha * 0.9)
    ink.beginPath()
    ink.arc(x, y, radius + i % 2, direction, direction + 0.26 + 0.06 * Math.sin(jitter))
    ink.strokePath()
  }

  const pulse = 0.95 + Math.sin(time * 0.065) * 0.13
  ink.fillStyle(electric, alpha * 0.64).fillCircle(x, y, radius * 0.36 * pulse)
  ink.fillStyle(cyan, alpha * 0.94).fillCircle(x, y, radius * 0.25 * pulse)
  ink.fillStyle(core, alpha).fillCircle(x - 1.5, y - 1.5, radius * 0.16 * pulse)
}

function explode(ink: Phaser.GameObjects.Graphics, x: number, y: number, time: number): void {
  const fade = (time - impactAt) / (sparkDuration - impactAt)
  const energy = Math.max(0, 1 - fade)
  const shock = 26 + 59 * (1 - energy ** 2)
  ink.fillStyle(cobalt, energy * 0.33).fillCircle(x, y, shock)
  ink.fillStyle(cyan, energy ** 2 * 0.55).fillCircle(x, y, 19 + fade * 29)
  ink.fillStyle(core, Math.max(0, 1 - fade * 3.2) * 0.92).fillCircle(x, y, 15 + 14 * fade)
  ink.lineStyle(3.4, cyan, Math.sqrt(energy) * 0.91).strokeCircle(x, y, shock * 0.87)
  ink.lineStyle(1.4, electric, energy * 0.58).strokeCircle(x, y, shock * 1.18)
  for (let i = 0; i < 10; i++) {
    const direction = i * 2.399963 + 0.38
    const distance = 24 + fade * (38 + (i % 4) * 8)
    ink.lineStyle(i % 3 ? 1.4 : 2.2, i % 3 ? cyan : core, energy * 0.92)
    lightning(ink, x, y, direction, distance, i * 3.1 + time * 0.027)
  }
}

export function paintSpark(ink: Phaser.GameObjects.Graphics, staff: Point, hit: Point, time: number): void {
  if (time < aimAt) return
  if (time < releaseAt) {
    const charge = (time - aimAt) / (releaseAt - aimAt)
    sphere(ink, staff.x, staff.y, 8 + charge * 11, time, 0.55 + charge * 0.4)
    return
  }
  if (time >= impactAt) {
    explode(ink, hit.x, hit.y, time)
    return
  }

  const progress = (time - releaseAt) / (impactAt - releaseAt)
  const point = (t: number) => ({
    x: staff.x + (hit.x - staff.x) * t,
    y: staff.y + (hit.y - staff.y) * t - Math.sin(t * Math.PI) * 14,
  })
  const head = point(progress)
  for (let i = 5; i > 0; i--) {
    const tail = point(Math.max(0, progress - i * 0.038))
    ink.fillStyle(i % 2 ? cobalt : electric, (6 - i) * 0.074)
    ink.fillCircle(tail.x, tail.y, 8 + (6 - i) * 3)
  }
  sphere(ink, head.x, head.y, orbRadius, time, 1)
}

export function animateMageSpark(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, form: Presentation, target: Unit,
  speed: number, impact: () => void, finish: () => void,
) {
  const staff = {
    x: sprite.x + sprite.displayHeight * 0.4,
    y: sprite.y - sprite.displayHeight * 0.93,
  }
  const targetPoint = pointFor(target)
  const hit = { x: targetPoint.x, y: targetPoint.y - 72 }
  const poses: readonly AttackPose[] = [[0], [88, sparkTexture(form), undefined, sparkAnchor], [817]]
  return playAttack(scene, sprite, { duration: sparkDuration, impactAt, poses }, speed,
    (ink, time) => paintSpark(ink, staff, hit, time), impact, finish)
}
