import { mageIcon, mageNodeIds, mageNodes, type MageNodeId } from '../content/mage'
import { mageBlocked, mageLinks, magePoints } from '../domain/mage'
import type { Profile } from '../domain/profile'
import { safe } from './html'

export function mageView(profile: Profile, selected: MageNodeId, error: string): string {
  const studied = profile.mageRanks
  const points = magePoints(profile)
  const choice = mageNodes[selected]
  const reason = mageBlocked(profile, selected)
  return `<section class="view-width base-screen mage-screen" aria-labelledby="mage-title">
    <button class="back" data-action="camp">← &nbsp; Refúgio de Alvor</button>
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
            <img src="${mageIcon(id)}" alt="" /><span>${spec.name}</span><small>${studied[id] ?? 0}/${spec.max}</small></button>`
        }).join('')}
      </div>
      <section class="panel detail-panel arcana-details">
        <img src="${mageIcon(selected)}" alt="" /><p class="eyebrow">${choice.discipline} · NÍVEL ${studied[selected] ?? 0}/${choice.max}</p>
        <h2>${choice.name}</h2><p>${choice.description}</p>
        ${choice.parents.length ? `<p>Pré-requisito: ${choice.parents.map((id) => mageNodes[id].name).join(' + ')}</p>` : ''}
        <button class="button primary" data-action="mage-train" ${reason ? 'disabled' : ''}>Aprender · 1 ponto</button>
        ${reason ? `<p>${reason}</p>` : ''}
      </section>
    </div>
  </section>`
}
