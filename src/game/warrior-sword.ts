import type Phaser from 'phaser'

const grip: Readonly<Record<number, readonly [x: number, y: number, angle: number]>> = {
  14: [214, 107, -0.39],
  15: [208, 103, -0.45],
  16: [166, 128, -0.08],
}

const glow = [
  { width: 24, color: 0xff7a19, alpha: 0.38 },
  { width: 15, color: 0xff922e, alpha: 0.94 },
  { width: 8, color: 0xffd16a, alpha: 1 },
  { width: 3.5, color: 0xfff4af, alpha: 0.95 },
]

export function paintWarriorSword(ink: Phaser.GameObjects.Graphics, sprite: Phaser.GameObjects.Image, time: number, impactAt: number): void {
  const pose = grip[Number(sprite.frame.name)]
  const after = time - impactAt
  const sweep = Math.min(1, Math.max(0, (after + 84) / 84))
  const flame = Math.min(1, sweep * 2.6) * Math.max(0, 1 - Math.max(0, after - 24) / 195)
  if (!pose && flame === 0) return
  const position = (x: number, y: number) => ({
    x: sprite.x + (x - sprite.width / 2) * sprite.scaleX,
    y: sprite.y + (y - sprite.height) * sprite.scaleY,
  })

  if (flame > 0) {
    const tail = 2.95 - Math.max(0, after - 56) * 0.0065
    const tip = 2.95 - sweep * 3.52
    const curve = Array.from({ length: 33 }, (_, i) => {
      const t = i / 32
      const angle = tail + (tip - tail) * t
      const bend = Math.sin(t * 21 - time * 0.061) * 2.6 * Math.sin(t * Math.PI)
      const nx = 64 * Math.cos(angle)
      const ny = 155 * Math.sin(angle)
      const length = Math.hypot(nx, ny)
      return {
        x: 160 + 155 * Math.cos(angle),
        y: 128 + 64 * Math.sin(angle) + bend,
        nx: nx / length,
        ny: ny / length,
        taper: Math.sin(t * Math.PI) ** 0.67 * (0.85 + 0.15 * Math.sin(t * 12 + time * 0.052)),
      }
    })
    for (const layer of glow) {
      const edge = (side: number) => curve.map(({ x, y, nx, ny, taper }) => {
        const offset = taper * layer.width * side
        return position(x + nx * offset, y + ny * offset)
      })
      ink.fillStyle(layer.color, layer.alpha * flame).fillPoints([...edge(1), ...edge(-1).reverse()], true)
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
