import { assetUrl } from '../assets'

export type Cue = 'select' | 'hit' | 'heal' | 'victory' | 'defeat' | 'arcane-spark' | 'arcane-rain' | 'arcane-renew' | 'arcane-chorus' | 'arcane-void' | 'warrior-strike'

const notes: Record<Exclude<Cue, 'warrior-strike'>, number[]> = {
  select: [392, 523],
  hit: [165, 110],
  heal: [330, 440, 554],
  victory: [262, 330, 392, 523],
  defeat: [330, 262, 196],
  'arcane-spark': [440, 740, 990],
  'arcane-rain': [659, 587, 440, 349],
  'arcane-renew': [294, 392, 587],
  'arcane-chorus': [392, 523, 659, 784],
  'arcane-void': [158, 119, 238, 89],
}

export class GameAudio {
  private context?: AudioContext
  private readonly strike = new Audio(assetUrl('warrior-strike.mp3'))
  enabled = this.loadPreference()

  constructor() {
    this.strike.preload = this.enabled ? 'auto' : 'none'
  }

  private loadPreference(): boolean {
    try {
      return localStorage.getItem('aurora-audio') !== 'off'
    } catch {
      return true
    }
  }

  toggle(): void {
    this.enabled = !this.enabled
    if (!this.enabled) this.strike.pause()
    try {
      localStorage.setItem('aurora-audio', this.enabled ? 'on' : 'off')
    } catch {
      // The preference still applies to the current session.
    }
    this.play('select')
  }

  play(cue: Cue): void {
    if (!this.enabled) return
    if (cue === 'warrior-strike') {
      this.strike.currentTime = 0
      void this.strike.play().catch(() => this.play('hit'))
      return
    }
    if (typeof AudioContext === 'undefined') return
    try {
      const context = this.context ??= new AudioContext()
      if (context.state === 'suspended') void context.resume().catch(() => undefined)
      notes[cue].forEach((frequency, index) => {
        const start = context.currentTime + index * 0.07
        const oscillator = context.createOscillator()
        const envelope = context.createGain()
        oscillator.frequency.value = frequency
        oscillator.type = cue === 'arcane-void' || cue === 'arcane-spark' ? 'triangle' : 'sine'
        envelope.gain.setValueAtTime(0.001, start)
        envelope.gain.exponentialRampToValueAtTime(0.032, start + 0.025)
        envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
        oscillator.connect(envelope)
        envelope.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.23)
      })
    } catch {
      // Audio is optional when playback is unavailable.
    }
  }
}
