import { skillsByClass, troops } from '../content/adventure'
import { assetUrl } from '../assets'
import { styledHero } from './events'
import { gearSlots, masteryPaths, pins, relicSpec, stock, type GearSlot, type GlyphId, type Lineage, type PinId } from '../content/relics'
import { attributesFor, type Profile } from '../domain/profile'
import { dismantleSelection, equipped, glyphFamily, relicBonuses, stockPiles, type Relic } from '../domain/relicary'
import { safe } from './html'

export const filters = ['Tudo', 'Relíquias', 'Selos & Núcleos', 'Materiais', 'Consumíveis / Baús'] as const
export type RelicFilter = typeof filters[number]
const stats = { hp: 'Vida', power: 'Ataque', defense: 'Defesa', precision: 'Precisão', resistance: 'Resistência' } as const
const slots = Object.keys(gearSlots) as GearSlot[]
const weights = { hp: 1, power: 3, defense: 2, precision: 1, resistance: 1 }
const keys = Object.keys(stats) as (keyof typeof stats)[]

function gearIndex(bonus: ReturnType<typeof relicBonuses>): number {
  return keys.reduce((sum, key) => sum + weights[key] * bonus[key], 0)
}

function bonusText(item: Relic): string {
  const bonus = relicBonuses(item)
  return (Object.keys(stats) as (keyof typeof stats)[]).filter((key) => bonus[key]).map((key) => `+${bonus[key]} ${stats[key]}`).join(' · ')
}

function relicIcon(filename: string): string {
  return `<img class="relic-icon" src="${assetUrl(filename)}" alt="" width="48" height="48">`
}

function detail(profile: Profile, item: Relic): string {
  const { relicary } = profile
  const spec = relicSpec(item.id)
  const slot = spec.slots.find((id) => relicary.slots[id] === item.key)
    ?? spec.slots.find((id) => !relicary.slots[id]) ?? spec.slots[0]!
  const current = relicary.relics.find((entry) => entry.key === relicary.slots[slot])
  const previous = current && relicBonuses(current)
  const next = relicBonuses(item)
  const deltas = keys.map((key) => ({ name: stats[key], amount: next[key] - (previous?.[key] ?? 0) })).filter((diff) => diff.amount)
  const selectedPins = (Object.keys(pins) as PinId[]).filter((id) => (relicary.stock[id] ?? 0) > 0)
  const transfers = relicary.relics.filter((entry) => !entry.refine && item.refine && !item.locked && entry.key !== item.key)
  return `<section class="panel detail-panel" aria-labelledby="relic-details">
    <div class="eyebrow">${spec.rarity} · GRAU ${item.grade} · REFINO +${item.refine}</div>
    <h2 id="relic-details"${spec.icon ? ' class="relic-heading"' : ''}>${spec.icon ? relicIcon(spec.icon) : ''}${spec.name}</h2>
    <p>${spec.slots.map((id) => gearSlots[id]).join(' / ')}</p>
    <div class="comparison">
      <div><small>Selecionada</small><b>${spec.name}</b><span>${bonusText(item)}</span></div>
      <div><small>${gearSlots[slot]}</small><b>${current ? relicSpec(current.id).name : 'Slot vazio'}</b><span>${current ? bonusText(current) : 'Sem bônus'}</span></div>
    </div>
    <p class="relic-delta">${deltas.length ? deltas.map(({ name, amount }) => `<span class="${amount > 0 ? 'gain' : 'loss'}">${amount > 0 ? '+' : ''}${amount} ${name}</span>`).join('') : 'Atributos equivalentes.'}</p>
    <p>${spec.affinity && item.grade >= 2 ? `Efeito de Jura: reduz o custo de Vida em ${spec.affinity}.` : 'Efeito de Jura: nenhum.'}</p>
    <div class="detail-actions">
      ${spec.slots.map((id) => `<button class="small-button" data-action="equip-slot" data-value="${id}" ${relicary.slots[id] === item.key ? 'disabled' : ''}>Equipar · ${gearSlots[id]}</button>`).join('')}
      ${spec.troop ? profile.recruits.map(({ id }) => `<button class="small-button" data-action="equip-slot" data-value="${id}" ${relicary.troopGear[id] === item.key ? 'disabled' : ''}>Equipar · ${troops[id].name}</button>`).join('') : ''}
      <button class="small-button" data-action="relic-lock" aria-pressed="${item.locked}">${item.locked ? 'Desbloquear' : 'Bloquear'}</button>
    </div>
    <h3>Forja e Enxerto</h3>
    <div class="detail-actions">
      <button class="small-button" data-action="relic-refine" ${item.refine >= 10 ? 'disabled' : ''}>Refinar · ${2 + item.refine} cinzas + 1 icor</button>
      <button class="small-button" data-action="relic-grade" ${item.grade >= 3 ? 'disabled' : ''}>Promover · 1 núcleo + 2 ${item.grade === 1 ? 'icor' : 'despertar'}</button>
      ${transfers.length ? `<label for="relic-transfer">Destino do refinamento</label><select id="relic-transfer">${transfers.map((entry) => `<option value="${entry.key}">${relicSpec(entry.id).name}</option>`).join('')}</select><button class="small-button" data-action="relic-transfer">Transferir · 1 Selo de Enxerto</button>` : ''}
    </div>
    <h3>Pregos de Selamento · ${item.pins.length}/${item.grade + 1}</h3>
    <div class="detail-actions">
      ${item.pins.map((pin, index) => `<button class="small-button" data-action="pin-remove" data-value="${index}">Remover ${stock[pin].name}</button>`).join('')}
      ${item.pins.length < item.grade + 1 ? selectedPins.map((pin) => `<button class="small-button" data-action="pin-place" data-value="${pin}">Encaixar ${stock[pin].name}</button>`).join('') : ''}
    </div>
  </section>`
}

