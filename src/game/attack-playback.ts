import type Phaser from 'phaser'

export const attackCellSize = 384
export const poseScale = 320 / 512

interface AttackTimeline {
  duration: number
  impactAt: number
  poses: readonly (readonly [time: number, frame: number])[]
  scale?: number
}

export interface AttackPlayback {
  adjust(speed: number, paused: boolean): void
  cancel(): void
}

export function playAttack(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, texture: string, timeline: AttackTimeline,
  speed: number, paint: (ink: Phaser.GameObjects.Graphics, time: number) => void, impact: () => void, finish: () => void,
): AttackPlayback {
  const idle = sprite.texture.key
  const { scaleX, scaleY } = sprite
  const ink = scene.add.graphics().setDepth(865)
  let pose = 0
  let arrived = false
  const spriteScale = timeline.scale ?? poseScale
  sprite.setTexture(texture, timeline.poses[0]![1]).setScale(scaleX / spriteScale, scaleY / spriteScale)

  const dispose = () => {
    ink.destroy()
    sprite.setTexture(idle).setScale(scaleX, scaleY)
    finish()
  }
  const arrive = () => {
    if (arrived) return
    arrived = true
    impact()
  }
  const tween = scene.tweens.addCounter({
    from: 0, to: timeline.duration, duration: timeline.duration,
    onUpdate: (tween) => {
      const time = tween.getValue() ?? timeline.duration
      const previous = pose
      while (timeline.poses[pose + 1] && time >= timeline.poses[pose + 1]![0]) pose++
      if (pose !== previous) sprite.setFrame(timeline.poses[pose]![1])
      ink.clear()
      paint(ink, time)
      if (time >= timeline.impactAt) arrive()
    },
    onComplete: () => {
      arrive()
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
