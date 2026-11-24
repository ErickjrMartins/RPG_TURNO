import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { appearanceIds } from '../src/content/wardrobe'
import { claimLogin, claimRecharge, currentEvents, earnAppearance, eventMission, simulateRecharge, spinAltar } from '../src/domain/events'
import { newProfile } from '../src/domain/profile'
import { styleBonuses, unlockAppearance, wearAppearance } from '../src/domain/wardrobe'
import { SaveRepository } from '../src/persistence/save'

const monday = new Date(2026, 10, 23, 12).valueOf()
const day = 86_400_000
const hero = () => newProfile('Alda', 'mage', 'feminine')

it('persiste o dia de login, o recibo e o resgate único da meta', async () => {
  const repository = await SaveRepository.open()
  try {
    const profile = simulateRecharge(claimLogin(hero(), monday), 'seal', 'receipt-1', monday)
    const saved = await repository.commit(null, () => claimRecharge(profile, 1, monday))
    const reloaded = (await repository.load())!
    expect(reloaded.events).toEqual(saved.events)
    expect(reloaded.relicary.stock.graft).toBe(2)
    expect(() => claimLogin(reloaded, monday)).toThrow()
    expect(() => claimRecharge(reloaded, 1, monday)).toThrow()
    expect(simulateRecharge(reloaded, 'seal', 'receipt-1', monday)).toBe(reloaded)
    expect(simulateRecharge(reloaded, 'seal', 'receipt-1', monday + 7 * day)).toBe(reloaded)
    expect(currentEvents(reloaded.events, monday + 7 * day)).toMatchObject({ cash: 360, recharged: 0, signIns: [], goals: [] })
    expect(claimLogin(reloaded, monday + 6 * day).wardrobe.unlocked).toContain('watch-aura')
  } finally {
    repository.close()
  }
})

it('grava os quatro slots, separa visual de atributos e não duplica pontos', () => {
  let profile = hero()
  for (let i = 0; i < 8; i++) profile = eventMission(profile, monday)
  for (const id of appearanceIds.filter((id) => id.startsWith('purge-'))) {
    profile = earnAppearance(profile, id, monday)
    profile = { ...profile, wardrobe: wearAppearance(profile.wardrobe, id, 'stats') }
  }
  const second = unlockAppearance(profile.wardrobe, 'nocturne-aura')
  expect(styleBonuses(second)).toEqual({ hp: 10, power: 1, defense: 1, energy: 3 })
  const looks = wearAppearance(second, 'nocturne-aura', 'looks')
  expect(looks.stats.aura).toBe('purge-aura')
  expect(looks.looks.aura).toBe('nocturne-aura')
  expect(unlockAppearance(looks, 'nocturne-aura')).toBe(looks)
  expect(styleBonuses(looks)).toEqual(styleBonuses(second))
})

it('garante a Manifestação no oitavo giro e prioriza giros gratuitos', () => {
  let profile = simulateRecharge(hero(), 'seal', 'receipt-2', monday)
  profile = eventMission(profile, monday)
  profile = spinAltar(profile, monday, 0.99)
  expect(profile.events.freeSpins).toBe(0)
  expect(profile.events.cash).toBe(360)
  for (let i = 1; i < 8; i++) profile = spinAltar(profile, monday, 0.99)
  expect(profile.wardrobe.unlocked).toEqual(['nocturne-aura'])
  expect(profile.events.cash).toBe(150)
  expect(profile.events.pity).toBe(0)
  expect(spinAltar(profile, monday, 0).wardrobe.unlocked).toEqual(['nocturne-aura'])
})
