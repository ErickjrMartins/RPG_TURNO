import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4183/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })
const forms = [['Masculina', 'Ari'], ['Feminina', 'Liora']]

async function verifyShot(presentation, name) {
  const context = await browser.newContext({ reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(url)
    await page.getByRole('button', { name: 'Novo jogo' }).click()
    await page.getByRole('button', { name: 'Atirador', exact: true }).click()
    await page.getByRole('button', { name: presentation, exact: true }).click()
    await page.getByRole('textbox', { name: 'Nome do herói' }).fill(name)
    await page.getByRole('button', { name: 'Começar aventura' }).click()
    await page.locator('.target[data-value="crawler"]').waitFor()

    const enemy = page.getByRole('meter', { name: 'Vida de Rastejante de Concreto' })
    const before = Number(await enemy.getAttribute('aria-valuenow'))
    await page.evaluate(() => {
      document.querySelector('.target[data-value="crawler"]').click()
      document.querySelector('[data-action="pause"]').click()
    })
    await page.getByRole('heading', { name: 'Em pausa' }).waitFor()
    assert.equal(await page.locator('.target').count(), 0)
    assert.equal(Number(await enemy.getAttribute('aria-valuenow')), before)

    if (presentation === 'Masculina') await page.getByRole('button', { name: 'Velocidade 1 vezes' }).click()
    // The flight crosses a clear part of the canvas before the target loses life.
    const sawFlight = await page.evaluate(() => new Promise((resolve) => {
      document.querySelector('[data-action="pause"]').click()
      const canvas = document.querySelector('.arena-canvas canvas')
      const drawing = canvas.getContext('2d', { willReadFrequently: true })
      const timeout = performance.now() + 2500
      const scan = () => {
        const pixels = drawing.getImageData(490, 168, 190, 95).data
        const arrows = pixels.some((value, index) => index % 4 === 0 && value > 220 && pixels[index + 1] > 150
          && pixels[index + 2] < 225 && pixels[index + 3] > 150)
        if (arrows || performance.now() >= timeout) resolve(arrows)
        else requestAnimationFrame(scan)
      }
      scan()
    }))
    assert.equal(sawFlight, true, `Flecha visível: ${presentation}`)
    await page.getByText(/usou Disparo\./).first().waitFor()
    assert(Number(await enemy.getAttribute('aria-valuenow')) < before)
    await page.getByRole('heading', { name: 'Sua vez' }).waitFor()

    await page.evaluate(() => {
      document.querySelector('.target[data-value="wisp"]').click()
      document.querySelector('[data-action="skip"]').click()
    })
    assert(Number(await page.getByRole('meter', { name: 'Vida de Vulto do Véu' }).getAttribute('aria-valuenow')) < 37)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
}

try {
  for (const [form, name] of forms) await verifyShot(form, name)
  console.log('Disparo nas duas aparências, flecha, Vida no impacto, pausa, 2× e pulo de efeitos verificados.')
} finally {
  await browser.close()
}
