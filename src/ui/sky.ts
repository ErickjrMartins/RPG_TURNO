import { assetUrl, combatantArt } from '../assets'
import { encounters } from '../content/adventure'
import { boundCurses, boundCurseIds, type BoundCurseId } from '../content/bindings'
import { baseName } from '../content/city'
import { heroArt } from '../content/classes'
import { bindingAttributes, bindingRank, bindingRankExperience, bindingRankLimit, curseUnlocked } from '../domain/bindings'
import type { Profile } from '../domain/profile'
import { skyGround, type Position } from '../game/plaza-ground'
import { safe } from './html'

export const skyPortal = { x: 0.78, y: 0.62 }
export const skySpawn = { x: 0.45, y: 0.71 }

export interface SkyState {
  position: Position
  step: boolean
  showBindings: boolean
}

export function skyPortalNear(position: Position): boolean {
  return Math.hypot(position.x - skyPortal.x, (position.y - skyPortal.y) * 0.8) <= 0.086
}

function curseCard(profile: Profile, id: BoundCurseId): string {
  const { name, role, technique, cadence, unlock } = boundCurses[id]
  const available = curseUnlocked(profile.completed, id)
  const active = profile.bindings.active === id
  const rank = bindingRank(profile.bindings, id)
  const xp = (profile.bindings.experience[id] ?? 0) % bindingRankExperience
  const stats = bindingAttributes(id, rank)
  return `<article class="binding-card${active ? ' binding-active' : ''}">
    <div class="binding-art"><img src="${combatantArt(id)}" alt=""></div>
    <div class="binding-info">
      <span class="eyebrow">${role}</span>
      <h3>${name}</h3>
      <p><strong>${technique.name}</strong> · A cada ${cadence} rodadas, a partir da primeira.</p>
      <p>${technique.description}</p>
      ${available ? `<dl class="binding-stats"><div><dt>Vida</dt><dd>${stats.hp}</dd></div><div><dt>Poder</dt><dd>${stats.power}</dd></div><div><dt>Defesa</dt><dd>${stats.defense}</dd></div></dl>
        <div class="binding-progress"><strong>Nível ${rank}</strong>
          ${rank < bindingRankLimit ? `<progress value="${xp}" max="${bindingRankExperience}" aria-label="Experiência de ${name}"></progress><small>${xp} / ${bindingRankExperience} XP</small>` : '<small>Nível máximo</small>'}
        </div>
        <button class="button ${active ? 'secondary' : 'primary'}" data-action="sky-bind" data-value="${active ? 'release' : id}">${active ? 'Dispensar' : 'Vincular'} ${name}</button>`
        : `<p class="binding-locked">Desbloqueio após vencer ${encounters[unlock].name}.</p>`}
    </div>
  </article>`
}

export function skyView(profile: Profile, state: SkyState, error: string): string {
  const { active } = profile.bindings
  const background = new URL(assetUrl('reino-dos-ceus.webp'), document.baseURI).href
  return `<section class="view-width base-screen sky-screen" aria-labelledby="sky-title">
    <button class="back" data-action="camp">← &nbsp; ${baseName}</button>
    <header class="base-head"><div><span class="eyebrow">Alvor</span><h1 id="sky-title">Reino dos Céus</h1></div></header>
    <div class="sky-map plaza-map panel" style="--sky-art:url('${background}')">
      <button class="plaza-ground" data-action="sky-move" aria-label="Andar pelo Reino dos Céus. Toque no piso ou use WASD e setas."></button>
      <button class="small-button sky-portal" data-action="sky-portal" style="--portal-x:${skyPortal.x * 100}%;--portal-y:${skyPortal.y * 100}%">Portal de Caça</button>
      <span class="plaza-avatar sky-actor sky-hero" aria-hidden="true"><strong>${safe(profile.hero.name)}</strong><img src="${heroArt(profile.hero.classId, profile.hero.presentation)}" alt=""></span>
      ${active ? `<span class="plaza-avatar sky-actor sky-familiar" aria-hidden="true"><strong>${boundCurses[active].name}</strong><img src="${combatantArt(active)}" alt=""></span>` : ''}
    </div>
    <nav class="sky-actions" aria-label="Atalhos do Reino dos Céus">
      <button class="button secondary" data-action="relicary"><img src="${assetUrl('sky-bag.webp')}" alt=""><span>Bolsa</span></button>
      <button class="button secondary" data-action="sky-step" aria-pressed="false"><img src="${assetUrl('arcana-void.webp')}" alt=""><span>Passo de Fenda</span></button>
      <button class="button secondary" data-action="sky-bonds" aria-controls="sky-binds" aria-expanded="${state.showBindings}"><img src="${assetUrl('sky-binding.webp')}" alt=""><span>Maldições</span></button>
    </nav>
    <p class="sky-hint" data-sky-hint role="status"></p>
    <section class="panel sky-binds" id="sky-binds" ${state.showBindings ? '' : 'hidden'} aria-labelledby="sky-bind-title">
      <h2 id="sky-bind-title">Vínculos de Mácula</h2>
      <p>Escolha uma maldição para acompanhar seu herói. Ela age na própria vez e ganha experiência em vitórias de campanha.</p>
      <p class="form-error" role="status">${safe(error)}</p>
      <div class="binding-grid">${boundCurseIds.map((id) => curseCard(profile, id)).join('')}</div>
    </section>
  </section>`
}

function positionActor(actor: HTMLElement, position: Position): void {
  actor.style.left = `${position.x * 100}%`
  actor.style.top = `${position.y * 100}%`
  actor.style.zIndex = String(5 + Math.round(position.y * 100))
}

export function paintSky(view: HTMLElement, state: SkyState, dash = false): void {
  const map = view.querySelector<HTMLElement>('.sky-map')!
  const hero = map.querySelector<HTMLElement>('.sky-hero')!
  const familiar = map.querySelector<HTMLElement>('.sky-familiar')
  const step = view.querySelector<HTMLButtonElement>('[data-action="sky-step"]')!
  const portal = map.querySelector<HTMLButtonElement>('[data-action="sky-portal"]')!
  const near = skyPortalNear(state.position)
  map.classList.toggle('sky-step-on', state.step)
  step.setAttribute('aria-pressed', String(state.step))
  portal.classList.toggle('sky-portal-close', near)
  portal.textContent = near ? 'Entrar no Portal' : 'Portal de Caça'
  const hint = view.querySelector<HTMLElement>('[data-sky-hint]')!
  const text = state.step ? 'Passo de Fenda ativo. Seus deslocamentos percorrem o piso em um lampejo.'
    : 'Toque no piso ou use WASD e as setas. Aproxime-se do portal para entrar.'
  if (hint.textContent !== text) hint.textContent = text
  positionActor(hero, state.position)
  if (familiar) positionActor(familiar, skyGround(state.position.x - 0.054, state.position.y + 0.021))
  if (dash && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const image = hero.querySelector('img')!
    for (const animation of image.getAnimations()) animation.cancel()
    image.animate([{ opacity: 0.27, filter: 'blur(2px) brightness(2)' }, { opacity: 1, filter: 'none' }], { duration: 210 })
  }
}
