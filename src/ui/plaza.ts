import { className, heroArt } from '../content/classes'
import { levelFor, type Profile } from '../domain/profile'
import type { PlazaState, Visitor } from '../game/plaza'

export function plazaView(): string {
  return `<section class="view-width base-screen plaza-screen" aria-labelledby="plaza-title">
    <button class="back" data-action="camp">← &nbsp; Refúgio de Alvor</button>
    <header class="base-head"><div><span class="eyebrow">REFÚGIO DE ALVOR</span><h1 id="plaza-title">Praça de Alvor</h1></div>
      <span class="resource-chip" data-plaza-count>Visita local</span></header>
    <div class="plaza-layout">
      <div class="plaza-map panel">
        <button class="plaza-ground" data-action="plaza-move" aria-label="Mover na praça. Clique no chão ou use as setas."></button>
        <div data-plaza-avatars aria-hidden="true"></div>
      </div>
      <section class="panel detail-panel" aria-label="Jogadores na praça">
        <h2>Viajantes</h2>
        <p>Clique no chão ou use as setas para andar.</p>
        <p data-plaza-status role="status"></p>
        <button class="button primary" data-action="plaza-join">Entrar na praça online</button>
        <button class="small-button" data-action="plaza-leave" hidden>Sair da sessão online</button>
        <ul data-plaza-list class="plaza-travelers"></ul>
      </section>
    </div>
  </section>`
}

function avatar(entry: Visitor): HTMLElement {
  const node = document.createElement('span')
  node.className = 'plaza-avatar'
  node.dataset.visitor = entry.id
  const image = document.createElement('img')
  image.src = heroArt(entry.classId, entry.presentation)
  image.alt = ''
  const name = document.createElement('strong')
  name.textContent = entry.name
  node.append(image, name)
  return node
}

export function paintPlaza(view: HTMLElement, profile: Profile, state: PlazaState): void {
  const board = view.querySelector<HTMLElement>('[data-plaza-avatars]')!
  const count = view.querySelector('[data-plaza-count]')!
  const status = view.querySelector('[data-plaza-status]')!
  const joinButton = view.querySelector<HTMLButtonElement>('[data-action="plaza-join"]')!
  const leaveButton = view.querySelector<HTMLButtonElement>('[data-action="plaza-leave"]')!
  const list = view.querySelector('[data-plaza-list]')!
  const isOnline = state.phase === 'online'
  const local = { ...profile.hero, level: levelFor(profile.hero.xp), id: state.self || 'local', ...state.position }
  const visitors = [local, ...state.visitors.filter((entry) => entry.id !== state.self)]
  const existing = new Map([...board.querySelectorAll<HTMLElement>('[data-visitor]')].map((node) => [node.dataset.visitor, node]))
  for (const entry of visitors) {
    const node = existing.get(entry.id) ?? board.appendChild(avatar(entry))
    existing.delete(entry.id)
    node.style.left = `${entry.x * 100}%`
    node.style.top = `${entry.y * 100}%`
    node.style.zIndex = String(Math.round(entry.y * 1000))
    node.classList.toggle('self', entry.id === local.id)
  }
  for (const node of existing.values()) node.remove()
  const badge = isOnline ? `${visitors.length} ${visitors.length === 1 ? 'jogador na praça' : 'jogadores na praça'}` : 'Visita local'
  const notice = state.notice || (isOnline ? 'Sessão online ativa.' : 'Ao entrar online, seu herói fica visível aos jogadores desta praça.')
  if (count.textContent !== badge) count.textContent = badge
  if (status.textContent !== notice) status.textContent = notice
  joinButton.hidden = isOnline
  joinButton.disabled = state.phase === 'connecting'
  joinButton.textContent = state.phase === 'connecting' ? 'Conectando…' : 'Entrar na praça online'
  leaveButton.hidden = !isOnline
  const names = visitors.map((entry) => `${entry.name}${entry.id === local.id ? ' (você)' : ''} · ${className(entry.classId, entry.presentation)} · Nv. ${entry.level}`)
  const namesKey = JSON.stringify(names)
  if (list.getAttribute('data-names') !== namesKey) {
    list.replaceChildren(...names.map((name) => {
      const item = document.createElement('li')
      item.textContent = name
      return item
    }))
    list.setAttribute('data-names', namesKey)
  }
}
