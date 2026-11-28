import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://localhost:4183/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })

async function win(page) {
  const skip = page.getByRole('button', { name: 'Pular efeitos' })
  if (await skip.getAttribute('aria-pressed') === 'false') await skip.click()
  for (let turn = 0; turn < 15; turn++) {
    await page.locator('.target, .result-panel').first().waitFor()
    if (await page.locator('.result-panel').count()) break
    const strong = page.locator('.skill[data-value="charge"][aria-disabled="false"]')
    if (await strong.count()) await strong.click()
    else await page.locator('.skill[data-value="strike"]').click()
    await page.locator('.target').first().click()
  }
  await page.getByRole('heading', { name: 'Vitória', exact: true }).waitFor()
}

try {
  for (const width of [1440, 390]) {
    const mobile = width < 500
    const context = await browser.newContext({ viewport: { width, height: 940 }, isMobile: mobile, hasTouch: mobile,
      reducedMotion: mobile ? 'reduce' : 'no-preference' })
    try {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (cause) => errors.push(cause.message))
      page.on('response', (response) => { if (response.status() >= 400) errors.push(response.url()) })
      await page.goto(url)
      await page.getByRole('button', { name: 'Novo jogo' }).click()
      await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Lina')
      await page.getByRole('button', { name: 'Começar aventura' }).click()
      await win(page)
      await page.getByRole('button', { name: 'Ver Maldições' }).click()
      await page.getByRole('heading', { name: 'Reino dos Céus' }).waitFor()
      assert.match(await page.locator('.sky-map').evaluate((map) => getComputedStyle(map).backgroundImage), /reino-dos-ceus/)
      assert.equal(await page.getByRole('button', { name: 'Vincular Vigia do Limiar' }).count(), 0)
      await page.getByRole('button', { name: 'Vincular Braseiro' }).click()
      await page.locator('.sky-familiar').filter({ hasText: 'Braseiro' }).waitFor()

      const hero = page.locator('.sky-hero')
      const getX = () => hero.evaluate((node) => parseFloat(node.style.left))
      const initial = await getX()
      await page.keyboard.press('d')
      const walking = await getX()
      const step = page.getByRole('button', { name: 'Passo de Fenda' })
      await step.click()
      assert.equal(await step.getAttribute('aria-pressed'), 'true')
      await page.keyboard.press('d')
      const passing = await getX()
      assert(passing - walking > (walking - initial) * 1.9, 'A técnica aumenta a distância do movimento por tecla')
      const ground = page.locator('.plaza-ground')
      const corner = { position: { x: 3, y: 3 } }
      if (mobile) await ground.tap(corner)
      else await ground.click(corner)
      assert.equal(await hero.evaluate((node) => node.style.top), '48%')
      assert.equal(await hero.evaluate((node) => Math.round(parseFloat(node.style.left))), 28)
      const duration = await hero.evaluate((node) => getComputedStyle(node).transitionDuration)
      if (mobile) assert(parseFloat(duration) < 0.001, 'Movimento reduzido desativa o deslocamento animado')
      else assert.equal(duration, '0.15s')

      await page.getByRole('button', { name: 'Bolsa', exact: true }).click()
      await page.getByRole('heading', { name: 'Relicário', exact: true }).waitFor()
      await page.getByRole('button', { name: /Reino dos Céus/ }).click()
      await page.getByRole('button', { name: 'Portal de Caça' }).click()
      await page.getByRole('button', { name: 'Entrar no Portal' }).click()
      await page.getByRole('heading', { name: 'Bloqueio da Linha 7' }).waitFor()
      await page.getByRole('meter', { name: 'Vida de Braseiro' }).waitFor()
      const skip = page.getByRole('button', { name: 'Pular efeitos' })
      if (await skip.getAttribute('aria-pressed') === 'false') await skip.click()
      await page.locator('.target[data-value="warden"]').click()
      await page.getByText('Braseiro usou Casca de Brasa.', { exact: true }).first().waitFor()
      await win(page)

      await page.getByRole('button', { name: 'Ver Maldições' }).click()
      const progress = page.getByRole('progressbar', { name: 'Experiência de Braseiro' })
      assert.equal(await progress.getAttribute('value'), '24')
      await page.getByRole('button', { name: 'Vincular Vigia do Limiar' }).click()
      await page.locator('.sky-familiar').filter({ hasText: 'Vigia do Limiar' }).waitFor()
      if (process.env.AURORA_SCREENSHOTS) await page.screenshot({ path: `work/reino-dos-ceus-${width}.jpg`, fullPage: true, type: 'jpeg' })

      await page.reload()
      await page.getByRole('button', { name: 'Continuar' }).click()
      await page.getByRole('button', { name: 'Reino dos Céus', exact: true }).click()
      await page.locator('.sky-familiar').filter({ hasText: 'Vigia do Limiar' }).waitFor()
      await page.getByRole('button', { name: 'Portal de Caça' }).click()
      await page.getByRole('button', { name: 'Entrar no Portal' }).click()
      await page.getByRole('heading', { name: 'Expedições', exact: true }).waitFor()
      assert.deepEqual(errors, [])
      console.log(`Reino dos Céus, deslocamento, Bolsa, portal, combate, XP e save verificados a ${width}px.`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
