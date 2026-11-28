import { baseName } from '../content/city'
import { coutureCost, loginRewards, packs, rechargeGoals, seasonCost, spinCost, spinPity, spinRate, threadCost } from '../content/events'
import { stock, type StockId } from '../content/relics'
import { appearance, appearanceIds, styleSets, styleSlots, styleSlotsIds, type StyleSlot } from '../content/wardrobe'
import { heroArt } from '../content/classes'
import { currentEvents } from '../domain/events'
import type { Profile } from '../domain/profile'
import { styleBonuses, type Wardrobe } from '../domain/wardrobe'
import { safe } from './html'

export function styledHero(profile: Profile): string {
  const { hero, wardrobe } = profile
  return `<div class="styled-hero">
    <img src="${heroArt(hero.classId, hero.presentation)}" alt="">
    ${Object.entries(wardrobe.looks).map(([slot, id]) => `<span class="hero-style ${slot}" style="--style-tint:${appearance(id).color}" aria-hidden="true"></span>`).join('')}
  </div>`
}

const setCount = (wardrobe: Wardrobe, set: keyof typeof styleSets) => Object.values(wardrobe.stats).filter((id) => appearance(id).set === set).length

export function wardrobeView(profile: Profile, slot: StyleSlot, error: string): string {
  const { wardrobe, hero } = profile
  const events = currentEvents(profile.events, Date.now())
  const bonus = styleBonuses(wardrobe)
  return `<section class="view-width base-screen">
    <button class="back" data-action="camp">← &nbsp; ${baseName}</button>
    <div class="base-head"><div><div class="eyebrow"><span></span> APARÊNCIA</div><h1>Indumentárias de Clã</h1></div>
      <span class="resource-chip">${profile.relicary.stock['profaned-thread'] ?? 0} Fios Profanos · ${events.cash} Cash simulado</span></div>
    <p class="form-error" role="status">${safe(error)}</p>
    <div class="relic-layout">
      <section class="panel relic-character">
        ${styledHero(profile)}
        <h2>${safe(hero.name)}</h2>
        <p>Grimório de Estilo · ${wardrobe.unlocked.length}/${appearanceIds.length} aparências</p>
        <p>A cada 4 desbloqueios, +2 Vida. Bônus atual: +${Math.floor(wardrobe.unlocked.length / 4) * 2} Vida.</p>
        <p>Equipado: +${bonus.hp} Vida, +${bonus.power} Ataque, +${bonus.defense} Defesa${bonus.energy ? `, +${bonus.energy} recurso inicial` : ''}.</p>
        <div class="detail-actions style-nav"><button class="small-button" data-action="relicary">Relicário</button><button class="small-button" data-action="events">Eventos</button></div>
      </section>
      <section class="panel detail-panel">
        <div class="inventory-filters" aria-label="Slots de indumentária">${styleSlotsIds.map((id) => `<button class="small-button" data-action="style-slot" data-value="${id}" aria-pressed="${id === slot}">${styleSlots[id]}</button>`).join('')}</div>
        ${appearanceIds.filter((id) => appearance(id).slot === slot).map((id) => {
          const item = appearance(id)
          const owned = wardrobe.unlocked.includes(id)
          const look = wardrobe.looks[slot] === id
          const stats = wardrobe.stats[slot] === id
          const paidWatch = item.set === 'watch' && (item.slot === 'projection' || item.slot === 'aura')
          const route = item.set === 'purge' ? `${threadCost} Fios Profanos`
            : item.set === 'watch' ? `${paidWatch ? 'Trilha de temporada' : 'Trilha gratuita'} · Posto da Quarentena`
            : item.slot === 'aura' ? 'Roleta do Altar Selado' : `${coutureCost} Cash simulado`
          return `<article class="style-card" style="--wardrobe-color:${item.color}">
            <div class="eyebrow">${styleSets[item.set].name} · ${setCount(wardrobe, item.set)}/4</div>
            <h3>${item.name}</h3>
            <p>${item.stats.hp ? `+${item.stats.hp} Vida` : item.stats.power ? `+${item.stats.power} Ataque` : `+${item.stats.defense} Defesa`} · conjunto 4/4: +3 recurso no início do combate.</p>
            <div class="detail-actions">
              ${owned ? `<button class="small-button" data-action="style-look" data-value="${id}" aria-pressed="${look}">${look ? 'Remover visual' : 'Usar visual'}</button>
                <button class="small-button" data-action="style-stats" data-value="${id}" aria-pressed="${stats}">${stats ? 'Remover atributos' : 'Usar atributos'}</button>`
                : item.set === 'nocturne' && slot === 'aura' ? '<button class="small-button" data-action="events">Ver Roleta</button>' : `<button class="small-button" data-action="style-earn" data-value="${id}">Desbloquear · ${route}</button>`}
            </div>
          </article>`
        }).join('')}
        ${events.season ? '<p>Trilha de Temporada ativa nesta semana.</p>' : `<button class="small-button" data-action="season">Ativar trilha simulada · ${seasonCost} Cash</button>`}
      </section>
    </div>
  </section>`
}

