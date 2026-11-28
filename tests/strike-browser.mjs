import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })

async function startWarrior(page, form) {
  await page.goto(url)
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('button', { name: form, exact: true }).click()
  await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Lâmina de Alvor')
  await page.getByRole('button', { name: 'Começar aventura' }).click()
}

async function testStrike(form, mobile) {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, isMobile: mobile })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await startWarrior(page, form)
    await page.locator('.target[data-value="crawler"]').waitFor()
    const phases = await page.evaluate(() => new Promise((resolve) => {
      const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
      const opaque = (x, y, width, height, threshold) => {
        const pixels = ctx.getImageData(x, y, width, height).data
        let count = 0
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] > 230 && ++count > threshold) return true
        }
        return false
      }
      const life = () => Number(document.querySelector('[aria-label="Vida de Rastejante de Concreto"]').getAttribute('aria-valuenow'))
      const initial = life()
      const deadline = performance.now() + 3800
      const state = { approach: false, fire: false, completeArc: false, singleArc: false, impact: false, retreat: false, home: false, fasterReturn: false }
      let start, firstCrossing, hit, secondCrossing
      document.querySelector('.target[data-value="crawler"]').click()
      function scan() {
        const time = performance.now()
        start ??= time
        const center = opaque(472, 179, 112, 96, 130)
        const landing = opaque(601, 160, 52, 113, 330)
        const inFormation = opaque(350, 159, 48, 111, 500)
        const fire = ctx.getImageData(646, 175, 123, 81).data.filter((red, index, data) =>
          index % 4 === 0 && red > 221 && data[index + 1] > 78 && data[index + 1] < 240 && data[index + 2] < 145 && data[index + 3] > 185).length
        if (state.approach && fire > 82) state.fire = true
        if (life() === initial && center && !state.approach) {
          state.approach = true
          firstCrossing = time
        }
        if (life() < initial && landing && !state.impact) {
          state.impact = true
          hit = time
        }
        if (state.impact && center && !state.retreat) {
          state.retreat = true
          secondCrossing = time
        }
        if (state.impact && !state.completeArc && time - hit < 190) {
          const beyondSprite = ctx.getImageData(783, 158, 54, 84).data.filter((red, i, pixels) =>
            i % 4 === 0 && red > 235 && pixels[i + 1] > 99 && pixels[i + 2] < 165 && pixels[i + 3] > 180).length
          state.completeArc ||= beyondSprite > 84
        }
        if (state.impact && time - hit < 80) {
          const column = ctx.getImageData(723, 185, 1, 74).data
          let last = -20
          let bands = 0
          let total = 0
          for (let i = 0; i < column.length; i += 4) {
            if (column[i] < 200 || column[i + 1] < 120 || column[i + 2] > 150 || column[i + 3] < 190) continue
            const row = i / 4
            if (row - last > 5) bands++
            last = row
            total++
          }
          state.singleArc ||= bands === 1 && total >= 10
        }
        if (state.retreat && inFormation && !center && !landing) {
          state.home = true
          state.fasterReturn = time - secondCrossing < hit - firstCrossing && time - secondCrossing < time - start
        }
        if (state.home || time > deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      requestAnimationFrame(scan)
    }))
    assert.deepEqual(phases, { approach: true, fire: true, completeArc: true, singleArc: true, impact: true, retreat: true, home: true, fasterReturn: true }, form)
    await page.getByText(/usou Golpe Firme\./).waitFor()
    await page.getByRole('heading', { name: 'Sua vez' }).waitFor()
    await page.getByRole('button', { name: 'Velocidade 1 vezes' }).click()
    const toggles = await page.evaluate(() => {
      const commits = () => document.querySelector('#view').innerText.match(/usou Golpe Firme/g)?.length ?? 0
      const before = commits()
      const target = document.querySelector('.target[data-value="crawler"]') ?? document.querySelector('.target')
      target.click()
      document.querySelector('[data-action="pause"]').click()
      const paused = commits() === before && document.querySelector('[data-action="pause"]').getAttribute('aria-pressed') === 'true'
      document.querySelector('[data-action="pause"]').click()
      document.querySelector('[data-action="skip"]').click()
      return { paused, skippedOnce: commits() === before + 1 }
    })
    assert.deepEqual(toggles, { paused: true, skippedOnce: true }, form)
    assert.deepEqual(errors, [])
  } finally {
    await page.close()
  }
}

