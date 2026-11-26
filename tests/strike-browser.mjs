import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })

async function testStrike(form, mobile) {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, isMobile: mobile })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(url)
    await page.getByRole('button', { name: 'Novo jogo' }).click()
    await page.getByRole('button', { name: form, exact: true }).click()
    await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Lâmina de Alvor')
    await page.getByRole('button', { name: 'Começar aventura' }).click()
    await page.waitForFunction(() => {
      const ctx = document.querySelector('.arena-canvas canvas')?.getContext('2d')
      return ctx?.getImageData(365, 165, 36, 96).data.some((value, index) => index % 4 === 3 && value > 230)
    })
    const phases = await page.evaluate(() => new Promise((resolve) => {
      const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
      const opaque = (x, y, width, height) => ctx.getImageData(x, y, width, height).data.filter((n, i) => i % 4 === 3 && n > 230).length
      const life = () => Number(document.querySelector('[aria-label="Vida de Rastejante de Pedra"]').getAttribute('aria-valuenow'))
      const initial = life()
      const deadline = performance.now() + 2900
      const state = { approach: false, fire: false, impact: false, retreat: false, home: false, fasterReturn: false }
      let start, firstCrossing, hit, secondCrossing
      document.querySelector('.target[data-value="crawler"]').click()
      function scan() {
        const time = performance.now()
        start ??= time
        const center = opaque(496, 179, 73, 96) > 150
        const landing = opaque(630, 163, 80, 106) > 550
        const inFormation = opaque(350, 159, 48, 111) > 500
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
        if (state.retreat && inFormation && !center && !landing) {
          state.home = true
          state.fasterReturn = time - secondCrossing < hit - firstCrossing && time - secondCrossing < time - start
        }
        if (state.home || time > deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      requestAnimationFrame(scan)
    }))
    assert.deepEqual(phases, { approach: true, fire: true, impact: true, retreat: true, home: true, fasterReturn: true }, form)
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

try {
  await testStrike('Masculina', false)
  await testStrike('Feminina', true)
  console.log('Golpe Firme em desktop e celular: corrida até o alvo, fogo e dano no impacto, retorno rápido, pausa e pulo a 2×.')
} finally {
  await browser.close()
}
