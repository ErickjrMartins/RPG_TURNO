import { abyssSpecs, effectNames, encounters, items, type EncounterId, type Skill } from '../content/adventure'
import { regions, zone } from '../content/campaign'
import { mageIcon } from '../content/mage'
import { isZone } from '../domain/campaign'
import { relicSpec, stock, type StockId } from '../content/relics'
import { classes, heroArt } from '../content/classes'
import { abyssRounds, areaTargets, availableTargets, initiative, juraCost, shieldOf, skillBlocked, skillUsesMacula, type Battle, type Unit } from '../domain/battle'
import { type Profile } from '../domain/profile'
import { arenaCamera, arenaHeight, arenaWidth, pointFor } from '../game/layout'
import { safe, sigil } from './html'

export interface BattleDisplay {
  battle: Battle
  profile: Profile
  selected: Skill
  history: readonly string[]
  error: string
  speed: number
  skip: boolean
  paused: boolean
  saving: boolean
  overcharge: boolean
  opening: boolean
  arriving: boolean
}

function healthBar(unit: Unit, shield: number): string {
  const life = Math.max(0, Math.min(100, unit.hp / unit.maxHp * 100))
  const ward = Math.max(0, Math.min(100 - life, shield / unit.maxHp * 100))
  return `<span class="health" role="meter" aria-label="Vida de ${safe(unit.name)}" aria-valuemin="0" aria-valuemax="${unit.maxHp}" aria-valuenow="${unit.hp}"
      style="--hp:${life}%;--shield:${ward}%"><i></i>${shield ? '<em aria-hidden="true"></em>' : ''}</span>`
}

function unitLabel(unit: Unit, actionable: boolean, affected: boolean, aura: boolean): string {
  const point = pointFor(unit)
  const shield = shieldOf(unit)
  const effects = unit.effects.map((effect) => effectNames[effect.kind])
  const tag = actionable ? 'button' : 'div'
  const control = actionable ? `type="button" data-action="target" data-value="${unit.id}" aria-label="Selecionar alvo: ${safe(unit.name)}, ${unit.hp} de ${unit.maxHp} de vida"` : ''
  return `<${tag} ${control} class="unit-label ${unit.team} ${unit.hp === 0 ? 'fallen' : ''} ${actionable ? 'actionable' : ''} ${affected ? 'area-target' : ''} ${aura ? 'abyss-unit' : ''}"
      style="--lane:${(unit.slot % 3) - 1};--x:${point.x / arenaWidth * 100}%;--y:${point.y / arenaHeight * 100}%">
    <strong>${safe(unit.name)}</strong>
    ${healthBar(unit, shield)}
    <small>${unit.hp} / ${unit.maxHp}${shield > 0 ? ` · ${shield} escudo` : ''}</small>
    ${effects.length ? `<span class="condition">${effects.join(' · ')}</span>` : ''}
  </${tag}>`
}

