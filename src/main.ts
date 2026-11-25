import { Plaza } from './game/plaza'
import { paintPlaza, plazaView } from './ui/plaza'
import { type MageNodeId } from './content/mage'
import { isMageNode, resetMageTree, toggleMageSlot, trainMageNode } from './domain/mage'
import { mageView } from './ui/mage'
import '@fontsource-variable/cinzel'
import '@fontsource-variable/dm-sans'
import './style.css'
import { skillsByClass, type EncounterId } from './content/adventure'
import { classIds, type ClassId, type Presentation } from './content/classes'
import { styleSlotsIds, type StyleSlot } from './content/wardrobe'
import type { BuildingId } from './content/city'
import { advanceBattle, playerAction, skillBlocked, startBattle, type Battle, type BattleEvent } from './domain/battle'
import { exchangeCore, isZone, redeemEnergy, sweepZone } from './domain/campaign'
import { claimLogin, claimRecharge, earnAppearance, isPack, openSeason, simulateRecharge, spinAltar } from './domain/events'
import { isAppearance, wearAppearance } from './domain/wardrobe'
import { harvestFarm, improveBuilding, isBuildingId, updateCity } from './domain/city'
import { equip, hire, levelFor, isTroop, moveRecruit, newProfile, settleAttempt, startAttempt, trainRecruit, type Profile } from './domain/profile'
import { chooseLineage, chooseMastery, dismantleRelics, gradeRelic, isGearSlot, isGlyph, isLineage, isPath, isPin, lockRelic, organizeRelics, refineRelic, removePin, setPin, toggleGlyph, trainMastery, transferRefinement, type Relicary } from './domain/relicary'
import { GameAudio, type Cue } from './game/audio'
import type { ArenaScene } from './game/stage'
import { SaveRepository } from './persistence/save'
import { battleView, resultView } from './ui/combat'
import { eventsView, wardrobeView } from './ui/events'
import { missionsView } from './ui/campaign'
import { campView, updateCityView } from './ui/city'
import { filters, relicaryView, type RelicFilter } from './ui/relicary'
import { createView, titleView } from './ui/foundation'
import { message, sigil } from './ui/html'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('A interface do jogo está indisponível.')

