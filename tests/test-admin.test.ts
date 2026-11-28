import { describe, expect, it } from 'vitest'
import { attributesFor, isProfile, levelFor, newProfile, startAttempt } from '../src/domain/profile'
import { grantTestItem, setTestProgress } from '../src/domain/test-admin'

describe('painel de testes', () => {
  it('altera valores e atributos preservando a tentativa e a experiência no nível atual', () => {
    const profile = startAttempt(newProfile('Pessoa', 'mage', 'feminine'), 'ruins', 42)
    const next = setTestProgress(profile, { level: 12, gold: 1200, supplies: 320, troops: {} })
    expect(levelFor(next.hero.xp)).toBe(12)
    expect(attributesFor(next).hp).toBe(attributesFor(profile).hp + 88)
    expect(next).toMatchObject({ gold: 1200, supplies: 320, pending: profile.pending, nextAttempt: profile.nextAttempt })
    const withXp = { ...next, hero: { ...next.hero, xp: 1127 }, recruits: [{ id: 'sentry' as const, level: 1, slot: 0 }] }
    const edit = setTestProgress(withXp, { level: 12, gold: 1250, supplies: 320, troops: { sentry: 3 } })
    expect(edit.hero.xp).toBe(1127)
    expect(edit.recruits[0]?.level).toBe(3)
    expect(isProfile(edit)).toBe(true)
  })

  it('recusa valores inválidos e perda de pontos investidos na árvore', () => {
    const mage = { ...newProfile('Canalizador', 'mage', 'masculine'), mageRanks: { focus: 3 } }
    expect(() => setTestProgress(mage, { level: 1, gold: 0, supplies: 0, troops: {} })).toThrow(/Reinicie a árvore/)
    expect(() => setTestProgress(mage, { level: 2, gold: -1, supplies: 0, troops: {} })).toThrow(/Créditos/)
  })

  it('concede itens do catálogo, preserva outros slots e evita duplicar desbloqueios', () => {
    const profile = newProfile('Herói', 'warrior', 'feminine')
    const withRelic = grantTestItem(profile, 'relic:abyss-heart', 1)
    const withStock = grantTestItem(withRelic, 'stock:ash', 12)
    const withLook = grantTestItem(withStock, 'appearance:nocturne-mantle', 1)
    expect(withLook.relicary.relics[0]).toMatchObject({ id: 'abyss-heart', key: 'test-abyss-heart' })
    expect(withLook.relicary.stock.ash).toBe(12)
    expect(withLook.wardrobe.unlocked).toEqual(['nocturne-mantle'])
    expect(isProfile(withLook)).toBe(true)
    expect(() => grantTestItem(withLook, 'relic:abyss-heart', 1)).toThrow(/já tem/)
    expect(() => grantTestItem(withLook, 'stock:ash', 0.5)).toThrow(/Quantidade/)
    expect(() => grantTestItem(withLook, 'stock:constructor', 1)).toThrow(/catálogo/)
  })
})
