import { classIds, classes, className, heroArt, type ClassId, type Presentation } from '../content/classes'
import { levelFor, type Profile } from '../domain/profile'
import { safe, sigil } from './html'

export function titleView(profile: Profile | null, error: string): string {
  return `
    <section class="title-view" aria-labelledby="main-title">
      <div class="title-orbit" aria-hidden="true"><span></span></div>
      <div class="view-width title-content">
        <div class="eyebrow"><span></span> CRÔNICAS DO VÉU</div>
        <h1 id="main-title"><span>Reinos da</span> Aurora</h1>
        <p class="title-copy">O Farol Celestial caiu. Reúna seus aliados, atravesse o Véu e reacenda a luz de Alvor.</p>
        <div class="title-actions">
          <button class="button primary" data-action="new">Novo jogo <span aria-hidden="true">→</span></button>
          ${profile ? '<button class="button secondary" data-action="continue">Continuar <span aria-hidden="true">→</span></button>' : ''}
        </div>
        ${profile ? `<p class="save-note">◇ &nbsp; ${safe(profile.hero.name)} · Nível ${levelFor(profile.hero.xp)}</p>` : ''}
        <p class="form-error" role="status">${safe(error)}</p>
      </div>
      <div class="view-width title-region">
        <div class="region-icon" aria-hidden="true">✧</div>
        <div>
          <span class="eyebrow">PRIMEIRA CAMPANHA</span>
          <h2>Campos de Alvor</h2>
        </div>
        <span class="region-mode"><span></span> Campanha local</span>
      </div>
    </section>`
}

interface Draft {
  classId: ClassId
  presentation: Presentation
  name: string
}

export function createView(draft: Draft, error: string, busy: boolean): string {
  const heroClass = classes[draft.classId]
  return `
    <section class="view-width creation" aria-labelledby="create-title">
      <div class="creator panel">
        <button class="back" data-action="title">← &nbsp; Voltar</button>
        <div class="eyebrow"><span></span> NOVO JOGO</div>
        <h1 id="create-title">Crie seu herói</h1>
        <form id="create-hero">
          <label class="field-label" for="hero-name">Nome do herói</label>
          <input id="hero-name" name="hero-name" placeholder="Como Alvor vai chamar você?" minlength="2" maxlength="24" required value="${safe(draft.name)}" />
          <fieldset>
            <legend class="field-label">Classe</legend>
            <div class="class-list">
              ${classIds.map((id) => {
                const item = classes[id]
                return `<button type="button" class="class-choice" style="--choice:${item.color}" data-action="class" data-value="${id}" aria-pressed="${draft.classId === id}"><span aria-hidden="true">${item.icon}</span><strong>${item.name}</strong></button>`
              }).join('')}
            </div>
          </fieldset>
          <fieldset>
            <legend class="field-label">Aparência</legend>
            <div class="segmented">
              <button type="button" data-action="presentation" data-value="masculine" aria-pressed="${draft.presentation === 'masculine'}">Masculina</button>
              <button type="button" data-action="presentation" data-value="feminine" aria-pressed="${draft.presentation === 'feminine'}">Feminina</button>
            </div>
          </fieldset>
          <p class="form-error" role="status">${safe(error)}</p>
          <button class="button primary create-button" type="submit" ${busy ? 'disabled' : ''}>
            ${busy ? 'Salvando…' : 'Começar aventura'} <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
      <div class="character-stage" style="--choice:${heroClass.color}">
        <div class="character-circle" aria-hidden="true">${sigil}</div>
        <img class="character-art" src="${heroArt(draft.classId, draft.presentation)}" alt="" />
        <div class="character-description">
          <span class="eyebrow">${heroClass.role}</span>
          <h2>${className(draft.classId, draft.presentation)}</h2>
          <p>${heroClass.description}</p>
          <div class="attribute-list"><span><b>${heroClass.attributes.hp}</b> Vida</span><span><b>${heroClass.attributes.power}</b> Poder</span><span>${heroClass.resource}</span></div>
        </div>
      </div>
    </section>`
}

