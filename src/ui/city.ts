import { troops, type TroopId } from '../content/adventure'
import { buildingIds, buildings, goldLimits, maxBuildingLevel, type BuildingId } from '../content/city'
import { className } from '../content/classes'
import { farmRate, goldLimit, upgradeBlocked, updateCity } from '../domain/city'
import { relicSpec } from '../content/relics'
import { equipped, relicBonuses } from '../domain/relicary'
import { attributesFor, levelFor, recruitAttributes, trainingCost, type Profile } from '../domain/profile'
import { styledHero } from './events'
import { safe } from './html'

const slotLabels = ['Frente · esquerda', 'Frente · centro', 'Frente · direita', 'Retaguarda · esquerda', 'Retaguarda · centro', 'Retaguarda · direita']

function troopsPanel(profile: Profile): string {
  return (Object.keys(troops) as TroopId[]).map((id) => {
    const troop = troops[id]
    const recruit = profile.recruits.find((entry) => entry.id === id)
    if (!recruit) {
      return `<div class="management-row"><div><strong>${troop.name}</strong><span>${troop.role}</span></div>
        <button class="small-button" data-action="hire" data-value="${id}" ${profile.gold < troop.gold || profile.supplies < troop.supplies ? 'disabled title="Recursos insuficientes"' : ''}>Recrutar · ${troop.gold} ouro + ${troop.supplies} prov.</button></div>`
    }
    const { hp, power, defense } = recruitAttributes(recruit, profile.relicary)
    const train = recruit.level < profile.city.buildings.barracks.level
    const cost = trainingCost(recruit.level)
    return `<div class="troop-card">
      <div class="management-row"><div><strong>${troop.name} · Nv. ${recruit.level}</strong><span>${hp} Vida · ${power} Poder · ${defense} Defesa</span></div>
      <label class="visually-hidden" for="formation-${id}">Posição de ${troop.name}</label><select id="formation-${id}" data-troop="${id}">${slotLabels.map((label, slot) => `<option value="${slot}" ${slot === recruit.slot ? 'selected' : ''} ${slot === 1 || profile.recruits.some((entry) => entry.id !== id && entry.slot === slot) ? 'disabled' : ''}>${label}</option>`).join('')}</select></div>
      ${train ? `<button class="small-button" data-action="train" data-value="${id}" ${profile.gold < cost.gold || profile.supplies < cost.supplies ? 'disabled title="Recursos insuficientes"' : ''}>Treinar ${troop.name} · ${cost.gold} ouro + ${cost.supplies} prov.</button>` : ''}
    </div>`
  }).join('')
}

function buildingEffect(id: BuildingId, level: number): string {
  switch (id) {
    case 'council': return `Edifícios até o nível ${level}`
    case 'barracks': return `Treinamento até o nível ${level}`
    case 'farm': return `1 provisão a cada ${farmRate(level).seconds}s · estoque de ${farmRate(level).capacity}`
    case 'treasury': return `Capacidade de ${goldLimits[level - 1]} ouro`
  }
}

function countdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
}

function inspector(profile: Profile, id: BuildingId, now: number): string {
  const building = profile.city.buildings[id]
  const spec = buildings[id]
  const next = spec.upgrades[building.level - 1]
  const blocked = upgradeBlocked(profile, id)
  return `<section class="panel city-inspector" aria-labelledby="building-title">
    <div class="eyebrow">NÍVEL ${building.level}</div>
    <h2 id="building-title">${spec.name}</h2>
    <p>${spec.description}</p>
    <dl class="building-effects">
      <div><dt>Atual</dt><dd>${buildingEffect(id, building.level)}</dd></div>
      ${building.level < maxBuildingLevel ? `<div><dt>Nível ${building.level + 1}</dt><dd>${buildingEffect(id, building.level + 1)}</dd></div>` : ''}
    </dl>
    ${next ? `<div class="upgrade-box">
      ${building.readyAt !== null
        ? `<strong>Melhoria em andamento</strong><p>Conclui em <b data-upgrade-clock="${id}">${countdown(building.readyAt - now)}</b>.</p>`
        : `<span>${next.gold} ouro · ${next.supplies} prov. · ${next.seconds}s</span>
          <button class="small-button" data-action="improve" data-value="${id}" ${blocked ? 'disabled' : ''}>Melhorar</button>
          ${blocked ? `<p>${blocked}</p>` : ''}`}
    </div>` : '<p>Nível máximo.</p>'}
    ${id === 'barracks' ? `<div class="building-operation"><h3>Abominações Domadas</h3>${troopsPanel(profile)}</div>` : ''}
    ${id === 'farm' ? `<div class="building-operation">
      <h3>Colheita</h3>
      <p data-farm-status>${farmStatus(profile, now)}</p>
      <button class="button primary" data-action="harvest" ${profile.city.farm.stored === 0 ? 'disabled' : ''}>Coletar provisões</button>
    </div>` : ''}
  </section>`
}

function farmStatus(profile: Profile, now: number): string {
  const { stored, since } = profile.city.farm
  const { seconds, capacity } = farmRate(profile.city.buildings.farm.level)
  const next = stored >= capacity ? 'Armazém cheio.' : `Próxima em ${countdown((since ?? now) + seconds * 1000 - now)}.`
  return `${stored} / ${capacity} provisões prontas. ${next}`
}

