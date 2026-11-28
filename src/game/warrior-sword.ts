import type Phaser from 'phaser'

const glow = [
  { width: 24, color: 0xff7a19, alpha: 0.38 },
  { width: 15, color: 0xff922e, alpha: 0.94 },
  { width: 8, color: 0xffd16a, alpha: 1 },
  { width: 3.5, color: 0xfff4af, alpha: 0.95 },
]

export function paintWarriorSword(ink: Phaser.GameObjects.Graphics, sprite: Phaser.GameObjects.Image, time: number, impactAt: number): void {
  const after = time - impactAt
  const sweep = Math.min(1, Math.max(0, (after + 84) / 84))
  const flame = Math.min(1, sweep * 2.6) * Math.max(0, 1 - Math.max(0, after - 24) / 195)
  if (flame === 0) return
  const scale = sprite.displayHeight / 220
  const position = (x: number, y: number) => ({
    x: sprite.x + (x - 128) * scale,
    y: sprite.y + (y - 256) * scale,
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
}