root.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <div class="view-width topbar-inner">
        <button class="brand" type="button" data-action="title" aria-label="Reinos da Aurora, voltar ao título">
          ${sigil}<span>Reinos da <b>Aurora</b></span>
        </button>
        <button class="audio-button" data-action="audio" aria-label="Áudio" aria-pressed="true"><span aria-hidden="true">♪</span> <span id="audio-text">Áudio ligado</span></button>
      </div>
    </header>
    <main id="view" aria-busy="true"><p class="loading">Carregando Reinos da Aurora…</p></main>
    <div class="stage-storage" aria-hidden="true"><div id="phaser-stage"></div></div>
    <footer class="game-footer"><div class="view-width footer-inner"><span>VERSÃO 0.4.1</span><span>SALVAMENTO NESTE NAVEGADOR</span></div></footer>
  </div>`

const view = root.querySelector<HTMLElement>('#view')!
const audioButton = root.querySelector<HTMLButtonElement>('[data-action="audio"]')!
const audioText = root.querySelector<HTMLElement>('#audio-text')!
const stageStorage = root.querySelector<HTMLElement>('.stage-storage')!
const stageHost = root.querySelector<HTMLElement>('#phaser-stage')!
const audio = new GameAudio()
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const draft = { name: '', classId: 'warrior' as ClassId, presentation: 'masculine' as Presentation }
let screen: 'title' | 'create' | 'camp' | 'battle' | 'result' | 'relicary' | 'missions' | 'wardrobe' | 'events' | 'mage' | 'plaza' = 'title'
let profile: Profile | null = null
let repository: SaveRepository | undefined
let arena: ArenaScene | undefined
let stageLoading = false
let error = ''
let busy = false
let battle: Battle | undefined
let selected = ''
let overcharge = false
let history: string[] = []
let speed = 1
let skip = reducedMotion.matches
let paused = false
let timer: number | undefined
let building: BuildingId = 'barracks'
let earnedGold = 0
let challenge = false
let partySize = 2
let wardrobeSlot: StyleSlot = 'mantle'
let receiptChecked = false
let mageNode: MageNodeId = 'focus'
const plaza = new Plaza((state) => {
  if (screen === 'plaza' && profile && view.querySelector('.plaza-screen')) paintPlaza(view, profile, state)
})
window.addEventListener('pagehide', () => plaza.leave())
const relicState = { filter: 'Tudo' as RelicFilter, chosen: '', bulk: false }

window.setInterval(() => {
  if (screen === 'camp' && profile && !busy && !updateCityView(view, profile, building, Date.now())) render()
}, 500)

function renderAudio(): void {
  audioButton.setAttribute('aria-pressed', String(audio.enabled))
  audioText.textContent = audio.enabled ? 'Áudio ligado' : 'Áudio desligado'
}

function paintBattle(events: readonly BattleEvent[] = []): void {
  if (screen !== 'battle' || !battle || !profile || !arena) return
  if (arena.scene.isPaused()) arena.scene.resume()
  arena.show(battle.attempt.id, profile.hero, profile.wardrobe.looks, battle.units, events, !skip && !reducedMotion.matches, speed)
}

function render(focusHeading = false, events: readonly BattleEvent[] = []): void {
  if (screen !== 'plaza') plaza.leave()
  const active = document.activeElement instanceof HTMLElement && view.contains(document.activeElement) ? document.activeElement : null
  stageStorage.append(stageHost)
  view.setAttribute('aria-busy', String(busy))
  if (screen === 'create') {
    view.innerHTML = createView(draft, error, busy)
  } else if (screen === 'battle' && profile && battle) {
    const skill = battle.skills.find((entry) => entry.id === selected) ?? battle.skills[0]!
    view.innerHTML = battleView({ battle, profile, selected: skill, history, error, speed, skip, paused, saving: busy, overcharge, opening: events.some((event) => event.kind === 'abyss-start') })
    view.querySelector('[data-stage-slot]')?.append(stageHost)
    mountStage()
    paintBattle(events)
  } else if (screen === 'result' && profile && battle) {
    view.innerHTML = resultView(battle.attempt.encounter, battle.phase === 'victory', profile, earnedGold, battle.attempt.id)
  } else if (screen === 'plaza' && profile) {
    view.innerHTML = plazaView()
    paintPlaza(view, profile, plaza.state)
  } else if (screen === 'mage' && profile) {
    view.innerHTML = mageView(profile, mageNode, error)
  } else if (screen === 'wardrobe' && profile) {
    view.innerHTML = wardrobeView(profile, wardrobeSlot, error)
  } else if (screen === 'events' && profile) {
    view.innerHTML = eventsView(profile, error, receiptChecked)
  } else if (screen === 'missions' && profile) {
    view.innerHTML = missionsView(profile, challenge, partySize, error)
  } else if (screen === 'relicary' && profile) {
    view.innerHTML = relicaryView(profile, relicState, error)
  } else if (screen === 'camp' && profile) {
    view.innerHTML = campView(profile, error, building, Date.now())
  } else {
    view.innerHTML = titleView(profile, error)
  }
  if (screen !== 'battle' && arena?.scene.isActive()) arena.scene.pause()
  if (focusHeading) {
    const heading = view.querySelector<HTMLElement>('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  } else if (active?.id) {
    view.querySelector<HTMLElement>(`#${CSS.escape(active.id)}`)?.focus({ preventScroll: true })
  } else if (active?.dataset.action) {
    const action = CSS.escape(active.dataset.action)
    const value = active.dataset.value
    const selector = value === undefined ? `[data-action="${action}"]` : `[data-action="${action}"][data-value="${CSS.escape(value)}"]`
    view.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
  }
}

