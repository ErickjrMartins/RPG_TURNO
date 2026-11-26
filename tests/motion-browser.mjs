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

async function verifyRain(form, isMobile = false) {
  const context = await browser.newContext({ reducedMotion: 'no-preference', ...(isMobile ? { viewport: { width: 390, height: 844 }, isMobile: true } : {}) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await enterArena(page, form)
    await page.locator('[data-action="skill"][data-value="rain"]').click()
    const phases = await page.evaluate(() => new Promise((resolve) => {
      const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
      const meter = (name) => Number(document.querySelector(`[aria-label="Vida de ${name}"]`).getAttribute('aria-valuenow'))
      const health = meter('Rastejante de Pedra')
      const other = meter('Vulto do Véu')
      const count = (x, y, width, height) => ctx.getImageData(x, y, width, height).data.filter((value, i, data) =>
        i % 4 === 2 && value > 226 && data[i - 2] < 140 && data[i - 1] > 130 && data[i + 1] > 170).length
      const boxes = [[651, 28, 124, 69], [670, 102, 141, 85], [698, 175, 90, 58]]
      const base = boxes.map((box) => count(...box))
      document.querySelector('.target[data-value="crawler"]').click()
      const state = { above: false, falling: false, impact: false, otherUnchanged: true }
      const deadline = performance.now() + 1700
      function scan() {
        state.otherUnchanged &&= other === meter('Vulto do Véu')
        if (meter('Rastejante de Pedra') === health) {
          state.above ||= count(...boxes[0]) > base[0] + 15
          state.falling ||= count(...boxes[1]) > base[1] + 15
        } else {
          state.impact ||= count(...boxes[2]) > base[2] + 10
        }
        if ((state.above && state.falling && state.impact) || performance.now() > deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      scan()
    }))
    assert.deepEqual(phases, { above: true, falling: true, impact: true, otherUnchanged: true }, `Chuva Astral: ${form}`)
    await page.getByText(/usou Chuva Astral\./).first().waitFor()
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

try {
  await verifySpark('Masculina')
  await verifySpark('Feminina', true)
  await verifyRain('Masculina')
  await verifyRain('Feminina', true)
  console.log('Centelha e Chuva Astral azuis nas duas aparências, impacto, repouso, pausa e pulo de efeitos verificados no Chromium.')
} finally {
  await browser.close()
}
