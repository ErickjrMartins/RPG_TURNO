import type Phaser from 'phaser'

// Grip positions in the source poses where the video no longer contains the whole blade.
const grip: Readonly<Record<number, readonly [x: number, y: number, angle: number]>> = {
  16: [218, 119, -0.14], 17: [218, 115, -0.25], 18: [218, 115, -0.30],
  19: [218, 110, -0.34], 20: [217, 107, -0.37], 21: [216, 109, -0.38],
  22: [214, 107, -0.39], 23: [208, 103, -0.45], 24: [166, 128, -0.08],
}

function cubic(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t
  return a * u ** 3 + 3 * b * u ** 2 * t + 3 * c * u * t ** 2 + d * t ** 3
}

function tangent(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t
  return (b - a) * u ** 2 + 2 * (c - b) * u * t + (d - c) * t ** 2
}

export function paintWarriorSword(ink: Phaser.GameObjects.Graphics, sprite: Phaser.GameObjects.Image, time: number, impactAt: number): void {
  const pose = grip[Number(sprite.frame.name)]
  const position = (x: number, y: number) => ({
    x: sprite.x + (x - sprite.width / 2) * sprite.scaleX,
    y: sprite.y + (y - sprite.height) * sprite.scaleY,
  })
  const after = time - impactAt
  const flame = Math.min(1, Math.max(0, (after + 48) / 48)) * Math.max(0, 1 - Math.max(0, after - 76) / 159)

  if (flame > 0) {
    const advance = Math.min(1, Math.max(0, (after + 34) / 90))
    const bend = 9 * advance
    const ribbons = [
      { width: 34, color: 0xff7816, alpha: 0.26, offset: 0 },
      { width: 22, color: 0xff932d, alpha: 0.91, offset: 0 },
      { width: 11, color: 0xffdc72, alpha: 1, offset: 2 },
      { width: 4, color: 0xfff3b6, alpha: 0.9, offset: 4 },
      { width: 3, color: 0xffbb54, alpha: 0.76, offset: -12 },
    ]
    for (const ribbon of ribbons) {
      const leading = []
      const trailing = []
      for (let i = 0; i <= 22; i++) {
        const t = i / 22
        const x = cubic(165, 241, 347 + bend, 297 + bend, t)
        const y = cubic(173, 211, 159, 101 - bend, t)
        const wave = Math.sin(t * 24 - time * 0.064) * 3.4 * Math.sin(t * Math.PI)
        const width = ribbon.width * Math.sin(t * Math.PI) ** 0.78 * (0.82 + 0.18 * Math.sin(t * 15 + time * 0.05))
        const tx = tangent(165, 241, 347 + bend, 297 + bend, t)
        const ty = tangent(173, 211, 159, 101 - bend, t)
        const length = Math.hypot(tx, ty)
        const dx = -ty / length
        const dy = tx / length
        leading.push(position(x + dx * (ribbon.offset + width), y + wave + dy * (ribbon.offset + width)))
        trailing.push(position(x + dx * (ribbon.offset - width), y + wave + dy * (ribbon.offset - width)))
      }
      ink.fillStyle(ribbon.color, ribbon.alpha * flame).fillPoints([...leading, ...trailing.reverse()], true)
    }
  }

  if (!pose) return
  const [x, y, angle] = pose
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const point = (length: number, across: number) => position(x + length * cos - across * sin, y + length * sin + across * cos)
  ink.fillStyle(0x56656a, 0.97).fillPoints([point(8, -5), point(91, -3.4), point(108, 0), point(90, 3.2), point(8, 5)], true)
  ink.fillStyle(0xd8e2db, 0.99).fillPoints([point(8, -4), point(94, -2.3), point(108, 0), point(9, 0)], true)
  ink.fillStyle(0xffcf6d, flame * 0.88).fillPoints([point(14, 2.1), point(93, 1.5), point(107, 0), point(22, 3.2)], true)
  ink.fillStyle(0x9a714a, 0.96).fillPoints([point(7, -9), point(11, -9), point(12, 8), point(7, 9)], true)
}
