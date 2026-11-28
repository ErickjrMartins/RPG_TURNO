import type Phaser from 'phaser'

export type AttackPose = readonly [time: number, texture?: string, frame?: number, anchorX?: number]

interface AttackTimeline {
  duration: number
  impactAt: number
  poses: readonly AttackPose[]
}

export interface AttackPlayback {
  adjust(speed: number, paused: boolean): void
  cancel(): void
}

export function playAttack(
  scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, timeline: AttackTimeline,
  speed: number, paint: (ink: Phaser.GameObjects.Graphics, time: number) => void, impact: () => void, finish: () => void,
): AttackPlayback {
  const idle = sprite.texture.key
  const { scaleX, scaleY } = sprite
  const { originX, originY } = sprite
  const height = sprite.displayHeight
  const ink = scene.add.graphics().setDepth(865)
  let pose = 0
  let arrived = false
  const changePose = () => {
    const [, key, frame, anchorX] = timeline.poses[pose]!
    sprite.setTexture(key ?? idle, frame)
    sprite.setScale(key ? height / sprite.height : scaleX, key ? height / sprite.height : scaleY).setOrigin(anchorX ?? originX, originY)
  }
  changePose()

  const dispose = () => {
    ink.destroy()
    sprite.setTexture(idle).setScale(scaleX, scaleY).setOrigin(originX, originY)
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
      if (pose !== previous) changePose()
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
