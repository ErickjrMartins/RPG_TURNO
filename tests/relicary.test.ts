import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { attributesFor, newProfile } from '../src/domain/profile'
import { addRelic, addStock, chooseLineage, chooseMastery, dismantleRelics, dismantleSelection, equipRelic, glyphFamily, gradeRelic, lockRelic, newRelicary, organizeRelics, refineRelic, removePin, setPin, stockPiles, toggleGlyph, trainMastery, transferRefinement } from '../src/domain/relicary'
import { SaveRepository } from '../src/persistence/save'

it('refina, transfere, eleva o grau, encaixa e devolve o Prego', () => {
  let bag = addStock(newRelicary(), { ash: 20, ichor: 6, graft: 1, 'pin-power': 1, 'curse-core': 1 })
  bag = addRelic(addRelic(bag, 'dawn-brooch'), 'gate-insignia')
  bag = refineRelic(bag, 'dawn-brooch')
  bag = transferRefinement(bag, 'dawn-brooch', 'gate-insignia')
  expect(bag.relics.map((entry) => entry.refine)).toEqual([0, 1])
  expect(bag.stock.graft).toBeUndefined()
  bag = gradeRelic(bag, 'gate-insignia')
  bag = equipRelic(setPin(bag, 'gate-insignia', 'pin-power'), 'gate-insignia', 'talisman')
  const profile = { ...newProfile('Ana', 'warrior', 'feminine'), relicary: bag }
  expect(attributesFor(profile).power).toBe(25 + 10 + 1 + 3)
  expect(removePin(bag, 'gate-insignia', 0).stock['pin-power']).toBe(1)
})

it('protege peças equipadas, bloqueadas e raras e organiza pilhas de até 999', () => {
  let bag = addStock(newRelicary(), { ash: 1000 })
  for (const id of ['dawn-brooch', 'gate-insignia', 'abyss-heart', 'ember-loop'] as const) bag = addRelic(bag, id)
  bag = lockRelic(equipRelic(bag, 'dawn-brooch', 'rosary'), 'gate-insignia')
  expect(dismantleSelection(bag).map((entry) => entry.id)).toEqual(['ember-loop'])
  expect(dismantleRelics(bag).relics).toHaveLength(3)
  expect(organizeRelics(bag).relics[0]?.id).toBe('abyss-heart')
  expect(stockPiles(bag).map((entry) => entry.amount)).toEqual([999, 1])
})

it('persiste bônus de glifos e troca de ramificação sem perda de maestria', async () => {
  let bag = addStock(newRelicary(), { 'glyph-pest': 3, ash: 45, 'core-pest': 1, 'curse-core': 1 })
  for (let i = 0; i < 3; i++) bag = toggleGlyph(bag, 'glyph-pest', false)
  expect(glyphFamily(bag)).toBe('pest')
  for (let i = 1; i < 10; i++) bag = trainMastery(bag, 'strike')
  bag = chooseMastery(chooseMastery(chooseMastery(bag, 'strike', 5, 'safe'), 'strike', 5, 'oath'), 'strike', 10, 'safe')
  bag = chooseLineage(bag, 'pest')
  const repository = await SaveRepository.open()
  try {
    await repository.commit(null, () => ({ ...newProfile('Alda', 'warrior', 'feminine'), relicary: bag }))
    const reloaded = (await repository.load())!
    expect(glyphFamily(reloaded.relicary)).toBe('pest')
    expect(reloaded.relicary.lineage).toBe('pest')
    expect(reloaded.relicary.mastery.strike).toEqual({ level: 10, 5: 'oath', 10: 'safe' })
  } finally {
    repository.close()
  }
})