function rewardLine(reward: Partial<Record<StockId, number>>): string {
  return (Object.keys(reward) as StockId[]).map((id) => `${reward[id]} ${stock[id].name}`).join(' · ')
}

export function eventsView(profile: Profile, error: string, receiptChecked: boolean): string {
  const events = currentEvents(profile.events, Date.now())
  const claimedToday = events.signIns.includes(events.day)
  const next = loginRewards[events.day]
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  return `<section class="view-width base-screen">
    <button class="back" data-action="camp">← &nbsp; ${baseName}</button>
    <div class="base-head"><div><div class="eyebrow"><span></span> CICLO DE SETE DIAS</div><h1>Eventos</h1></div>
      <span class="resource-chip">${events.cash} Cash simulado · ${profile.relicary.stock['profaned-thread'] ?? 0} Fios Profanos</span></div>
    <p class="form-error" role="status">${safe(error)}</p>
    <section class="panel detail-panel">
      <h2>Calendário de Login</h2>
      <div class="login-grid">${loginRewards.map((reward, index) => {
        const day = index + 1
        const taken = events.signIns.includes(day)
        return `<article class="login-day ${events.day === day ? 'current' : ''}">
          <b>Dia ${day}</b><span>${rewardLine(reward)}${day === 7 ? ' · Manifestação da Vigília' : ''}</span>
          <small>${taken ? 'Resgatado' : events.day === day ? 'Disponível' : events.day > day ? 'Encerrado' : 'Em breve'}</small>
        </article>`
      }).join('')}</div>
      <div class="detail-actions"><button class="button primary" data-action="login-claim" ${claimedToday ? 'disabled' : ''}>${claimedToday ? 'Dia resgatado' : 'Resgatar hoje'}</button>
        ${next ? `<p>Próxima recompensa: ${rewardLine(next)}${events.day === 6 ? ' · Manifestação da Vigília' : ''}.</p>` : ''}</div>
    </section>
    <div class="base-tools">
      <section class="panel detail-panel">
        <h2>Colheita de Mácula</h2>
        <p>Cada expedição concluída rende 2 Fios Profanos e 1 giro gratuito. Troque os Fios por Trajes de Expurgo.</p>
        <button class="small-button" data-action="wardrobe">Ver Indumentárias</button>
        <h3>Roleta do Altar Selado</h3>
        <p>${spinRate * 100}% de chance de Manifestação. Garantia no ${spinPity}º giro sem Manifestação dentro do ciclo.</p>
        <p>Garantia ${events.pity}/${spinPity} · ${events.freeSpins} giros gratuitos</p>
        ${events.lastSpin ? `<p role="status">${events.lastSpin === 'aura' ? 'Manifestação do Altar desbloqueada.' : 'O giro concedeu Fios Profanos.'}</p>` : ''}
        <button class="button primary" data-action="spin" ${events.freeSpins === 0 && events.cash < spinCost ? 'disabled' : ''}>Girar · ${events.freeSpins ? 'grátis' : `${spinCost} Cash simulado`}</button>
      </section>
      <section class="panel detail-panel">
        <div class="eyebrow">SIMULAÇÃO LOCAL</div><h2>Cash e Prêmios de Recarga</h2>
        ${Object.entries(packs).map(([id, pack]) => `<div class="management-row"><div><strong>${pack.label}</strong><span>${pack.cash} Cash · ${brl.format(pack.price / 100)} simulados</span></div>
          <button class="small-button" data-action="recharge" data-value="${id}">Simular recarga</button></div>`).join('')}
        ${receiptChecked ? '<p role="status">Recibo já contabilizado. Saldo preservado.</p>' : ''}
        ${events.receipts.length ? '<button class="small-button" data-action="recharge-replay">Verificar último recibo</button>' : ''}
        <h3>Metas da semana</h3><p>${events.recharged} Cash acumulado.</p>
        ${rechargeGoals.map((goal, index) => `<div class="management-row"><div><strong>${goal.amount} Cash</strong><span>${rewardLine(goal.reward)}</span></div>
          <button class="small-button" data-action="recharge-claim" data-value="${index}" ${events.goals.includes(index) || events.recharged < goal.amount ? 'disabled' : ''}>${events.goals.includes(index) ? 'Resgatado' : events.recharged >= goal.amount ? 'Resgatar bônus' : 'Meta pendente'}</button></div>`).join('')}
      </section>
    </div>
  </section>`
}
