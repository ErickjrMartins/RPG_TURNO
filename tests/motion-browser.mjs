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
  await page.locator('.target[data-value="crawler"]').waitFor()
}

async function sampleIdle(page) {
  return page.evaluate(async () => {
    const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
    const boxes = [[342, 211, 57, 99], [281, 154, 65, 96], [668, 215, 142, 86], [926, 193, 85, 111]]
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
      const meter = () => Number(document.querySelector('[aria-label="Vida de Rastejante de Concreto"]').getAttribute('aria-valuenow'))
      const health = meter()
      target.click()
      const ctx = document.querySelector('.arena-canvas canvas').getContext('2d')
      const blue = (x, y, width, height) => ctx.getImageData(x, y, width, height).data.some((value, i, data) =>
        i % 4 === 2 && value > 208 && data[i - 2] < 165 && data[i - 1] > 120 && data[i + 1] > 160)
      const electricSpan = (x, y, width, height) => {
        const pixels = ctx.getImageData(x, y, width, height).data
        let first = height
        let last = 0
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 2] < 210 || pixels[i + 1] < 85 || pixels[i] > 155 || pixels[i + 3] < 156) continue
          const line = Math.floor(i / 4 / width)
          first = Math.min(first, line)
          last = Math.max(last, line)
        }
        return last - first + 1
      }
      const state = { crystal: false, orb: false, electric: false, impact: false }
      const deadline = performance.now() + 2400
      function scan() {
        if (meter() === health) {
          state.crystal ||= blue(412, 156, 53, 52)
          const span = electricSpan(506, 128, 166, 161)
          state.orb ||= span >= 59
          state.electric ||= span >= 67
        } else {
          state.impact ||= electricSpan(653, 170, 185, 159) >= 86
        }
        if (Object.values(state).every(Boolean) || performance.now() >= deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      scan()
    }))
    assert.deepEqual(phases, { crystal: true, orb: true, electric: true, impact: true }, `Fases da Centelha: ${form}`)
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
      const health = meter('Rastejante de Concreto')
      const other = meter('Vulto do Véu')
      const count = (x, y, width, height) => ctx.getImageData(x, y, width, height).data.filter((value, i, data) =>
        i % 4 === 2 && value > 226 && data[i - 2] < 140 && data[i - 1] > 130 && data[i + 1] > 170).length
      const flash = (x) => ctx.getImageData(x, 296, 23, 25).data.filter((r, i, data) =>
        i % 4 === 0 && r > 172 && data[i + 1] > r + 14 && data[i + 2] > 243 && data[i + 3] > 215).length
      const boxes = [[651, 28, 124, 69], [670, 102, 131, 93]]
      const base = boxes.map((box) => count(...box))
      document.querySelector('.target[data-value="crawler"]').click()
      const state = { above: false, falling: false, firstGroundHit: false, laterGroundHit: false, moreFallingAfterHit: false, otherUnchanged: true }
      const deadline = performance.now() + 1800
      let firstImpact
      function scan() {
        state.otherUnchanged &&= other === meter('Vulto do Véu')
        if (meter('Rastejante de Concreto') === health) {
          state.above ||= count(...boxes[0]) > base[0] + 15
          state.falling ||= count(...boxes[1]) > base[1] + 15
        } else {
          if (!state.firstGroundHit && flash(716) > 30) {
            state.firstGroundHit = true
            firstImpact = performance.now()
          }
          state.laterGroundHit ||= state.firstGroundHit && performance.now() - firstImpact > 43 && flash(757) > 30
          state.moreFallingAfterHit ||= count(...boxes[0]) > base[0] + 15
        }
        if (Object.values(state).every(Boolean) || performance.now() > deadline) resolve(state)
        else requestAnimationFrame(scan)
      }
      scan()
    }))
    assert.deepEqual(phases, {
      above: true, falling: true, firstGroundHit: true, laterGroundHit: true, moreFallingAfterHit: true, otherUnchanged: true,
    }, `Chuva Astral: ${form}`)
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
  console.log('Esfera elétrica da Centelha, explosão e sequência de impactos da Chuva Astral verificadas nas duas aparências.')
} finally {
  await browser.close()
}