async function save(change: (current: Profile | null) => Profile, onSuccess: () => void): Promise<void> {
  if (busy) return
  if (!repository) {
    error = 'O salvamento local está indisponível neste navegador.'
    render()
    return
  }
  error = ''
  busy = true
  render()
  const previousScreen = screen
  try {
    profile = await repository.commit(profile?.revision ?? null, change)
    onSuccess()
  } catch (cause) {
    error = message(cause)
  } finally {
    busy = false
    render(previousScreen !== screen)
  }
}

function campaign(change: (current: Profile) => Profile, onSuccess = () => {}): Promise<void> {
  return save((current) => {
    if (!current) throw new Error('Crie um herói antes de começar.')
    return change(updateCity(current, Date.now()))
  }, onSuccess)
}

function seed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!
}

function stopTimer(): void {
  window.clearTimeout(timer)
  timer = undefined
}

function enterBattle(): void {
  if (!profile) return
  stopTimer()
  arena?.clear()
  battle = startBattle(profile)
  selected = battle.skills[0]!.id
  overcharge = false
  history = ['Rodada 1. Escolha sua habilidade.']
  paused = false
  screen = 'battle'
}

async function createHero(): Promise<void> {
  if (busy) return
  const next = newProfile(draft.name, draft.classId, draft.presentation)
  if (profile && !window.confirm('Iniciar uma nova campanha substitui o progresso atual. Continuar?')) return
  await save(() => startAttempt(next, 'ruins', seed()), enterBattle)
}

function begin(encounter: EncounterId, options?: Parameters<typeof startAttempt>[3]): void {
  void campaign((current) => startAttempt(current, encounter, seed(), options), enterBattle)
}

async function continueGame(): Promise<void> {
  if (!repository || busy) return
  busy = true
  try {
    profile = await repository.load()
  } catch (cause) {
    error = message(cause)
  } finally {
    busy = false
  }
  if (error) {
    render()
    return
  }
  if (profile?.pending) {
    enterBattle()
  } else if (profile?.completed.includes('ruins')) {
    if (profile.city.farm.since === null) {
      await campaign((current) => current, () => { screen = 'camp' })
      return
    }
    screen = 'camp'
  } else if (profile) {
    begin('ruins')
    return
  }
  render(true)
}


const mageCues: Record<string, Cue> = {
  spark: 'arcane-spark', rain: 'arcane-rain', renew: 'arcane-renew', chorus: 'arcane-chorus',
  thread: 'arcane-renew', dew: 'arcane-chorus', dawn: 'arcane-chorus', prism: 'arcane-spark', tear: 'arcane-void',
  'void-circle': 'arcane-void', 'void-pulse': 'arcane-void',
}

function record(events: readonly BattleEvent[]): void {
  history = [...history, ...events.map((event) => event.text)].slice(-30)
  const spell = battle?.classId === 'mage' && events.find((event) => event.actor === 'hero' && event.spell)?.spell
  const cue = spell ? mageCues[spell] : undefined
  if (cue) audio.play(cue)
  else if (events.some((event) => event.kind === 'heal')) audio.play('heal')
  else if (events.some((event) => event.kind === 'damage')) audio.play('hit')
}

function saveResult(): void {
  if (!battle || (battle.phase !== 'defeat' && battle.phase !== 'victory')) return
  const { attempt, phase, round, corrosion, units } = battle
  const fallen = units.filter((entry) => entry.team === 'allies' && entry.hp === 0).length
  void campaign((current) => {
    const result = settleAttempt(current, attempt, phase, Date.now(), { rounds: round, corrosion, fallen })
    earnedGold = result.gold - current.gold
    return result
  }, () => {
    screen = 'result'
    audio.play(phase)
  })
}

