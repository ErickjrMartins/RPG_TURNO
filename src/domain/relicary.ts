import type { TroopId } from '../content/adventure'
import { gearSlots, pins, relics, relicSpec, stock, type Bonuses, type GearSlot, type GlyphId, type Lineage, type MasteryPath, type PinId, type RelicId, type StockId } from '../content/relics'

export interface Relic {
  key: string
  id: RelicId
  refine: number
  grade: number
  pins: PinId[]
  locked: boolean
}

export interface Mastery {
  level: number
  5?: MasteryPath
  10?: MasteryPath
}

export interface Relicary {
  relics: Relic[]
  slots: Partial<Record<GearSlot, string>>
  troopGear: Partial<Record<TroopId, string>>
  stock: Partial<Record<StockId, number>>
  glyphs: GlyphId[]
  lineage: Lineage | null
  unlockedLineages: Lineage[]
  mastery: Record<string, Mastery>
  capacity: number
}

export function newRelicary(): Relicary {
  return { relics: [], slots: {}, troopGear: {}, stock: {}, glyphs: [], lineage: null, unlockedLineages: [], mastery: {}, capacity: 48 }
}

export function isRelicId(value: unknown): value is RelicId { return typeof value === 'string' && Object.hasOwn(relics, value) }
export function isGearSlot(value: unknown): value is GearSlot { return typeof value === 'string' && Object.hasOwn(gearSlots, value) }
export function isStock(value: unknown): value is StockId { return typeof value === 'string' && Object.hasOwn(stock, value) }
export function isPin(value: unknown): value is PinId { return typeof value === 'string' && Object.hasOwn(pins, value) }
export function isGlyph(value: unknown): value is GlyphId { return value === 'glyph-pest' || value === 'glyph-void' }
export function isLineage(value: unknown): value is Lineage { return value === 'pest' || value === 'void' }
export function isPath(value: unknown): value is MasteryPath { return value === 'safe' || value === 'oath' }

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function within(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max }
function isRelic(value: unknown): value is Relic {
  return isRecord(value) && typeof value.key === 'string' && /^[a-z0-9-]{1,60}$/.test(value.key)
    && isRelicId(value.id) && within(value.refine, 0, 10) && within(value.grade, 1, 3)
    && typeof value.locked === 'boolean' && Array.isArray(value.pins) && value.pins.every(isPin) && value.pins.length <= value.grade + 1
}

export function isRelicary(value: unknown): value is Relicary {
  if (!isRecord(value) || !Array.isArray(value.relics) || !value.relics.every(isRelic)
    || !isRecord(value.slots) || !isRecord(value.troopGear) || !isRecord(value.stock) || !isRecord(value.mastery)) return false
  const entries = new Map(value.relics.map((entry) => [entry.key, entry]))
  const keys = [...Object.values(value.slots), ...Object.values(value.troopGear)]
  return entries.size === value.relics.length && new Set(keys).size === keys.length
    && Object.entries(value.slots).every(([slot, key]) => isGearSlot(slot) && typeof key === 'string'
      && !!entries.get(key) && relicSpec(entries.get(key)!.id).slots.includes(slot))
    && Object.entries(value.troopGear).every(([id, key]) => ['sentry', 'bowman'].includes(id)
      && typeof key === 'string' && !!entries.get(key) && relicSpec(entries.get(key)!.id).troop === true)
    && Object.entries(value.stock).every(([id, count]) => isStock(id) && within(count, 0, Number.MAX_SAFE_INTEGER))
    && Array.isArray(value.glyphs) && value.glyphs.length <= 3 && value.glyphs.every(isGlyph)
    && Array.isArray(value.unlockedLineages) && value.unlockedLineages.every(isLineage)
    && (value.lineage === null || (isLineage(value.lineage) && value.unlockedLineages.includes(value.lineage)))
    && Object.entries(value.mastery).every(([id, entry]) => /^[a-z][a-z-]{0,24}$/.test(id) && isRecord(entry) && within(entry.level, 1, 10)
      && (entry[5] === undefined || (entry.level >= 5 && isPath(entry[5])))
      && (entry[10] === undefined || (entry.level >= 10 && isPath(entry[10]))))
    && within(value.capacity, 48, 120)
}

export function addRelic(relicary: Relicary, id: RelicId, key: string = id): Relicary {
  if (relicary.relics.some((entry) => entry.key === key)) return relicary
  return { ...relicary, relics: [...relicary.relics, { key, id, refine: 0, grade: 1, pins: [], locked: false }] }
}