export function battleView(display: BattleDisplay) {
  const { battle, profile, selected, speed, skip, paused, saving, error, history, overcharge, opening, arriving } = display
  const location = encounters[battle.attempt.encounter]
  const region = isZone(battle.attempt.encounter) ? zone(battle.attempt.encounter).region : 'fields'
  const canAct = battle.phase === 'player' && !paused && !saving && !arriving
  const selectedBlocked = skillBlocked(battle, selected)
  const targets = canAct && !selectedBlocked ? availableTargets(battle, selected) : []
  const ownClass = classes[profile.hero.classId]
  const ahead = battle.phase === 'player' ? initiative(battle).map((unit) => unit.name)
    : battle.queue.flatMap((id) => battle.units.find((unit) => unit.id === id && unit.hp > 0)?.name ?? [])
  const spec = abyssSpecs[battle.classId]
  const active = battle.abyss
  const hero = battle.units[0]!
  const cost = juraCost(battle, selected.id)
  const canJura = !skillUsesMacula(selected) && selected.cost > 0
  const canOvercharge = canAct && canJura && !selectedBlocked && hero.hp > cost && battle.corrosion < 3
  const area = selected.target === 'allies' || selected.target === 'enemies' || selected.target === 'row'
    ? new Set(targets.flatMap((entry) => areaTargets(battle, selected, entry).map((target) => target.id)))
    : new Set()
  const affectedByAbyss = (unit: Unit) => active && (active.classId === 'warrior'
    ? unit.team === 'allies'
    : active.classId === 'mage' ? unit.team === 'enemies' && (unit.slot >= 3) === active.rear : unit.id === active.target)
  const isGate = battle.attempt.encounter === 'gate'
  const heading = `
      <header class="battle-head">
        <div>
          <div class="eyebrow"><span></span> ${regions[region]}</div>
          <h1 id="battle-title">${location.name}</h1>
        </div>
        <div class="battle-tools">
          <button class="small-button" data-action="speed" aria-label="Velocidade ${speed} vezes">${speed}×</button>
          <button class="small-button" data-action="skip" aria-pressed="${skip}">Pular efeitos</button>
          ${battle.attempt.encounter === 'drill' ? '<button class="small-button" data-action="leave-drill">Encerrar treino</button>' : ''}
          <button class="small-button" data-action="pause" aria-pressed="${paused}">${paused ? 'Retomar' : 'Pausar'}</button>
        </div>
      </header>
      <p class="battle-brief">${paused ? 'Batalha pausada.' : battle.sealed ? 'Barreira do Núcleo ativa. Abra um Abismo Pessoal agora para quebrá-la.' : isGate && battle.reinforced ? 'O Guardião entrou na segunda fase. Atenção ao Corte do Véu.' : location.intro}</p>`
  const arenaClass = `arena-frame terrain-${region} ${isGate ? 'gate-arena' : ''} ${active ? `is-abyss abyss-${active.classId}` : ''} ${battle.units.length > 8 ? 'full-formation' : ''} ${arriving ? 'is-arriving' : ''}`
  const arenaStyle = `--abyss-tint:${spec.tint};--activation-zoom:${arenaCamera.activationZoom};--activation-duration:${360 / speed}ms`
  const arena = `
        <div class="arena-world ${opening && !skip ? 'abyss-opening' : ''}">
          <div class="arena-canvas" data-stage-slot aria-hidden="true"></div>
          ${battle.units.map((unit) => unitLabel(unit, targets.some((target) => target.id === unit.id), area.has(unit.id), Boolean(affectedByAbyss(unit)))).join('')}
        </div>
        <div class="arena-badges"><span>ALIANÇA DE ALVOR</span><span>RODADA ${battle.round}</span><span class="arena-enemy-badge">FORÇAS DO VÉU</span></div>
        ${active ? `<div class="abyss-banner" role="status"><b>${spec.name}</b><span>${active.rounds} ${active.rounds === 1 ? 'rodada restante' : 'rodadas restantes'}</span></div>` : ''}`
  const body = `
      <div class="combat-columns">
        <section class="panel command-panel" aria-label="Comandos de combate">
          <div class="hero-vitals">
            <img src="${heroArt(profile.hero.classId, profile.hero.presentation)}" alt="">
            <div><div class="vital-stats"><strong>${safe(hero.name)}</strong><span>Vida ${hero.hp}/${hero.maxHp}${shieldOf(hero) ? ` · Escudo ${shieldOf(hero)}` : ''}</span></div>
            ${healthBar(hero, shieldOf(hero))}</div>
          </div>
          <div class="command-heading">
            <h2>${canAct ? 'Sua vez' : paused ? 'Em pausa' : saving ? 'Salvando resultado' : arriving ? 'Entrada em cena' : 'Resolução'}</h2>
            <div class="energy" style="--energy:${battle.energy}%"><span>${ownClass.resource}</span><strong>${battle.energy} / 100</strong></div>
          </div>
          <div class="skill-list">
            ${battle.skills.map((skill, index) => {
              const blocked = skillBlocked(battle, skill)
              const art = battle.classId === 'mage' ? mageIcon(skill.id) : undefined
              return `<button class="skill ${skill.abyss ? 'ultimate-skill' : ''}" data-action="skill" data-value="${skill.id}" aria-pressed="${selected.id === skill.id}" aria-disabled="${!canAct || !!blocked}">
                <span class="skill-icon" aria-hidden="true">${art ? `<img src="${art}" alt="">` : skill.icon}</span><strong>${skill.name}</strong>
                <small>${blocked && canAct ? blocked : skill.cost ? `${skill.cost} ${skillUsesMacula(skill) ? 'Mácula' : ownClass.resource}` : 'Sem custo'} <kbd>${index + 1}</kbd></small>
              </button>`
            }).join('')}
          </div>
          <p class="skill-info">${selected.description}${selected.abyss ? ` Nível ${battle.abyssRank} · ${abyssRounds(battle)} rodadas.` : ''}</p>
          ${battle.jurasUnlocked ? `<div class="jura-controls">
            <span>Mácula <strong>${battle.macula}/100</strong></span>
            <span>Corrosão Interna <strong>${battle.corrosion}/3</strong></span>
            <button class="small-button" data-action="jura" aria-pressed="${overcharge}" ${!canOvercharge && !overcharge ? 'disabled' : ''}>Jura Profana</button>
            ${canJura ? `<small>+30% de potência · −${cost} Vida · +1 Corrosão (2 de dano por acúmulo no fim da rodada)</small>` : ''}
          </div>` : ''}
          <div class="target-list">
            ${canAct && !selectedBlocked ? `<span class="field-label">${selected.target === 'row' ? 'Escolha uma fileira' : selected.target === 'allies' ? 'Área aliada' : selected.target === 'lowest-ally' ? 'Aliado com menor porcentagem de Vida' : 'Escolha o alvo'}</span>${targets.map((target) => `<button class="small-button target" data-action="target" data-value="${target.id}">${selected.target === 'allies' ? (selected.abyss ? 'Abrir Abismo' : 'Toda a formação') : safe(target.name)}</button>`).join('')}` : ''}
          </div>
          <p class="form-error" role="status">${safe(error)}</p>
          ${error && (battle.phase === 'victory' || battle.phase === 'defeat') ? '<button class="small-button" data-action="save-result">Tentar salvar novamente</button>' : ''}
        </section>
        <aside class="panel battle-log" aria-label="Registro de combate">
          <h2>Registro</h2>
          <p class="turn-order"><b>Ordem</b> ${ahead.length ? ahead.slice(0, 4).map(safe).join(' → ') : 'Fim da rodada'}</p>
          <ol>${history.slice(-4).reverse().map((line) => `<li>${safe(line)}</li>`).join('')}</ol>
          <p class="visually-hidden" role="status">${safe(history.at(-1) ?? '')}</p>
        </aside>
      </div>`
  return { heading, arenaClass, arenaStyle, arena, body }
}