function schedule(): void {
  stopTimer()
  if (paused || screen !== 'battle' || !battle || battle.phase === 'player') return
  timer = window.setTimeout(() => {
    if (!battle || paused || screen !== 'battle') return
    if (battle.phase === 'victory' || battle.phase === 'defeat') {
      saveResult()
      return
    }
    const next = advanceBattle(battle)
    battle = next.state
    record(next.events)
    if (battle.phase === 'player' && battle.skills.some((skill) => skill.id === selected && skillBlocked(battle!, skill))) selected = battle.skills[0]!.id
    render(false, next.events)
    if (battle.phase === 'player' && document.activeElement === document.body) {
      view.querySelector<HTMLElement>('.skill[aria-pressed="true"]')?.focus({ preventScroll: true })
    }
    schedule()
  }, (skip || reducedMotion.matches ? 45 : 410) / speed)
}

function act(targetId: string): void {
  if (!battle || busy || paused || battle.phase !== 'player') return
  try {
    const next = playerAction(battle, selected, targetId, overcharge)
    battle = next.state
    overcharge = false
    record(next.events)
    render(false, next.events)
    schedule()
  } catch (cause) {
    error = message(cause)
    render()
  }
}

function selectSkill(skillId: string): void {
  if (!battle || paused) return
  const skill = battle.skills.find((entry) => entry.id === skillId)
  if (!skill || skillBlocked(battle, skill)) return
  if (selected !== skillId) overcharge = false
  selected = skillId
  audio.play('select')
  render()
}

function modifyRelicary(change: (bag: Relicary, owner: Profile) => Relicary, done?: () => void): void {
  void campaign((current) => {
    if (current.pending) throw new Error('Prepare as relíquias na base.')
    return { ...current, relicary: change(current.relicary, current) }
  }, done)
}

function relicAction(action: string, value: string | undefined): boolean {
  const item = profile?.relicary.relics.find((entry) => entry.key === relicState.chosen) ?? profile?.relicary.relics[0]
  switch (action) {
    case 'relicary': screen = 'relicary'; break
    case 'relic-filter': {
      const next = filters.find((id) => id === value)
      if (next) relicState.filter = next
      break
    }
    case 'relic-select': relicState.chosen = value ?? ''; break
    case 'relic-bulk': relicState.bulk = !relicState.bulk; break
    case 'relic-forge': {
      document.getElementById('relic-details')?.scrollIntoView({ block: 'start' })
      return true
    }
    case 'relic-organize': modifyRelicary(organizeRelics); return true
    case 'relic-dismantle': modifyRelicary(dismantleRelics, () => { relicState.bulk = false }); return true
    case 'relic-expand':
      void campaign((current) => {
        if (current.gold < 25 || current.relicary.capacity >= 120) throw new Error('Espaço ou ouro insuficiente.')
        return { ...current, gold: current.gold - 25, relicary: { ...current.relicary, capacity: current.relicary.capacity + 6 } }
      })
      return true
    case 'equip-slot': if (item && (isGearSlot(value) || isTroop(value))) void campaign((current) => equip(current, item.key, value)); return true
    case 'relic-lock': if (item) modifyRelicary((bag) => lockRelic(bag, item.key)); return true
    case 'relic-refine': if (item) modifyRelicary((bag) => refineRelic(bag, item.key)); return true
    case 'relic-grade': if (item) modifyRelicary((bag) => gradeRelic(bag, item.key)); return true
    case 'relic-transfer': {
      const target = view.querySelector<HTMLSelectElement>('#relic-transfer')?.value
      if (item && target) modifyRelicary((bag) => transferRefinement(bag, item.key, target))
      return true
    }
    case 'pin-place': if (item && isPin(value)) modifyRelicary((bag) => setPin(bag, item.key, value)); return true
    case 'pin-remove': if (item) modifyRelicary((bag) => removePin(bag, item.key, Number(value))); return true
    case 'glyph-place':
    case 'glyph-remove': if (isGlyph(value)) modifyRelicary((bag) => toggleGlyph(bag, value, action === 'glyph-remove')); return true
    case 'lineage': if (isLineage(value)) modifyRelicary((bag) => chooseLineage(bag, value)); return true
    case 'mastery-train':
      if (profile && value && skillsByClass[profile.hero.classId].some((skill) => skill.id === value)) modifyRelicary((bag) => trainMastery(bag, value))
      return true
    case 'mastery-choose': {
      const [id, rank, path] = (value ?? '').split(':')
      if (id && (rank === '5' || rank === '10') && isPath(path)) modifyRelicary((bag) => chooseMastery(bag, id, rank === '5' ? 5 : 10, path))
      return true
    }
    default: return false
  }
  render(action === 'relicary')
  return true
}

