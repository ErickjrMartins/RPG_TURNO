import { maxBuildingLevel } from '../content/city'
import { validMageRanks } from './mage'
import { levelFor, xpPerLevel, type Profile } from './profile'
import { addRelic, addStock, isRelicId, isStock } from './relicary'
import { isAppearance, unlockAppearance } from './wardrobe'

export const testLimits = { hero: 100, balance: 100_000_000, material: 9999 }

function whole(value: number, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}: informe um número inteiro entre ${min} e ${max}.`)
  }
  return value
}

interface TestProgress {
  level: number
  gold: number
  supplies: number
  troops: Record<string, number>
}

export function setTestProgress(profile: Profile, changes: TestProgress): Profile {
  const currentLevel = levelFor(profile.hero.xp)
  const level = whole(changes.level, 1, Math.max(testLimits.hero, currentLevel), 'Nível do herói')
  const xp = level === currentLevel ? profile.hero.xp : (level - 1) * xpPerLevel
  const gold = whole(changes.gold, 0, Math.max(testLimits.balance, profile.gold), 'Créditos')
  const supplies = whole(changes.supplies, 0, Math.max(testLimits.balance, profile.supplies), 'Provisões')
  if (!validMageRanks(profile.mageRanks, xp, profile.hero.classId === 'mage')) {
    throw new Error('Reinicie a árvore de habilidades na Central de Contenção antes de baixar para esse nível.')
  }
  const recruits = profile.recruits.map((recruit) => ({
    ...recruit, level: whole(changes.troops[recruit.id] ?? recruit.level, 1, maxBuildingLevel, 'Nível da tropa'),
  }))
  return { ...profile, hero: { ...profile.hero, xp }, gold, supplies, recruits }
}

export function grantTestItem(profile: Profile, item: string, quantity: number): Profile {
  const [kind, id] = item.split(':', 2)
  if (kind === 'relic' && isRelicId(id)) {
    if (profile.relicary.relics.some((entry) => entry.id === id)) throw new Error('Você já tem essa relíquia.')
    return { ...profile, relicary: addRelic(profile.relicary, id, `test-${id}`) }
  }
  if (kind === 'stock' && isStock(id)) {
    const count = whole(quantity, 1, testLimits.material, 'Quantidade')
    return { ...profile, relicary: addStock(profile.relicary, { [id]: count }) }
  }
  if (kind === 'appearance' && isAppearance(id)) {
    if (profile.wardrobe.unlocked.includes(id)) throw new Error('Você já liberou essa aparência.')
    return { ...profile, wardrobe: unlockAppearance(profile.wardrobe, id) }
  }
  throw new Error('Escolha um item do catálogo.')
}