export function resultView(encounter: EncounterId, victory: boolean, profile: Profile, earnedGold: number, attemptId: number): string {
  const reward = encounters[encounter].reward
  const drill = encounter === 'drill'
  const last = victory && profile.campaign.last?.attempt === attemptId ? profile.campaign.last : null
  return `
    <section class="view-width camp result">
      <div class="panel camp-panel result-panel">
        <div class="result-sigil">${sigil}</div>
        <div class="eyebrow">${encounters[encounter].name}</div>
        <h1>${victory ? 'Vitória' : 'Derrota'}</h1>
        <p>${drill ? 'Exercício concluído. O treinamento está disponível para repetir.' : victory ? `A passagem está livre, ${safe(profile.hero.name)}. Seu progresso foi salvo.` : 'Sua formação recuou. Reagrupe-se e tente o encontro novamente.'}</p>
        ${victory && !drill ? `<ul class="rewards"><li><strong>+${reward.xp}</strong> XP</li><li><strong>+${earnedGold}</strong> Ouro</li><li><strong>+${reward.supplies}</strong> Provisões</li>${reward.itemId ? `<li><strong>${items[reward.itemId].name}</strong></li>` : ''}</ul>` : ''}
        ${last ? `<p>${last.stars}/3 estrelas${last.first && last.zone !== 'nest' ? ' · Primeira Purificação' : ''}</p><ul class="expedition-loot">${last.spoils.map((entry) => {
          const material = (Object.keys(entry.rewards) as StockId[]).map((id) => `${entry.rewards[id]} ${stock[id].name}`)
          if (entry.relic) material.push(relicSpec(entry.relic).name)
          return `<li><b>${entry.seat === 1 ? 'Seu espólio' : `Aliado local ${entry.seat}`}</b><span>${material.join(' · ')}</span></li>`
        }).join('')}</ul>` : ''}
        <div class="title-actions">
          <button class="button primary" data-action="${victory ? 'camp' : 'retry'}">${victory ? 'Seguir para Alvor' : 'Tentar novamente'} <span aria-hidden="true">→</span></button>
          ${drill && victory ? '<button class="button secondary" data-action="retry">Treinar novamente</button>' : victory ? '' : '<button class="button secondary" data-action="return-from-defeat">Recuar</button>'}
        </div>
      </div>
    </section>`
}