root.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'hero-name') draft.name = event.target.value
})

root.addEventListener('change', (event) => {
  if (screen !== 'camp' || !(event.target instanceof HTMLSelectElement)) return
  const { troop } = event.target.dataset
  if (!isTroop(troop)) return
  const slot = Number(event.target.value)
  void campaign((current) => moveRecruit(current, troop, slot))
})

root.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'create-hero') return
  event.preventDefault()
  void createHero().catch((cause: unknown) => {
    error = message(cause)
    render()
  })
})

root.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest<HTMLButtonElement>('button[data-action]')
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return
  const { action, value } = button.dataset
  if (action === 'audio') {
    audio.toggle()
    renderAudio()
    return
  }
  if (busy) return
  error = ''
  if (action && relicAction(action, value)) return
  switch (action) {
    case 'title':
      stopTimer()
      screen = 'title'
      break
    case 'new':
      Object.assign(draft, { name: '', classId: 'warrior', presentation: 'masculine' })
      screen = 'create'
      break
    case 'continue': void continueGame(); return
    case 'class': {
      const classId = classIds.find((id) => id === value)
      if (classId) draft.classId = classId
      break
    }
    case 'presentation': if (value === 'masculine' || value === 'feminine') draft.presentation = value; break
    case 'gate': begin('gate'); return
    case 'drill': begin('drill'); return
    case 'leave-drill': {
      const attempt = battle?.attempt
      if (attempt?.encounter !== 'drill') return
      stopTimer()
      void campaign((current) => settleAttempt(current, attempt, 'defeat'), () => { screen = 'camp' })
      return
    }
    case 'plaza': if (profile) screen = 'plaza'; break
    case 'plaza-join':
      if (profile) void plaza.join({ ...profile.hero, level: levelFor(profile.hero.xp) })
      return
    case 'plaza-leave': plaza.leave(); return
    case 'plaza-move': {
      if (event.detail > 0) {
        const box = button.getBoundingClientRect()
        plaza.move((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height)
      }
      return
    }
    case 'mage-tree': if (profile?.hero.classId === 'mage') screen = 'mage'; break
    case 'mage-node': if (isMageNode(value)) mageNode = value; break
    case 'mage-train': void campaign((current) => trainMageNode(current, mageNode)); return
    case 'mage-slot': void campaign((current) => toggleMageSlot(current, mageNode)); return
    case 'mage-reset': void campaign(resetMageTree); return
    case 'missions': screen = 'missions'; break
    case 'wardrobe': {
      wardrobeSlot = styleSlotsIds.find((slot) => slot === value) ?? wardrobeSlot
      screen = 'wardrobe'
      break
    }
    case 'style-slot': wardrobeSlot = styleSlotsIds.find((slot) => slot === value) ?? wardrobeSlot; break
    case 'style-look':
    case 'style-stats':
      if (isAppearance(value)) void campaign((current) => ({ ...current, wardrobe: wearAppearance(current.wardrobe, value, action === 'style-look' ? 'looks' : 'stats') }))
      return
    case 'style-earn': if (isAppearance(value)) void campaign((current) => earnAppearance(current, value, Date.now())); return
    case 'season': void campaign((current) => openSeason(current, Date.now())); return
    case 'events': receiptChecked = false; screen = 'events'; break
    case 'spin': void campaign((current) => spinAltar(current, Date.now(), seed() / 0x100000000)); return
    case 'login-claim': void campaign((current) => claimLogin(current, Date.now())); return
    case 'recharge': if (isPack(value)) {
      receiptChecked = false
      const receipt = `local-${seed()}-${seed()}-${seed()}`
      void campaign((current) => simulateRecharge(current, value, receipt, Date.now()))
    }
      return
    case 'recharge-replay': void campaign((current) => {
      const receipt = current.events.receipts.at(-1)
      return receipt ? simulateRecharge(current, 'sparks', receipt, Date.now()) : current
    }, () => { receiptChecked = true }); return
    case 'recharge-claim': void campaign((current) => claimRecharge(current, Number(value), Date.now())); return
    case 'challenge': challenge = !challenge; break
    case 'nest-size': partySize = Number(value); break
    case 'expedition': if (isZone(value)) begin(value, { challenge, teamSize: partySize }); return
    case 'sweep': if (isZone(value)) void campaign((current) => sweepZone(current, value, Date.now())); return
    case 'energy': void campaign((current) => redeemEnergy(current, Date.now())); return
    case 'core': if (isLineage(value)) void campaign((current) => exchangeCore(current, value)); return
    case 'jura': overcharge = !overcharge; break
    case 'building': if (isBuildingId(value)) building = value; break
    case 'improve': if (isBuildingId(value)) void campaign((current) => improveBuilding(current, value, Date.now())); return
    case 'harvest': void campaign((current) => harvestFarm(current, Date.now())); return
    case 'train': if (isTroop(value)) void campaign((current) => trainRecruit(current, value)); return
    case 'hire': if (isTroop(value)) void campaign((current) => hire(current, value)); return
    case 'equip': if (value) void campaign((current) => equip(current, value)); return
    case 'camp': screen = 'camp'; break
    case 'return-from-defeat': screen = profile?.completed.includes('ruins') ? 'camp' : 'title'; break
    case 'retry': if (battle) begin(battle.attempt.encounter, battle.attempt); return
    case 'skill': if (value) selectSkill(value); return
    case 'target': if (value) act(value); return
    case 'save-result': saveResult(); return
    case 'speed': speed = speed === 1 ? 2 : 1; schedule(); break
    case 'skip': skip = !skip; schedule(); break
    case 'pause': paused = !paused; schedule(); break
    default: return
  }
  audio.play('select')
  const sameView = ['class', 'presentation', 'speed', 'skip', 'pause', 'building', 'jura', 'challenge', 'nest-size', 'style-slot', 'mage-node'].includes(action)
  render(!sameView)
})

