import { expect, it } from 'vitest'
import { abyssSpecs } from '../src/content/adventure'
import { advanceBattle, availableTargets, playerAction, startBattle, type Battle } from '../src/domain/battle'
import { energyLeft, exchangeCore, expeditionSpoils, sweepZone } from '../src/domain/campaign'
import { newProfile, settleAttempt, startAttempt } from '../src/domain/profile'
import { addStock } from '../src/domain/relicary'

const score = { rounds: 4, fallen: 0, corrosion: 0 }
const base = () => ({ ...newProfile('Alda', 'mage', 'feminine'), completed: ['ruins', 'gate'] as ('ruins' | 'gate')[] })
const now = new Date(2026, 10, 25, 12).valueOf()

it('permite repetir expedições sem repetir Primeira Purificação e consome energia na varredura', () => {
  expect(() => startAttempt(base(), 'hollow', 245)).toThrow()
  let profile = startAttempt(base(), 'watch', 245)
  const first = profile.pending!
  profile = settleAttempt(profile, first, 'victory', now, score)
  expect(profile.campaign.last?.first).toBe(true)
  expect(profile.relicary.stock['curse-core']).toBe(1)
  expect(settleAttempt(profile, first, 'victory', now, score)).toBe(profile)
  profile = startAttempt(profile, 'watch', 246, { challenge: true })
  profile = settleAttempt(profile, profile.pending!, 'victory', now, score)
  expect(profile.campaign.zones.watch).toEqual({ clears: 2, stars: 3 })
  expect(profile.relicary.stock['curse-core']).toBe(1)
  expect(profile.relicary.stock.marks).toBe(6)
  expect(profile.campaign.last?.first).toBe(false)
  const swept = sweepZone(profile, 'watch', now)
  expect(energyLeft(swept.campaign, now)).toBe(4)
  expect(swept.relicary.stock.ash).toBe(24)
  expect(energyLeft(swept.campaign, now + 86_400_000)).toBe(5)
})

it('sorteia espólio por participante, dobra Marcas no desafio e permite trocá-las por núcleo', () => {
  let profile = startAttempt(base(), 'watch', 245)
  profile = settleAttempt(profile, profile.pending!, 'victory', now, score)
  profile = startAttempt(profile, 'nest', 301, { challenge: true, teamSize: 4 })
  const hard = profile.pending!
  const spoils = expeditionSpoils(hard, 'nest', true)
  expect(spoils).toHaveLength(4)
  expect(spoils.map((entry) => entry.seat)).toEqual([1, 2, 3, 4])
  expect(expeditionSpoils({ ...hard, challenge: undefined }, 'nest', true)[0]?.rewards.marks).toBe(5)
  expect(spoils[0]?.rewards.marks).toBe(10)
  const won = settleAttempt(profile, hard, 'victory', now, score)
  expect(won.relicary.stock.marks).toBe(12)
  const purchased = exchangeCore({ ...won, relicary: addStock(won.relicary, { 'core-void': 9 }) }, 'void')
  expect(purchased.relicary.stock['core-void']).toBe((won.relicary.stock['core-void'] ?? 0) + 10)
  expect(purchased.relicary.stock.marks).toBe(2)
})

function finishRound(state: Battle): Battle {
  while (state.phase === 'resolution') state = advanceBattle(state).state
  return state
}

it('abre a segunda fase do Ninho e rompe a barreira com um Abismo', () => {
  let profile = startAttempt(base(), 'watch', 400)
  profile = settleAttempt(profile, profile.pending!, 'victory', now, score)
  const nest = startBattle(startAttempt(profile, 'nest', 110, { teamSize: 3 }))
  expect(nest.units.filter((unit) => unit.id.startsWith('local'))).toHaveLength(2)
  for (const unit of nest.units.filter((unit) => unit.team === 'enemies')) unit.hp = unit.id === 'focus-0' ? 1 : 0
  const shielded = finishRound(playerAction(nest, 'spark', 'focus-0').state)
  expect(shielded.nucleus).toBe(true)
  expect(shielded.sealed).toBe(true)
  const previous = shielded.units.find((unit) => unit.id === 'nucleus')!.hp
  const stillSealed = playerAction(shielded, 'spark', 'nucleus')
  expect(stillSealed.state.units.find((unit) => unit.id === 'nucleus')!.hp).toBe(previous)
  const next = { ...finishRound(stillSealed.state), macula: 100 }
  const skill = abyssSpecs.mage
  const broken = playerAction(next, skill.id, availableTargets(next, skill)[0]!.id)
  expect(broken.state.sealed).toBe(false)
  expect(broken.events.map((event) => event.text).join(' ')).toMatch(/quebrou a barreira/)
})