export function addStock(relicary: Relicary, changes: Partial<Record<StockId, number>>): Relicary {
  const next = { ...relicary.stock }
  for (const id of Object.keys(changes) as StockId[]) {
    const count = (next[id] ?? 0) + (changes[id] ?? 0)
    if (!Number.isSafeInteger(count) || count < 0) throw new Error(`Quantidade insuficiente de ${stock[id].name}.`)
    if (count) next[id] = count
    else delete next[id]
  }
  return { ...relicary, stock: next }
}

export function findRelic(relicary: Relicary, key: string): Relic {
  const item = relicary.relics.find((entry) => entry.key === key)
  if (!item) throw new Error('Relíquia indisponível.')
  return item
}

export function equipped(relicary: Relicary, key: string): boolean {
  return Object.values(relicary.slots).includes(key) || Object.values(relicary.troopGear).includes(key)
}

function editRelic(relicary: Relicary, key: string, change: (item: Relic) => Relic): Relicary {
  return { ...relicary, relics: relicary.relics.map((entry) => entry.key === key ? change(entry) : entry) }
}

export function equipRelic(relicary: Relicary, key: string, slot: GearSlot | TroopId): Relicary {
  const item = findRelic(relicary, key)
  if (relicary.relics.indexOf(item) >= relicary.capacity && !equipped(relicary, key)) throw new Error('Libere espaço para usar esta peça da reserva.')
  const spec = relicSpec(item.id)
  const slots = Object.fromEntries(Object.entries(relicary.slots).filter(([, active]) => active !== key))
  const troopGear = Object.fromEntries(Object.entries(relicary.troopGear).filter(([, active]) => active !== key))
  if (isGearSlot(slot)) {
    if (!spec.slots.includes(slot)) throw new Error('A relíquia não cabe neste slot.')
    slots[slot] = key
  } else {
    if (!spec.troop) throw new Error('Esta relíquia é exclusiva do herói.')
    troopGear[slot] = key
  }
  return { ...relicary, slots, troopGear }
}

export function lockRelic(relicary: Relicary, key: string): Relicary {
  findRelic(relicary, key)
  return editRelic(relicary, key, (entry) => ({ ...entry, locked: !entry.locked }))
}

export function refineRelic(relicary: Relicary, key: string): Relicary {
  const item = findRelic(relicary, key)
  if (item.refine >= 10) throw new Error('Refinamento máximo.')
  return editRelic(addStock(relicary, { ash: -(2 + item.refine), ichor: -1 }), key, (entry) => ({ ...entry, refine: entry.refine + 1 }))
}

export function gradeRelic(relicary: Relicary, key: string): Relicary {
  const item = findRelic(relicary, key)
  if (item.grade >= 3) throw new Error('Grau máximo.')
  return editRelic(addStock(relicary, { 'curse-core': -1, [item.grade === 1 ? 'ichor' : 'awakening']: -2 }), key,
    (entry) => ({ ...entry, grade: entry.grade + 1 }))
}

export function transferRefinement(relicary: Relicary, source: string, destination: string): Relicary {
  const from = findRelic(relicary, source)
  const to = findRelic(relicary, destination)
  if (from.key === to.key || !from.refine || to.refine || from.locked) throw new Error('O destino precisa estar sem refinamento e a origem desbloqueada.')
  return editRelic(editRelic(addStock(relicary, { graft: -1 }), source, (entry) => ({ ...entry, refine: 0 })), destination,
    (entry) => ({ ...entry, refine: from.refine }))
}

export function setPin(relicary: Relicary, key: string, pin: PinId): Relicary {
  const item = findRelic(relicary, key)
  if (item.pins.length >= item.grade + 1) throw new Error('Todos os encaixes estão ocupados.')
  return editRelic(addStock(relicary, { [pin]: -1 }), key, (entry) => ({ ...entry, pins: [...entry.pins, pin] }))
}

export function removePin(relicary: Relicary, key: string, index: number): Relicary {
  const item = findRelic(relicary, key)
  const pin = item.pins[index]
  if (!pin) throw new Error('Encaixe vazio.')
  return editRelic(addStock(relicary, { [pin]: 1 }), key, (entry) => ({ ...entry, pins: entry.pins.filter((_, position) => position !== index) }))
}

export function dismantleSelection(relicary: Relicary): Relic[] {
  return relicary.relics.filter((entry) => !entry.locked && !equipped(relicary, entry.key)
    && relicSpec(entry.id).rarity !== 'Rara')
}