export function updateCityView(view: HTMLElement, profile: Profile, id: BuildingId, now: number): boolean {
  const figures = updateCity(profile, now)
  const level = view.querySelector<HTMLElement>('[data-building-levels]')?.dataset.buildingLevels
  if (level !== JSON.stringify(buildingIds.map((key) => figures.city.buildings[key].level))) return false
  const clock = view.querySelector<HTMLElement>('[data-upgrade-clock]')
  const readyAt = figures.city.buildings[id].readyAt
  if (clock && readyAt !== null) clock.textContent = countdown(readyAt - now)
  const farmLabel = view.querySelector<HTMLElement>('[data-farm-status]')
  if (farmLabel) farmLabel.textContent = farmStatus(figures, now)
  const harvest = view.querySelector<HTMLButtonElement>('[data-action="harvest"]')
  if (harvest) harvest.disabled = figures.city.farm.stored === 0
  return true
}

export function campView(saved: Profile, error: string, selected: BuildingId, now: number): string {
  const profile = updateCity(saved, now)
  const attributes = attributesFor(profile)
  const gateCleared = profile.completed.includes('gate')
  return `<section class="view-width city" aria-labelledby="camp-title" data-building-levels="${JSON.stringify(buildingIds.map((key) => profile.city.buildings[key].level))}">
    <header class="city-head">
      <div><div class="eyebrow"><span></span> CAMPOS DE ALVOR</div><h1 id="camp-title">Refúgio de Alvor</h1></div>
      <div class="companion-stats" aria-label="Recursos da cidade">
        <span><strong data-balance="gold">${profile.gold}</strong> Ouro <small>/ ${goldLimit(profile.city)}</small></span>
        <span><strong data-balance="supplies">${profile.supplies}</strong> Provisões</span>
      </div>
    </header>
    <p class="form-error" role="status">${safe(error)}</p>
    <div class="city-layout">
      <div class="panel city-map" aria-label="Edifícios do Refúgio">
        <div class="city-hero-marker" aria-hidden="true">${styledHero(profile)}</div>
        ${buildingIds.map((id) => {
          const { name, icon, position } = buildings[id]
          const building = profile.city.buildings[id]
          return `<button class="city-marker" style="--x:${position[0]}%;--y:${position[1]}%" data-action="building" data-value="${id}" aria-pressed="${selected === id}">
            <span class="building-icon" aria-hidden="true">${icon}</span><span><strong>${name}</strong><small>Nv. ${building.level}${building.readyAt !== null ? ' · Em melhoria' : ''}</small></span>
          </button>`
        }).join('')}
      </div>
      ${inspector(profile, selected, now)}
    </div>
    <div class="city-summary">
      <section class="panel management-panel">
        <div class="camp-hero">${styledHero(profile)}<div><strong>${safe(profile.hero.name)}</strong><span>${className(profile.hero.classId, profile.hero.presentation)} · Nível ${levelFor(profile.hero.xp)} · ${profile.hero.xp} XP</span></div></div>
        <div class="companion-stats"><span><strong>${attributes.power}</strong> Poder</span><span><strong>${attributes.defense}</strong> Defesa</span></div>
        <h2>Equipamento</h2>
        ${profile.relicary.relics.filter((item) => item.id === 'dawn-brooch' || item.id === 'gate-insignia').slice(0, 2).map((item) => {
          const bonus = relicBonuses(item)
          return `<div class="management-row"><div><strong>${relicSpec(item.id).name}</strong><span>+${bonus.power} Poder · +${bonus.defense} Defesa</span></div>
            ${equipped(profile.relicary, item.key) ? '<span class="equipped">Equipado</span>' : `<button class="small-button" data-action="equip" data-value="${item.key}">Equipar</button>`}</div>`
        }).join('')}
        <div class="detail-actions city-access"><button class="button secondary" data-action="relicary">Abrir Relicário</button>
          ${profile.hero.classId === 'mage' ? '<button class="button secondary" data-action="mage-tree">Árvore de Habilidades</button>' : ''}</div>
      </section>
      <section class="panel management-panel city-route">
        <span class="eyebrow">${gateCleared ? 'ENCONTRO CONCLUÍDO' : 'PRÓXIMO ENCONTRO'}</span>
        <h2>Portão Caído</h2>
        <p>${gateCleared ? 'O Guardião caiu e o primeiro trecho da campanha está salvo.' : 'O Guardião bloqueia a passagem. Prepare sua formação antes de enfrentá-lo.'}</p>
        ${gateCleared ? '' : '<button class="button primary" data-action="gate">Ir ao Portão <span aria-hidden="true">→</span></button>'}
        <button class="button secondary" data-action="drill">Campo de Treino</button>
        <button class="button secondary" data-action="missions">Expedições</button>
        <button class="button secondary" data-action="events">Eventos</button>
        <button class="button secondary" data-action="plaza">Praça de Alvor</button>
      </section>
    </div>
    <button class="back" data-action="title">← &nbsp; Voltar ao título</button>
  </section>`
}