document.addEventListener('keydown', (event) => {
  if (screen === 'plaza' && document.activeElement?.classList.contains('plaza-ground')) {
    const delta = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] }[event.key]
    if (delta) {
      event.preventDefault()
      const { x, y } = plaza.state.position
      plaza.move(x + delta[0]!, y + delta[1]!)
    }
    return
  }
  if (screen !== 'battle' || !battle || busy || paused || event.altKey || event.ctrlKey || event.metaKey) return
  if (!/^[1-7]$/.test(event.key)) return
  const skill = battle.skills[Number(event.key) - 1]
  if (skill) {
    event.preventDefault()
    selectSkill(skill.id)
  }
})

function mountStage(): void {
  if (arena || stageLoading) return
  stageLoading = true
  void import('./game/stage').then(({ startStage }) => {
    if (screen !== 'battle') {
      stageLoading = false
      return
    }
    const game = startStage(stageHost)
    game.events.once('aurora:ready', (scene: ArenaScene) => {
      arena = scene
      stageLoading = false
      if (screen === 'battle') paintBattle()
      else arena.scene.pause()
    })
  }).catch((cause: unknown) => {
    stageLoading = false
    error = message(cause)
    const errorTarget = view.querySelector('.form-error')
    if (errorTarget) errorTarget.textContent = error
  })
}

renderAudio()
try {
  repository = await SaveRepository.open()
  profile = await repository.load()
} catch (cause) {
  error = message(cause)
}
render()

if (import.meta.env.PROD && import.meta.env.MODE !== 'portable' && 'serviceWorker' in navigator) {
  const workerUrl = new URL('service-worker.js', document.baseURI)
  void navigator.serviceWorker.register(workerUrl).catch(() => {
    // The online build remains playable when the host or browser disallows offline caching.
  })
}