export function dismantleRelics(relicary: Relicary): Relicary {
  const selected = dismantleSelection(relicary)
  if (!selected.length) throw new Error('Nenhuma peça elegível.')
  const removed = new Set(selected.map((entry) => entry.key))
  const supplies: Partial<Record<StockId, number>> = { ash: 2 * selected.length }
  for (const entry of selected) for (const pin of entry.pins) supplies[pin] = (supplies[pin] ?? 0) + 1
  return addStock({ ...relicary, relics: relicary.relics.filter((entry) => !removed.has(entry.key)) }, supplies)
}

export function organizeRelics(relicary: Relicary): Relicary {
  const sort = { Rara: 0, Incomum: 1, Comum: 2 }
  return { ...relicary, relics: [...relicary.relics].sort((a, b) => sort[relicSpec(a.id).rarity] - sort[relicSpec(b.id).rarity]
    || relicSpec(a.id).name.localeCompare(relicSpec(b.id).name, 'pt-BR')) }
}

export function relicBonuses(item: Relic): Required<Bonuses> {
  const base = relicSpec(item.id).bonus
  const result = {
    hp: (base.hp ?? 0) * item.grade + item.refine * 2,
    power: (base.power ?? 0) * item.grade + item.refine,
    defense: (base.defense ?? 0) * item.grade + Math.floor(item.refine / 2),
    precision: (base.precision ?? 0) * item.grade,
    resistance: (base.resistance ?? 0) * item.grade,
  }
  for (const pin of item.pins) {
    const bonus: Bonuses = pins[pin]
    for (const key of Object.keys(result) as (keyof Bonuses)[]) result[key] += bonus[key] ?? 0
  }
  return result
}

export function gearBonuses(relicary: Relicary, troop?: TroopId) {
  const keys = troop ? [relicary.troopGear[troop]] : Object.values(relicary.slots)
  const values = relicary.relics.filter((item) => keys.includes(item.key))
  const result = { hp: 0, power: 0, defense: 0, precision: 0, resistance: 0, affinity: 0 }
  for (const item of values) {
    const { hp, power, defense, precision, resistance } = relicBonuses(item)
    result.hp += hp
    result.power += power
    result.defense += defense
    result.precision += precision
    result.resistance += resistance
    result.affinity += (item.grade >= 2 ? relicSpec(item.id).affinity ?? 0 : 0)
      + item.pins.filter((pin) => pin === 'pin-oath').length
  }
  return result
}

export function toggleGlyph(relicary: Relicary, glyph: GlyphId, remove: boolean): Relicary {
  const index = relicary.glyphs.lastIndexOf(glyph)
  if (remove) return { ...relicary, glyphs: relicary.glyphs.filter((_, position) => position !== index) }
  const used = relicary.glyphs.filter((entry) => entry === glyph).length
  if (relicary.glyphs.length >= 3 || used >= (relicary.stock[glyph] ?? 0)) throw new Error('Glifo ou encaixe indisponível.')
  return { ...relicary, glyphs: [...relicary.glyphs, glyph] }
}

export function glyphFamily(relicary: Relicary): Lineage | null {
  if (relicary.glyphs.length !== 3) return null
  if (relicary.glyphs.every((glyph) => glyph === 'glyph-pest')) return 'pest'
  return relicary.glyphs.every((glyph) => glyph === 'glyph-void') ? 'void' : null
}

export function chooseLineage(relicary: Relicary, lineage: Lineage): Relicary {
  if (relicary.unlockedLineages.includes(lineage)) return { ...relicary, lineage }
  const paid = addStock(relicary, { [`core-${lineage}`]: -1, 'curse-core': -1 })
  return { ...paid, lineage, unlockedLineages: [...paid.unlockedLineages, lineage] }
}

export function trainMastery(relicary: Relicary, id: string): Relicary {
  const entry = relicary.mastery[id] ?? { level: 1 }
  if (entry.level >= 10) throw new Error('Maestria máxima.')
  return {
    ...addStock(relicary, { ash: -entry.level }),
    mastery: { ...relicary.mastery, [id]: { ...entry, level: entry.level + 1 } },
  }
}

export function chooseMastery(relicary: Relicary, id: string, milestone: 5 | 10, path: MasteryPath): Relicary {
  const entry = relicary.mastery[id] ?? { level: 1 }
  if (entry.level < milestone) throw new Error(`A maestria precisa chegar ao nível ${milestone}.`)
  return { ...relicary, mastery: { ...relicary.mastery, [id]: { ...entry, [milestone]: path } } }
}

export function stockPiles(relicary: Relicary) {
  return (Object.keys(stock) as StockId[]).flatMap((id) => {
    const total = relicary.stock[id] ?? 0
    const piles = Math.min(Math.ceil(total / 999), 121)
    return Array.from({ length: piles }, (_, index) => ({ id, amount: Math.min(999, total - index * 999) }))
  })
}
