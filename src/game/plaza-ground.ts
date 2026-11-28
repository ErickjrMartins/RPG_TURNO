export interface Position { x: number; y: number }

function walkableGround(x: number, y: number, farEdge: number, nearEdge: number): Position {
  const far = 0.48
  const near = 0.77
  const floorY = Math.max(far, Math.min(near, y))
  const edge = farEdge + (nearEdge - farEdge) * (floorY - far) / (near - far)
  return { x: Math.max(edge, Math.min(1 - edge, x)), y: floorY }
}

// The bounds follow the paved area in each 3:2 background.
export function plazaGround(x: number, y: number): Position {
  return walkableGround(x, y, 0.20, 0.12)
}

export function skyGround(x: number, y: number): Position {
  return walkableGround(x, y, 0.28, 0.13)
}
