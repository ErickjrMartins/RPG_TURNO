import { encounters } from '../content/adventure'
import { baseName } from '../content/city'
import { coreExchange, dailyEnergy, regions, zones, zonesIds, type Region } from '../content/campaign'
import { stock } from '../content/relics'
import { energyLeft, zoneUnlocked } from '../domain/campaign'
import type { Profile } from '../domain/profile'
import { safe } from './html'

export function missionsView(profile: Profile, challenge: boolean, size: number, error: string): string {
  const energy = energyLeft(profile.campaign, Date.now())
  const { stock: bag } = profile.relicary
  return `<section class="view-width base-screen" aria-labelledby="mission-title">
    <button class="back" data-action="camp">← &nbsp; ${baseName}</button>
    <div class="base-head"><div><div class="eyebrow"><span></span> DISTRITO INTERDITADO</div><h1 id="mission-title">Expedições</h1></div>
      <span class="resource-chip">Energia diária ${energy}/${dailyEnergy} · ${bag.marks ?? 0} Marcas de Expurgo</span></div>
    <p class="form-error" role="status">${safe(error)}</p>
    <section class="panel detail-panel">
      <h2>Zonas de Quarentena</h2>
      <div class="detail-actions"><button class="small-button" data-action="challenge" aria-pressed="${challenge}">Romper Selo</button>
        <p>Calamidade Desperta: inimigos causam 35% a mais de dano. Dobra as Marcas e aumenta a chance de núcleos completos.</p>
        ${bag.energy ? `<button class="small-button" data-action="energy" ${energy >= dailyEnergy ? 'disabled' : ''}>Usar Frasco de Energia · ${bag.energy}</button>` : ''}</div>
      ${(Object.keys(regions) as Region[]).map((region) => `<div class="region-chapter terrain-${region}">
      <h3>${regions[region]}</h3><div class="chapter-grid">${zonesIds.filter((id) => id !== 'nest' && zones[id].region === region).map((id) => {
        const spec = zones[id]
        const current = profile.campaign.zones[id]
        const open = zoneUnlocked(profile, id)
        const next = encounters[spec.prerequisite].name
        return `<article class="chapter">
          <div class="eyebrow">${current ? `${current.stars}/3 estrelas · ${current.clears} conclusões` : 'SOLO'}</div>
          <h4>${spec.name}</h4><p>${spec.intro}</p>
          <p>Nota máxima: até ${spec.ratingRounds} rodadas, todos os aliados vivos e até 1 Corrosão.</p>
          <p>${current ? 'Primeira Purificação resgatada.' : 'Primeira Purificação: +3 Icor e 1 Núcleo de Maldição.'}</p>
          <div class="detail-actions">
            <button class="small-button" data-action="expedition" data-value="${id}" ${open ? '' : 'disabled'}>${open ? 'Iniciar capítulo' : `Requer ${next}`}</button>
            <button class="small-button" data-action="sweep" data-value="${id}" ${current?.stars === 3 && energy ? '' : 'disabled'}>Varredura · 1 energia</button>
          </div>
        </article>`
      }).join('')}</div></div>`).join('')}
    </section>
    <div class="base-tools">
      <section class="panel detail-panel">
        <div class="eyebrow">PROTÓTIPO LOCAL</div><h2>Ninhos de Calamidade</h2>
        <p>O herói lidera aliados controlados pelo jogo em uma equipe de 2 a 4 participantes. Cada posição tem seu próprio espólio. O núcleo anuncia quando um Abismo pode partir sua barreira.</p>
        <div class="detail-actions" aria-label="Tamanho da equipe">${[2, 3, 4].map((number) => `<button class="small-button" data-action="nest-size" data-value="${number}" aria-pressed="${size === number}">${number} participantes</button>`).join('')}</div>
        <button class="button primary" data-action="expedition" data-value="nest" ${zoneUnlocked(profile, 'nest') ? '' : 'disabled'}>${zoneUnlocked(profile, 'nest') ? `Entrar no ${zones.nest.name}` : `Requer ${zones.watch.name}`}</button>
      </section>
      <section class="panel detail-panel">
        <h2>Altar de Trocas</h2>
        <p>${profile.campaign.zones.nest?.clears ? 'Escolha o núcleo para sua linhagem.' : 'Purifique o Ninho para abrir o Altar.'}</p>
        <div class="detail-actions">${(['pest', 'void'] as const).map((id) => `<button class="small-button" data-action="core" data-value="${id}" ${(bag.marks ?? 0) >= coreExchange && profile.campaign.zones.nest?.clears ? '' : 'disabled'}>${stock[`core-${id}`].name} · ${coreExchange} Marcas</button>`).join('')}</div>
      </section>
    </div>
  </section>`
}
