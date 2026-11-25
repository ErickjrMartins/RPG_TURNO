import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4183/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })

async function enterArena(page, form) {
  await page.goto(url)
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('button', { name: 'Canalizador', exact: true }).click()
  await page.getByRole('button', { name: form, exact: true }).click()
  await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Nara de Alvor')
  await page.getByRole('button', { name: 'Começar aventura' }).click()
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.arena-canvas canvas')
    return canvas?.getContext('2d')?.getImageData(375, 200, 1, 1).data[3] > 0
  })
}

async function sampleIdle(page) {
  return page.evaluate(async () => {
    const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
    const boxes = [[353, 170, 43, 89], [304, 118, 47, 82], [712, 204, 80, 61], [933, 180, 65, 74]]
    const sample = () => boxes.map((box) => ctx.getImageData(...box).data)
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const initial = sample()
    const changed = boxes.map(() => false)
    const start = performance.now()
    do {
      await new Promise(requestAnimationFrame)
      sample().forEach((area, i) => {
        changed[i] ||= area.some((value, index) => Math.abs(value - initial[i][index]) > 5)
      })
    } while (performance.now() - start < 550 && !changed.every(Boolean))
    return changed
  })
}

async function verifySpark(form, isMobile = false) {
  const context = await browser.newContext({ reducedMotion: 'no-preference', ...(isMobile ? { viewport: { width: 390, height: 844 }, isMobile: true } : {}) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await enterArena(page, form)
    assert.deepEqual(await sampleIdle(page), [true, true, true, true], 'Herói, tropa e os dois inimigos se movem em repouso')
    await page.getByRole('button', { name: 'Pausar', exact: true }).click()
    assert.deepEqual(await sampleIdle(page), [false, false, false, false], 'A pausa congela o repouso')
    await page.getByRole('button', { name: 'Retomar', exact: true }).click()
    const skip = page.getByRole('button', { name: 'Pular efeitos' })
    await skip.click()
    assert.deepEqual(await sampleIdle(page), [false, false, false, false], 'Pular efeitos desliga o repouso animado')
    await skip.click()

    const phases = await page.evaluate(() => new Promise((resolve) => {
      const target = document.querySelector('.target[data-value="crawler"]')
      const meter = () => Number(document.querySelector('[aria-label="Vida de Rastejante de Pedra"]').getAttribute('aria-valuenow'))
      const health = meter()
      target.click()
      const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
      const blue = (x, y, width, height) => ctx.getImageData(x, y, width, height).data.some((value, i, data) =>
        i % 4 === 2 && value > 208 && data[i - 2] < 165 && data[i - 1] > 120 && data[i + 1] > 160)
      const state = { crystal: false, orb: false, impact: false }
      const deadline = performance.now() + 2400
      function scan() {
        if (meter() === health) {
          state.crystal ||= blue(432, 123, 59, 59)
          state.orb ||= blue(508, 120, 150, 113)
        } else {
          state.impact ||= blue(715, 186, 66, 55)
        }
        if (Object.values(state).every(Boolean) || performance.now() >= deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      scan()
    }))
    assert.deepEqual(phases, { crystal: true, orb: true, impact: true }, `Fases da Centelha: ${form}`)
    await page.getByText(/usou Centelha\./).first().waitFor()
    await page.getByRole('heading', { name: 'Sua vez' }).waitFor()
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

try {
  await verifySpark('Masculina')
  await verifySpark('Feminina', true)
  console.log('Centelha azul nas duas aparências, impacto, repouso, pausa e pulo de efeitos verificados no Chromium.')
} finally {
  await browser.close()
}
