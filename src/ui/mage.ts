import { baseName } from '../content/city'
import { abyssSpecs, skillsByClass } from '../content/adventure'
import { mageIcon, mageNodeIds, mageNodes, maxMageActives, maxMagePassives, type MageNodeId } from '../content/mage'
import { configuredMageSpell, isMageActive, isMagePassive, isMageSpell, mageBlocked, mageLinks, magePoints, mageSlotBlocked } from '../domain/mage'
import type { Profile } from '../domain/profile'
import { safe } from './html'

function activeSkill(id: MageNodeId, profile: Profile) {
  if (isMageSpell(id)) return configuredMageSpell(id, profile.mageRanks)
  if (id === 'void-circle') return abyssSpecs.mage
  return skillsByClass.mage.find((skill) => skill.id === id)
}

export function mageView(profile: Profile, selected: MageNodeId, error: string): string {
  const studied = profile.mageRanks
  const loadout = profile.mageLoadout!
  const points = magePoints(profile)
  const choice = mageNodes[selected]
  const reason = mageBlocked(profile, selected)
  const slotReason = mageSlotBlocked(profile, selected)
  const equipped = new Set<MageNodeId>([...loadout.active, ...loadout.passive, 'void-circle'])
  const spell = activeSkill(selected, profile)
  const category = selected === 'void-circle' ? 'Soberania' : isMageActive(selected) ? 'Ativa' : 'Passiva'
  const changeable = (isMageActive(selected) && selected !== 'spark') || isMagePassive(selected)
  const prepared = (id: MageNodeId) => `<button class="small-button" data-action="mage-node" data-value="${id}" aria-pressed="${id === selected}">${activeSkill(id, profile)?.name ?? mageNodes[id].name}</button>`
  return `<section class="view-width base-screen mage-screen" aria-labelledby="mage-title">
    <button class="back" data-action="camp">← &nbsp; ${baseName}</button>
    <header class="base-head"><div><p class="eyebrow">MAGO · CANALIZADOR</p><h1 id="mage-title">Árvore de Habilidades</h1></div>
      <div class="arcana-budget"><span class="resource-chip">Pontos disponíveis <b>${points}</b></span>
      <button class="small-button" data-action="mage-reset" ${Object.keys(studied).length ? '' : 'disabled'}>Redistribuir pontos</button></div></header>
    <p class="form-error" role="status">${safe(error)}</p>
    <div class="arcana-layout">
      <div class="arcana-board panel" aria-label="Caminhos Astral, Vital e do Vazio">
        <div class="arcana-compass" aria-hidden="true"></div>
        ${mageLinks.map(({ id, source }) => {
          const [x, y] = mageNodes[source].position
          const [endX, endY] = mageNodes[id].position
          return `<i class="arcana-link ${studied[source] ? 'lit' : ''}" data-discipline="${mageNodes[id].discipline}" aria-hidden="true"
            style="--x:${x};--y:${y};--end-x:${endX};--end-y:${endY}"></i>`
        }).join('')}
        ${mageNodeIds.map((id) => {
          const spec = mageNodes[id]
          return `<button class="arcana-node" data-action="mage-node" data-value="${id}" aria-pressed="${id === selected}"
            data-discipline="${spec.discipline}" data-studied="${!!studied[id]}" style="--x:${spec.position[0]}%;--y:${spec.position[1]}%">
            <img src="${mageIcon(id)}" alt="" /><span>${spec.name}</span><small>${studied[id] ?? 0}/${spec.max}${equipped.has(id) ? ' · Equip.' : ''}</small></button>`
        }).join('')}
      </div>
      <section class="panel detail-panel arcana-details">
        <img src="${mageIcon(selected)}" alt="" /><p class="eyebrow">${choice.discipline} · ${category} · NÍVEL ${studied[selected] ?? 0}/${choice.max}</p>
        <h2>${spell?.name ?? choice.name}</h2>
        ${spell ? `<p>${spell.description}</p><p>${spell.cost ? `${spell.cost} ${spell.abyss || spell.resource ? 'Mácula' : 'Foco'}` : 'Sem custo'} · ${spell.cooldown ? `${spell.cooldown} rod. de recarga` : 'Sem recarga'}</p>` : ''}
        <p>${choice.description}</p>
        ${choice.parents.length ? `<p>Pré-requisito: ${choice.parents.map((id) => mageNodes[id].name).join(' + ')}</p>` : ''}
        <button class="button primary" data-action="mage-train" ${reason ? 'disabled' : ''}>Aprender · 1 ponto</button>
        ${reason ? `<p>${reason}</p>` : ''}
        ${changeable ? `<button class="button" data-action="mage-slot" ${slotReason ? 'disabled' : ''}>${equipped.has(selected) ? 'Retirar da preparação' : 'Equipar habilidade'}</button>` : ''}
        ${slotReason ? `<p>${slotReason}</p>` : ''}
      </section>
    </div>
    <section class="panel detail-panel arcana-loadout" aria-labelledby="loadout-title">
      <h2 id="loadout-title">Preparação de combate</h2>
      <div class="arcana-slots"><b>Ativas ${loadout.active.length}/${maxMageActives}</b><div>${loadout.active.map(prepared).join('')}</div></div>
      <div class="arcana-slots"><b>Passivas ${loadout.passive.length}/${maxMagePassives}</b><div>${loadout.passive.map(prepared).join('')}</div></div>
      <div class="arcana-slots"><b>Soberania</b><div>${prepared('void-circle')}</div></div>
    </section>
  </section>`
}