function systems(profile: Profile): string {
  const { relicary, hero } = profile
  const lineage = glyphFamily(relicary)
  return `<section class="panel detail-panel">
    <h2>Matriz de Essência</h2>
    <p>${relicary.glyphs.length}/3 Glifos · ${lineage === 'pest' ? '+10 recurso inicial' : lineage === 'void' ? 'Efeitos negativos duram +1 rodada' : 'Três Glifos da mesma família ativam um bônus.'}</p>
    ${(['glyph-pest', 'glyph-void'] as GlyphId[]).map((id) => {
      const installed = relicary.glyphs.filter((entry) => entry === id).length
      const supply = relicary.stock[id] ?? 0
      return `<div class="management-row"><div><strong>${stock[id].name}</strong><span>${installed}/${supply} instalados</span></div>
        <div class="detail-actions"><button class="small-button" data-action="glyph-place" data-value="${id}" ${installed >= supply || relicary.glyphs.length === 3 ? 'disabled' : ''}>Instalar</button>
        <button class="small-button" data-action="glyph-remove" data-value="${id}" ${installed === 0 ? 'disabled' : ''}>Remover</button></div></div>`
    }).join('')}
    <h3>Linhagens Amaldiçoadas</h3>
    <div class="detail-actions">${(['pest', 'void'] as Lineage[]).map((id) => `<button class="small-button" data-action="lineage" data-value="${id}" aria-pressed="${relicary.lineage === id}" ${relicary.lineage === id ? 'disabled' : ''}>${relicary.unlockedLineages.includes(id) ? 'Ativar' : 'Forjar'} ${id === 'pest' ? 'Peste · +3 Ataque' : 'Vazio · +10 Resistência'}</button>`).join('')}</div>
    <p>Forjar custa 1 núcleo da linhagem e 1 Núcleo de Maldição.</p>
  </section>
  <section class="panel detail-panel"><h2>Maestria</h2>
    ${skillsByClass[hero.classId].map((skill) => {
      const mastery = relicary.mastery[skill.id]
      const level = mastery?.level ?? 1
      return `<div class="mastery-row">
        <div class="management-row"><div><strong>${skill.name}</strong><span>Nível ${level}/10</span></div>
        <button class="small-button" data-action="mastery-train" data-value="${skill.id}" ${level >= 10 ? 'disabled' : ''}>Treinar · ${level} cinzas</button></div>
        ${([5, 10] as const).filter((rank) => level >= rank).map((rank) => `<div class="detail-actions"><small>Nível ${rank}</small>${Object.entries(masteryPaths).map(([path, label]) => `<button class="small-button" data-action="mastery-choose" data-value="${skill.id}:${rank}:${path}" aria-pressed="${mastery?.[rank] === path}">${label}</button>`).join('')}</div>`).join('')}
      </div>`
    }).join('')}
  </section>`
}

