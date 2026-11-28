import type { Unit } from '../domain/battle'

export const arenaWidth = 1120
export const arenaHeight = 420
// The station, tunnel, galleries and rooftops share the lower paved band.
export const arenaFloor = 270
export const arenaCamera = { actorScale: 0.79, activationZoom: 1.045 }

export function pointFor(unit: Unit): { x: number; y: number } {
  const lane = unit.slot % 3
  const back = unit.slot >= 3
  const allyX = (back ? 153 : 375) + (lane - 1) * (back ? 36 : 44)
  return {
    x: unit.team === 'allies' ? allyX : arenaWidth - allyX,
    y: arenaFloor + lane * 40 + (back ? 0 : 10),
  }
}
