import { assetUrl, combatantArt } from '../assets'
import { effectNames, type EffectKind } from '../content/adventure'
import { bosses } from '../content/bosses'
import type { Battle, BattleEvent } from '../domain/battle'
import { safe } from './html'

const defeatDuration = 720
const effectArt: Record<EffectKind, string> = {
  shield: 'arcana-seal', marked: 'arcana-focus', weakened: 'arcana-tear', burning: 'arcana-spark', mending: 'arcana-renew',
}

export function bossHudState(battle: Battle) {
  const unit = battle.units.find((entry) => entry.boss && entry.team === 'enemies')
  if (!unit?.boss) return
  const spec = bosses[unit.boss]
  const layers = Math.ceil(unit.hp * spec.layers / unit.maxHp)
  const fill = layers > 0 ? (unit.hp * spec.layers - (layers - 1) * unit.maxHp) / unit.maxHp : 0
  const secondPhase = spec.change === 'reinforced' ? battle.reinforced
    : spec.change === 'barrier-broken' ? !battle.sealed : layers <= 1
  return { unit, spec, layers, fill, phase: spec.phases[Number(secondPhase)]!, critical: unit.hp > 0 && unit.hp / unit.maxHp <= 0.15 }
}

type HudState = NonNullable<ReturnType<typeof bossHudState>>

const chain = `<span class="boss-chain" aria-hidden="true">${Array.from({ length: 13 }, (_, index) => {
  const x = (index - 6) / 6
  return `<i style="--sag:${(1 - x * x) * 12}px;--twist:${-x * 28}deg"></i>`
}).join('')}</span>`

function markup({ unit, spec }: HudState): string {
  return `<section class="boss-hud" data-boss="${unit.boss}" data-ornament="${spec.ornament}" data-particles="${spec.particles}" aria-label="Chefe: ${safe(unit.name)}">
    <div class="boss-nameplate">
      ${chain}
      <h2>${safe(unit.name)}</h2>
      <p class="boss-phase"></p>
    </div>
    <div class="boss-layer" aria-hidden="true"><i>${spec.rune}</i><strong data-boss-layers></strong><i>${spec.rune}</i></div>
    <div class="boss-rail">
      <img class="boss-thorns" src="${assetUrl('boss-thorns.webp')}" alt="">
      <div class="boss-track" role="meter" aria-label="Vida de ${safe(unit.name)}" aria-valuemin="0" aria-valuemax="${unit.maxHp}" aria-valuenow="${unit.hp}">
        <span class="boss-residual" aria-hidden="true"></span>
        <span class="boss-energy" aria-hidden="true"><i></i><b></b></span>
        <span class="boss-flash" aria-hidden="true"></span>
        <strong class="boss-hp" aria-hidden="true"></strong>
      </div>
    </div>
    <div class="boss-portrait">
      <img class="boss-face" src="${combatantArt(`portrait-${unit.art}`)}" alt="">
      <img class="boss-rim" src="${assetUrl('boss-medallion.webp')}" alt="">
      <span class="boss-level"><small aria-hidden="true">NV</small><span class="visually-hidden">Nível </span>${spec.level}</span>
    </div>
    <ul class="boss-effects" aria-label="Efeitos e habilidades do chefe" hidden></ul>
  </section>`
}

interface MountedHud {
  el: HTMLElement
  meter: HTMLElement
  hp: HTMLElement
  layers: HTMLElement
  phase: HTMLElement
  effects: HTMLUListElement
  flash: HTMLElement
}

function mount(slot: HTMLElement, state: HudState): MountedHud {
  slot.innerHTML = markup(state)
  const el = slot.querySelector<HTMLElement>('.boss-hud')!
  el.addEventListener('animationend', (event) => {
    if (event.target !== el) return
    if (event.animationName === 'boss-enter') el.classList.remove('enter')
    if (event.animationName === 'boss-dissolve') el.hidden = true
  })
  return {
    el,
    meter: slot.querySelector<HTMLElement>('.boss-track')!,
    hp: slot.querySelector<HTMLElement>('.boss-hp')!,
    layers: slot.querySelector<HTMLElement>('[data-boss-layers]')!,
    phase: slot.querySelector<HTMLElement>('.boss-phase')!,
    effects: slot.querySelector<HTMLUListElement>('.boss-effects')!,
    flash: slot.querySelector<HTMLElement>('.boss-flash')!,
  }
}

