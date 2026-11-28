import { troops } from '../content/adventure'
import { maxBuildingLevel } from '../content/city'
import { relics, stock } from '../content/relics'
import { appearance, appearanceIds, styleSlots } from '../content/wardrobe'
import { levelFor, type Profile } from '../domain/profile'
import { testLimits } from '../domain/test-admin'
import { safe } from './html'

function numberField(label: string, id: string, value: number, min: number, max: number, name = id): string {
  return `<label for="${id}">${label}<input id="${id}" name="${name}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" required value="${value}"></label>`
}

function options(prefix: string, catalog: [string, string][]): string {
  return catalog.map(([id, name]) => `<option value="${prefix}:${id}">${safe(name)}</option>`).join('')
}

export function testAdminView(profile: Profile, fromBattle: boolean, busy: boolean, error: string, notice: string): string {
  const level = levelFor(profile.hero.xp)
  const unlockedTroops = profile.recruits.map(({ id, level }) =>
    numberField(troops[id].name, `test-troop-${id}`, level, 1, maxBuildingLevel, `troop:${id}`)).join('')
  return `<section class="view-width test-admin page-enter">
    <button type="button" class="back" data-action="test-admin-close"${busy ? ' disabled' : ''}>Voltar ao jogo</button>
    <header><h1>Painel de testes</h1><p>As alterações serão salvas na campanha de ${safe(profile.hero.name)} neste navegador.</p></header>
    ${fromBattle ? '<p class="test-admin-note">Mudar o nível do herói ou das tropas reinicia o combate atual na rodada 1 ao voltar.</p>' : ''}
    <p id="test-admin-message" class="${error ? 'form-error' : 'test-admin-notice'}" role="status">${safe(error || notice)}</p>
    <div class="test-admin-grid">
      <form id="test-admin-progress" class="panel test-admin-card">
        <h2>Progressão e recursos</h2>
        <fieldset${busy ? ' disabled' : ''}>
          ${numberField('Nível do herói', 'test-level', level, 1, Math.max(testLimits.hero, level))}
          ${numberField('Créditos', 'test-gold', profile.gold, 0, Math.max(testLimits.balance, profile.gold))}
          ${numberField('Provisões', 'test-supplies', profile.supplies, 0, Math.max(testLimits.balance, profile.supplies))}
          ${unlockedTroops}
          <button class="button primary" type="submit">Salvar alterações</button>
        </fieldset>
      </form>
      <form id="test-admin-item" class="panel test-admin-card">
        <h2>Itens e aparências</h2>
        <fieldset${busy ? ' disabled' : ''}>
          <label for="test-item">Item</label>
          <select id="test-item" name="item" required>
            <option value="">Escolha um item</option>
            <optgroup label="Relíquias">${options('relic', Object.entries(relics).map(([id, entry]) => [id, entry.name]))}</optgroup>
            <optgroup label="Materiais e consumíveis">${options('stock', Object.entries(stock).map(([id, entry]) => [id, entry.name]))}</optgroup>
            <optgroup label="Aparências">${options('appearance', appearanceIds.map((id) => {
              const entry = appearance(id)
              return [id, `${entry.name} · ${styleSlots[entry.slot]}`]
            }))}</optgroup>
          </select>
          ${numberField('Quantidade de materiais', 'test-quantity', 1, 1, testLimits.material)}
          <button class="button primary" type="submit">Liberar item</button>
        </fieldset>
      </form>
    </div>
  </section>`
}
