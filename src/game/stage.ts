import Phaser from 'phaser'
import { assetUrl } from '../assets'
import { appearance, type AppearanceId, type StyleSlot } from '../content/wardrobe'
import { classIds, heroArt, type Presentation } from '../content/classes'
import { monsterIds } from '../content/monsters'
import type { BattleEvent, Unit } from '../domain/battle'
import type { Hero } from '../domain/profile'
import { animateArcherShot, shotCellSize, shotTexture } from './archer-shot'
import { animateMageSpell } from './mage-effects'
import { arenaCamera, arenaHeight, arenaWidth, pointFor } from './layout'

const opponentTextures = ['crawler', 'wisp', 'warden', 'sentry', ...monsterIds] as const

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload(): void {
    for (const id of classIds) {
      for (const form of ['masculine', 'feminine'] as const) {
        this.load.image(`${id}-${form}`, heroArt(id, form))
      }
    }
    for (const key of opponentTextures) {
      this.load.image(key, assetUrl(`${key}.webp`))
    }
    for (const form of ['masculine', 'feminine'] as const) {
      const key = shotTexture(form)
      this.load.spritesheet(key, assetUrl(`${key}.webp`), { frameWidth: shotCellSize, frameHeight: shotCellSize })
    }
  }

  create(): void {
    this.scene.start('arena')
  }
}

interface Actor {
  sprite: Phaser.GameObjects.Image
  shadow: Phaser.GameObjects.Ellipse
  clothes?: Phaser.GameObjects.Graphics
}

export class ArenaScene extends Phaser.Scene {
  private readonly actors = new Map<string, Actor>()
  private run: number | undefined
  private previousUnits: readonly Unit[] = []
  private archerShot: ReturnType<typeof animateArcherShot> | undefined

  constructor() {
    super('arena')
  }

  create(): void {
    this.game.events.emit('aurora:ready', this)
  }

  clear(): void {
    this.stopArcherShot()
    this.tweens.killAll()
    this.children.removeAll(true)
    this.actors.clear()
    this.run = undefined
    this.previousUnits = []
  }

  playArcherShot(form: Presentation, target: Unit, speed: number, impact: () => void): boolean {
    const hero = this.actors.get('hero')
    if (!hero || !this.textures.exists(shotTexture(form))) return false
    this.stopArcherShot()
    this.archerShot = animateArcherShot(this, hero.sprite, form, target, speed, impact, () => { this.archerShot = undefined })
    return true
  }

  adjustArcherShot(speed: number, paused: boolean): void {
    this.archerShot?.adjust(speed, paused)
  }

  stopArcherShot(): void {
    this.archerShot?.cancel()
  }

