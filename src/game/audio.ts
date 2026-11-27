import { assetUrl } from '../assets'

const sampleSources = {
  'warrior-strike': 'warrior-strike.mp3',
  'warrior-step': 'warrior-step.mp3',
  'warrior-cry': 'warrior-cry.mp3',
  'warrior-blast': 'warrior-blast.mp3',
}
type SampleCue = keyof typeof sampleSources
export type Cue = 'select' | 'hit' | 'heal' | 'victory' | 'defeat' | 'arcane-spark' | 'arcane-rain' | 'arcane-renew' | 'arcane-chorus' | 'arcane-void' | SampleCue

const notes: Record<Exclude<Cue, SampleCue>, number[]> = {
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

function isSample(cue: Cue): cue is SampleCue {
  return Object.hasOwn(sampleSources, cue)
}

export class GameAudio {
  private context?: AudioContext
  private readonly samples = new Map<SampleCue, HTMLAudioElement>()
  enabled = this.loadPreference()

  constructor() {
    for (const cue of Object.keys(sampleSources) as SampleCue[]) {
      const sample = new Audio(assetUrl(sampleSources[cue]))
      sample.preload = this.enabled ? 'auto' : 'none'
      this.samples.set(cue, sample)
    }
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
    if (!this.enabled) for (const sample of this.samples.values()) sample.pause()
    try {
      localStorage.setItem('aurora-audio', this.enabled ? 'on' : 'off')
    } catch {
      // The preference still applies to the current session.
    }
    this.play('select')
  }

  play(cue: Cue): void {
    if (!this.enabled) return
    if (isSample(cue)) {
      const sample = this.samples.get(cue)!
      sample.currentTime = 0
      void sample.play().catch(() => {
        if (cue === 'warrior-strike' || cue === 'warrior-blast') this.play('hit')
      })
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
