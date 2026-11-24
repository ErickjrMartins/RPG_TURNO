import { expect, it } from 'vitest'
import { zone } from '../src/content/campaign'
import { startBattle } from '../src/domain/battle'
import { zoneUnlocked } from '../src/domain/campaign'
import { newProfile, settleAttempt, startAttempt, type Profile } from '../src/domain/profile'

it('desbloqueia os dois mapas em sequência e carrega quatro espécies originais', () => {
  let profile: Profile = { ...newProfile('Nara', 'mage', 'feminine'), completed: ['ruins', 'gate'] }
  expect(zoneUnlocked(profile, 'drowned')).toBe(false)
  const story = ['watch', 'hollow', 'core', 'drowned', 'mothvault', 'frostpath', 'observatory'] as const
  const discovered = new Set<string>()
  for (const encounter of story) {
    expect(zoneUnlocked(profile, encounter)).toBe(true)
    const active = startAttempt(profile, encounter, 38)
    if (zone(encounter).region !== 'fields') {
      const battle = startBattle(active)
      for (const unit of battle.units.filter((entry) => entry.team === 'enemies')) discovered.add(unit.art)
      expect(zone(encounter).core.art).toBeDefined()
    }
    profile = settleAttempt(active, active.pending!, 'victory')
  }
  expect(discovered).toEqual(new Set(['rootbound', 'moth', 'frostcat', 'glacier']))
  expect(profile.hero.xp).toBe(350)
  expect(profile.campaign.zones.observatory?.clears).toBe(1)
})