async function testCharge(form, mobile) {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, isMobile: mobile })
  await page.addInitScript(() => {
    window.warriorSounds = []
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      const name = this.src.match(/warrior-(step|cry|blast)\.mp3$/)?.[1]
      if (name) window.warriorSounds.push(name)
      return play.call(this)
    }
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await startWarrior(page, form)
    const skip = page.getByRole('button', { name: 'Pular efeitos' })
    await skip.click()
    const ready = page.locator('[data-action="skill"][data-value="charge"][aria-disabled="false"]')
    for (let turns = 0; turns < 8; turns++) {
      await page.waitForFunction(() => document.querySelector('.target, [data-action="camp"]'))
      if (await ready.count()) break
      const victory = page.getByRole('button', { name: 'Seguir para Alvor' })
      if (await victory.count()) {
        await victory.click()
        await page.getByRole('button', { name: 'Simulador de Combate' }).click()
      } else {
        await page.locator('[data-action="skill"][data-value="strike"]').click()
        await page.locator('.target').first().click()
      }
    }
    assert.ok(await ready.count(), 'O Vanguarda reuniu Ímpeto suficiente para a Investida.')
    if (await skip.getAttribute('aria-pressed') === 'true') await skip.click()
    await ready.click()
    const target = await page.locator('.target').first().getAttribute('data-value')
    const result = await page.evaluate((id) => new Promise((resolve) => {
      const canvas = document.querySelector('.arena-canvas canvas')
      const ctx = canvas.getContext('2d')
      const label = document.querySelector('.arena-world .unit-label[data-value="' + id + '"]')
      const meter = label.querySelector('[role="meter"]').getAttribute('aria-label')
      const life = () => Number(document.querySelector('[aria-label="' + meter + '"]')?.getAttribute('aria-valuenow'))
      const health = life()
      const x = Math.round(canvas.width * parseFloat(label.style.getPropertyValue('--x')) / 100)
      const y = Math.round(canvas.height * parseFloat(label.style.getPropertyValue('--y')) / 100)
      const state = { tookOff: false, hit: false, blast: false, audio: false }
      const deadline = performance.now() + 4800
      document.querySelector('.target[data-value="' + id + '"]').click()
      function scan() {
        if (life() === health && !state.tookOff && window.warriorSounds.length >= 4) {
          const airborne = ctx.getImageData(x - 265, y - 216, 190, 57).data
          let visible = 0
          for (let i = 3; i < airborne.length; i += 4) if (airborne[i] > 218) visible++
          state.tookOff = visible > 120
        }
        state.hit ||= life() < health
        if (state.hit) {
          const pixels = ctx.getImageData(x - 58, y - 50, 105, 45).data
          let warm = 0
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 230 && pixels[i + 1] > 145 && pixels[i + 2] < 210 && pixels[i + 3] > 183) warm++
          }
          state.blast ||= warm > 370
        }
        const sounds = window.warriorSounds
        state.audio = sounds.indexOf('cry') >= 3 && sounds.indexOf('cry') < sounds.indexOf('blast') && sounds.filter((cue) => cue === 'blast').length === 1
        if (Object.values(state).every(Boolean) || performance.now() >= deadline) resolve({ ...state, sounds })
        else requestAnimationFrame(scan)
      }
      requestAnimationFrame(scan)
    }), target)
    const { sounds, ...phases } = result
    assert.deepEqual(phases, { tookOff: true, hit: true, blast: true, audio: true }, `${form}: ${sounds.join(', ')}`)
    await page.getByText(/usou Investida\./).first().waitFor()
    assert.deepEqual(errors, [])
  } finally {
    await page.close()
  }
}

try {
  await testStrike('Masculina', false)
  await testStrike('Feminina', true)
  await testCharge('Masculina', false)
  await testCharge('Feminina', true)
  console.log('Golpe Firme com arco único e Investida com salto, passos, grito e explosão verificados em desktop e tela móvel.')
} finally {
  await browser.close()
}
