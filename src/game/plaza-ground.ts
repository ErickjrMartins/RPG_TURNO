export interface Position { x: number; y: number }

export function plazaGround(x: number, y: number): Position {
  // These edges follow the courtyard in the original 3:2 artwork.
  const far = 0.48
  const near = 0.77
  const floorY = Math.max(far, Math.min(near, y))
  const edge = 0.20 - 0.08 * (floorY - far) / (near - far)
  return { x: Math.max(edge, Math.min(1 - edge, x)), y: floorY }
}
