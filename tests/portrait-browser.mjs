import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4183/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })
const classes = ['Vanguarda', 'Atirador', 'Canalizador']
const forms = ['Masculina', 'Feminina']

async function measureMotion(page) {
  return page.evaluate(async () => {
    const portrait = document.querySelector('.character-portrait')
    const canvas = portrait.querySelector('canvas')
    const brush = canvas.getContext('2d')
    const size = canvas.height
    const sample = (x, y, width, height) => brush.getImageData(Math.floor(x * size), Math.floor(y * size),
      Math.floor(width * size), Math.floor(height * size)).data
    const readPixels = () => [sample(0.19, 0, 0.37, 0.36), sample(0.08, 0.50, 0.66, 0.42), sample(0.485, 0.22, 0.12, 0.22)]
    const before = readPixels()
    const changed = [false, false, false]
    const vertical = []
    let rigid = true
    const start = performance.now()
    do {
      await new Promise(requestAnimationFrame)
      readPixels().forEach((area, index) => {
        changed[index] ||= area.some((value, pixel) => Math.abs(value - before[index][pixel]) > 4)
      })
      const transform = new DOMMatrix(getComputedStyle(portrait).transform)
      rigid &&= transform.a === 1 && transform.b === 0 && transform.c === 0 && transform.d === 1 && transform.e === 0
      vertical.push(transform.f)
    } while (performance.now() - start < 900 && !(changed[0] && changed[1] && Math.min(...vertical) < -0.2))
    return { changed, rigid, rise: Math.min(...vertical), height: portrait.offsetHeight }
  })
}

try {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' })
    try {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(url)
      await page.getByRole('button', { name: 'Novo jogo' }).click()
      const canvas = page.locator('.character-motion')
      for (const hero of classes) {
        await page.getByRole('button', { name: hero, exact: true }).click()
        for (const form of forms) {
          await page.getByRole('button', { name: form, exact: true }).click()
          await canvas.waitFor({ state: 'visible' })
          const sample = await measureMotion(page)
          assert.deepEqual(sample.changed, [true, true, false], `${hero} - ${form}: pontas móveis, torso fixo`)
          assert(sample.rigid && sample.rise < -0.2 && sample.rise >= -sample.height * 0.0055 - 0.1, 'Respiração vertical sem alterar proporções')
        }
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await canvas.waitFor({ state: 'hidden' })
      await page.locator('.character-art').waitFor({ state: 'visible' })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await canvas.waitFor({ state: 'visible' })
      await page.getByRole('button', { name: /Voltar/ }).click()
      await canvas.waitFor({ state: 'detached' })
      assert.deepEqual(errors, [])
      console.log(`Seis retratos verificados em ${viewport.width}px, com movimento reduzido e troca de tela.`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