  show(run: number, hero: Hero, looks: Partial<Record<StyleSlot, AppearanceId>>, units: readonly Unit[], events: readonly BattleEvent[], animate: boolean, speed: number): void {
    if (run !== this.run) {
      this.clear()
      this.run = run
    }
    for (const [id, entry] of this.actors) {
      if (units.some((unit) => unit.id === id)) continue
      entry.sprite.destroy()
      entry.shadow.destroy()
      entry.clothes?.destroy()
      this.actors.delete(id)
    }
    for (const unit of units) {
      const point = pointFor(unit)
      const front = unit.slot < 3
      let entry = this.actors.get(unit.id)
      if (!entry) {
        const texture = unit.art === 'hero' ? `${hero.classId}-${hero.presentation}` : unit.art === 'bowman' ? 'archer-masculine' : unit.art
        const size = unit.art === 'warden' ? 223 : unit.art === 'hero' ? 195 : unit.art === 'crawler' ? 135 : front ? 160 : 148
        const shadow = this.add.ellipse(point.x, point.y - 12, size * 0.49, 26, 0x151618, 0.54).setDepth(point.y - 1)
        const sprite = this.add.image(point.x, point.y, texture).setOrigin(0.5, 1).setDepth(point.y)
        const scale = size * arenaCamera.actorScale / sprite.height
        sprite.setScale(scale)
        if (unit.art === 'sentry') sprite.setTint(0xe4e8e1)
        const clothes = unit.id === 'hero' ? this.heroLook(point.x, point.y, looks) : undefined
        entry = { sprite, shadow, clothes }
        this.actors.set(unit.id, entry)
      }
      entry.sprite.setAlpha(unit.hp > 0 ? 1 : 0.24)
      entry.shadow.setAlpha(unit.hp > 0 ? 1 : 0.32)
      entry.clothes?.setAlpha(unit.hp > 0 ? 1 : 0.25)
    }
    const effectUnits = [...units, ...this.previousUnits.filter((previous) => !units.some((unit) => unit.id === previous.id))]
    this.previousUnits = units
    if (!animate) return
    for (const event of events) {
      const target = effectUnits.find((unit) => unit.id === event.target)
      if (event.visual && !(this.archerShot && event.actor === 'hero' && event.spell === 'shot')) this.skillEffect(hero, effectUnits, event, speed)
      if (event.kind === 'action' && event.visual === 'slash' && target && event.actor !== target.id) {
        const actor = units.find((unit) => unit.id === event.actor)
        const entry = actor && this.actors.get(actor.id)
        if (actor && entry) {
          const home = pointFor(actor)
          const direction = actor.team === 'allies' ? 1 : -1
          this.tweens.killTweensOf(entry.sprite)
          entry.sprite.setX(home.x)
          this.tweens.add({ targets: entry.sprite, x: home.x + 22 * direction, duration: 104 / speed, yoyo: true, ease: 'Sine.Out' })
        }
      }
      if (target && (event.kind === 'damage' || event.kind === 'heal')) {
        const point = pointFor(target)
        const healed = event.kind === 'heal'
        const color = healed ? '#c4f4b1' : '#ffe0a1'
        const label = this.add.text(point.x, point.y - 109, `${healed ? '+' : '−'}${event.amount ?? 0}`, {
          fontFamily: 'Georgia', fontStyle: 'bold', fontSize: '28px', color, stroke: '#241d20', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(900)
        this.tweens.add({ targets: label, y: label.y - 48, alpha: 0, duration: 600 / speed, ease: 'Cubic.Out', onComplete: () => label.destroy() })
      }
    }
  }
  private heroLook(x: number, y: number, looks: Partial<Record<StyleSlot, AppearanceId>>): Phaser.GameObjects.Graphics {
    const model = this.add.graphics().setDepth(y + 1)
    const tint = (id: AppearanceId) => Number.parseInt(appearance(id).color.slice(1), 16)
    if (looks.aura) {
      model.lineStyle(3, tint(looks.aura), 0.86)
      model.strokeEllipse(x, y - 5, 102, 28)
      model.strokeEllipse(x, y - 5, 83, 21)
    }
    if (looks.mantle) {
      model.fillStyle(tint(looks.mantle), 0.57)
      model.fillTriangle(x - 12, y - 112, x - 26, y - 19, x - 49, y - 31)
    }
    if (looks.mask) {
      model.fillStyle(tint(looks.mask), 0.9)
      model.fillCircle(x + 6, y - 135, 7)
    }
    if (looks.projection) {
      model.lineStyle(3, tint(looks.projection), 0.93)
      model.lineBetween(x + 29, y - 91, x + 53, y - 36)
      model.strokeCircle(x + 29, y - 91, 8)
    }
    return model
  }

  private skillEffect(hero: Hero, units: readonly Unit[], event: BattleEvent, speed: number): void {
    const targeted = units.filter((entry) => event.targets?.includes(entry.id))
    if (targeted.length === 0) return
    const visual = event.visual
    const origin = units.find((entry) => entry.id === event.actor)
    if (hero.classId === 'mage' && origin?.id === 'hero' && event.spell && animateMageSpell(this, event.spell, origin, targeted, speed)) return
    const color = visual === 'heal' || visual === 'healing-field' ? 0x93ebbc
      : visual === 'ward' ? 0xffdb9c : visual === 'blast' || visual === 'bolt' || visual === 'hex' ? 0xd7a5ff
      : hero.classId === 'archer' && origin?.id === 'hero' ? 0xc8f083 : 0xffcf91
    const model = this.add.graphics().setDepth(860)
    if (visual === 'abyss') {
      model.lineStyle(2, color, 0.8)
      model.strokeEllipse(arenaWidth / 2, 215, 930, 280)
      model.strokeEllipse(arenaWidth / 2, 215, 885, 248)
    }
    for (const unit of targeted) {
      const { x, y } = pointFor(unit)
      const hit = y - 55
      model.lineStyle(3, color, 0.9)
      if ((visual === 'arrow' || visual === 'bolt') && origin) {
        const source = pointFor(origin)
        model.lineBetween(source.x, source.y - 54, x, hit)
        model.strokeCircle(x, hit, 11)
      } else if (visual === 'heal' || visual === 'healing-field') {
        model.strokeEllipse(x, y - 9, 76, 21)
        model.lineBetween(x, hit - 19, x, hit + 19)
        model.lineBetween(x - 14, hit, x + 14, hit)
      } else if (visual === 'ward') {
        model.strokePoints(Array.from({ length: 6 }, (_, index) => {
          const theta = (index * Math.PI) / 3
          return new Phaser.Math.Vector2(x + 32 * Math.cos(theta), hit + 44 * Math.sin(theta))
        }), true)
      } else if (visual === 'blast' || visual === 'hex' || visual === 'abyss') {
        model.strokeEllipse(x, y - 12, 86, 26)
        model.strokeEllipse(x, y - 12, 63, 17)
        model.lineBetween(x, hit - 49, x, y - 11)
      } else {
        model.lineBetween(x - 28, hit + 13, x + 28, hit - 19)
        model.lineBetween(x - 19, hit + 25, x + 17, hit - 2)
      }
    }
    this.tweens.add({ targets: model, alpha: 0, duration: (visual === 'abyss' ? 360 : 260) / speed, onComplete: () => model.destroy() })
  }
}

export function startStage(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: arenaWidth,
    height: arenaHeight,
    transparent: true,
    scene: [BootScene, ArenaScene],
    scale: { mode: Phaser.Scale.NONE },
    fps: { target: 60 },
    banner: false,
    audio: { noAudio: true },
  })
}