export function relicaryView(profile: Profile, state: { chosen: string; filter: RelicFilter; bulk: boolean }, error: string): string {
  const { relicary, hero } = profile
  const attr = attributesFor(profile)
  const { filter, chosen, bulk } = state
  const piles = stockPiles(relicary)
  const used = relicary.relics.length + piles.length
  const storedRelics = relicary.relics.slice(0, relicary.capacity)
  const storedPiles = piles.slice(0, Math.max(0, relicary.capacity - storedRelics.length))
  const shownRelics = filter === 'Tudo' || filter === 'Relíquias' ? storedRelics : []
  const shownPiles = storedPiles.filter(({ id }) => filter === 'Tudo' || stock[id].category === filter)
  const entry = relicary.relics.find((item) => item.key === chosen) ?? shownRelics[0]
  const stockItem = (Object.keys(stock) as (keyof typeof stock)[]).find((id) => chosen === `stock:${id}`)
  const strength = attr.power * 3 + attr.defense * 2 + attr.hp + attr.precision + attr.resistance
  const eligible = dismantleSelection(relicary)
  return `<section class="view-width base-screen" aria-labelledby="relic-title">
    <button class="back" data-action="camp">← &nbsp; Refúgio de Alvor</button>
    <div class="base-head"><div><div class="eyebrow"><span></span> RELÍQUIAS PROFANAS</div><h1 id="relic-title">Relicário</h1></div><span class="resource-chip">${used}/${relicary.capacity} espaços · ${profile.gold} ouro</span></div>
    <p class="form-error" role="status">${safe(error)}</p>
    <div class="relic-layout">
      <section class="panel relic-character" aria-label="Equipamentos do herói">
        ${styledHero(profile)}
        <div><h2>${safe(hero.name)}</h2><p>Índice de Calamidade <b>${strength}</b></p><p>Estabilidade de Mácula <b>${attr.affinity}</b></p></div>
        <div class="detail-actions style-nav"><button class="small-button" data-action="wardrobe" data-value="mantle">Traje de Clã</button><button class="small-button" data-action="wardrobe" data-value="aura">Manifestação</button></div>
        <div class="hero-slot-list">${slots.map((id) => {
          const item = relicary.relics.find((entry) => entry.key === relicary.slots[id])
          const spec = item && relicSpec(item.id)
          return `<div><strong>${gearSlots[id]}</strong>${item && spec ? `<button class="small-button${spec.icon ? ' relic-slot-item' : ''}" data-action="relic-select" data-value="${item.key}">${spec.icon ? relicIcon(spec.icon) : ''}${spec.name}</button>` : '<span>Vazio</span>'}</div>`
        }).join('')}</div>
      </section>
      <section class="panel detail-panel">
        <div class="inventory-filters" aria-label="Filtros do Relicário">${filters.map((id) => `<button class="small-button" data-action="relic-filter" data-value="${id}" aria-pressed="${id === filter}">${id}</button>`).join('')}</div>
        <div class="inventory-grid">
          ${shownRelics.map((item) => {
            const spec = relicSpec(item.id)
            const slot = spec.slots.find((id) => !relicary.slots[id]) ?? spec.slots[0]
            const wearing = relicary.relics.find((other) => other.key === (slot && relicary.slots[slot]))
            const level = relicBonuses(item)
            const current = wearing && relicBonuses(wearing)
            const better = !equipped(relicary, item.key) && (!current || gearIndex(level) > gearIndex(current))
            return `<button class="inventory-cell relic-cell" data-action="relic-select" data-value="${item.key}" aria-pressed="${entry?.key === item.key && !stockItem}">${spec.icon ? relicIcon(spec.icon) : '<span aria-hidden="true">◇</span>'}<b>${spec.name}</b><small>${item.locked ? 'Bloqueada' : equipped(relicary, item.key) ? 'Equipada' : better ? '<em>↑ Melhora</em>' : spec.rarity}</small></button>`
          }).join('')}
          ${shownPiles.map(({ id, amount }) => `<button class="inventory-cell" data-action="relic-select" data-value="stock:${id}"><span aria-hidden="true">✧</span><b>${stock[id].name}</b><small>×${amount}</small></button>`).join('')}
          ${filter === 'Tudo' ? '<span class="inventory-cell empty" aria-hidden="true"></span>'.repeat(Math.max(0, relicary.capacity - used)) : ''}
        </div>
        ${used > relicary.capacity ? `<p>${used - relicary.capacity} na reserva. Libere espaço ou expanda o Relicário.</p>` : ''}
        ${shownRelics.length + shownPiles.length === 0 && filter !== 'Tudo' ? '<p>Nenhum item nesta categoria.</p>' : ''}
        <div class="detail-actions inventory-footer">
          <button class="small-button" data-action="relic-organize">Organizar</button>
          <button class="small-button" data-action="relic-bulk">Expurgar / Desmontar em Massa</button>
          <button class="small-button" data-action="relic-forge" ${!entry ? 'disabled' : ''}>Forja / Enxerto Rápido</button>
          <button class="small-button" data-action="relic-expand" ${relicary.capacity >= 120 ? 'disabled' : ''}>Expandir Espaço · 25 ouro</button>
        </div>
        ${bulk ? `<div class="bulk-confirm"><strong>Prévia do desmonte</strong>
          <p>${eligible.length ? eligible.map((item) => relicSpec(item.id).name).join(', ') : 'Nenhuma relíquia comum ou incomum elegível.'}</p>
          <p>Receberá ${eligible.length * 2} Cinzas e ${eligible.reduce((sum, item) => sum + item.pins.length, 0)} Pregos recuperados.</p>
          <button class="small-button" data-action="relic-dismantle" ${eligible.length ? '' : 'disabled'}>Confirmar desmonte</button>
          <button class="small-button" data-action="relic-bulk">Cancelar</button></div>` : ''}
      </section>
    </div>
    ${stockItem ? `<section class="panel detail-panel"><h2>${stock[stockItem].name}</h2><p>${stock[stockItem].category} · ${relicary.stock[stockItem] ?? 0} no Relicário</p></section>` : entry ? detail(profile, entry) : ''}
    <div class="base-tools">${systems(profile)}</div>
  </section>`
}