function effectChip(kind: 'buff' | 'debuff' | 'ability', icon: string, name: string, rounds?: number) {
  const unit = rounds === 1 ? 'rodada' : 'rodadas'
  const duration = rounds === undefined ? '' : ` · ${rounds} ${unit}`
  return `<li class="boss-effect ${kind}" title="${safe(name + duration)}"><span aria-hidden="true">${icon}</span><span>${safe(name)}</span>${rounds === undefined ? '' : `<small>${rounds}<span class="visually-hidden"> ${unit}</span></small>`}</li>`
}

export class BossHud {
  private mounted?: MountedHud
  private key?: string
  private previous?: HudState
  private ability?: string
  private effects = ''
  private flash?: Animation
  private defeatUntil = 0

  get exitDelay(): number { return Math.max(0, this.defeatUntil - performance.now()) }

  clear(): void {
    this.flash?.cancel()
    this.mounted = undefined
    this.key = undefined
    this.previous = undefined
    this.ability = undefined
    this.effects = ''
    this.defeatUntil = 0
  }

  paint(slot: HTMLElement, battle: Battle, events: readonly BattleEvent[], motion: boolean, paused: boolean, speed: number): void {
    const state = bossHudState(battle)
    if (!state) {
      this.clear()
      slot.replaceChildren()
      return
    }
    const { unit, spec, phase, critical, layers, fill } = state
    const key = `${battle.attempt.id}:${unit.id}`
    if (this.key !== key || this.mounted?.el.parentElement !== slot) {
      this.clear()
      this.key = key
      this.mounted = mount(slot, state)
    }
    const { el, meter, hp, layers: counter, phase: label, effects, flash } = this.mounted!
    const previous = this.previous
    const newLayer = previous !== undefined && previous.layers !== layers && unit.hp > 0
    const defeated = unit.hp <= 0

    el.classList.toggle('motion', motion)
    el.classList.toggle('paused', paused)
    el.classList.toggle('critical', critical)
    el.classList.toggle('reset-layer', newLayer)
    if (!previous && motion && !defeated) el.classList.add('enter')
    if (!motion) el.classList.remove('enter', 'dissolve')
    el.style.setProperty('--boss-speed', String(speed))
    if (!previous || previous.phase !== phase) {
      el.style.setProperty('--boss-metal', spec.metal)
      el.style.setProperty('--boss-energy', phase.energy[0])
      el.style.setProperty('--boss-light', phase.energy[1])
      label.textContent = phase.name
    }
    if (!previous || previous.unit.hp !== unit.hp || previous.unit.maxHp !== unit.maxHp) {
      el.style.setProperty('--boss-fill', String(fill))
      meter.setAttribute('aria-valuemax', String(unit.maxHp))
      meter.setAttribute('aria-valuenow', String(unit.hp))
      const layerLabel = layers === 1 ? '1 camada restante' : `${layers} camadas restantes`
      meter.setAttribute('aria-valuetext', `${unit.hp} de ${unit.maxHp} de vida · ${layerLabel}`)
      hp.textContent = `${unit.hp} / ${unit.maxHp}`
      counter.textContent = `×${layers}`
    }
    if (!motion) this.flash?.cancel()
    if (motion && previous && (layers < previous.layers || previous.phase !== phase) && !defeated) {
      this.flash?.cancel()
      this.flash = flash.animate([{ opacity: 0.87 }, { opacity: 0 }], { duration: 480 / speed, easing: 'ease-out' })
    }

    if (events.length) this.ability = events.find((event) => event.kind === 'action' && event.actor === unit.id)?.ability
    const chips = defeated ? '' : [
      ...unit.effects.map(({ kind, rounds }) => effectChip(kind === 'shield' || kind === 'mending' ? 'buff' : 'debuff',
        `<img src="${assetUrl(`${effectArt[kind]}.webp`)}" alt="">`, effectNames[kind], rounds)),
      ...(battle.sealed ? [effectChip('buff', '⬢', 'Barreira do Núcleo')] : []),
      ...(this.ability ? [effectChip('ability', '✦', this.ability)] : []),
    ].join('')
    if (chips !== this.effects) {
      this.effects = chips
      effects.innerHTML = chips
      effects.hidden = !chips
    }
    if (defeated && !el.classList.contains('defeated')) {
      this.defeatUntil = motion && previous ? performance.now() + defeatDuration / speed : 0
      el.classList.toggle('dissolve', this.defeatUntil > 0)
      el.classList.add('defeated')
    }
    if (!motion) this.defeatUntil = 0
    this.previous = state
  }
}
