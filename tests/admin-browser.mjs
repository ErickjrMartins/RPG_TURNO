import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const url = process.env.AURORA_URL ?? 'http://127.0.0.1:8080/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const open = () => page.getByRole('button', { name: 'Testes', exact: true }).click()
const close = () => page.getByRole('button', { name: 'Voltar ao jogo' }).click()
const status = (message) => page.locator('#test-admin-message').filter({ hasText: message }).waitFor()

try {
  await page.goto(url)
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Heroína de Teste')
  await page.getByRole('button', { name: 'Começar aventura' }).click()
  const hero = page.getByRole('meter', { name: 'Vida de Heroína de Teste' }).first()
  const initialHp = Number(await hero.getAttribute('aria-valuemax'))
  await open()
  await page.getByRole('spinbutton', { name: 'Nível do herói' }).fill('31')
  await page.getByRole('spinbutton', { name: 'Créditos' }).fill('1000')
  await page.getByRole('spinbutton', { name: 'Provisões' }).fill('350')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await status('Alterações salvas.')
  await page.getByLabel('Item', { exact: true }).selectOption('relic:abyss-heart')
  await page.getByRole('button', { name: 'Liberar item' }).click()
  await status('Item liberado e salvo.')
  await close()
  assert.equal(Number(await hero.getAttribute('aria-valuemax')), initialHp + 8 * 30)
  assert.equal(await page.getByText('RODADA 1', { exact: true }).count(), 1)
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  assert.equal(Number(await hero.getAttribute('aria-valuemax')), initialHp + 8 * 30)
  await open()
  assert.equal(await page.getByRole('spinbutton', { name: 'Créditos' }).inputValue(), '1000')
  assert.equal(await page.getByRole('spinbutton', { name: 'Provisões' }).inputValue(), '350')
  await page.getByLabel('Item', { exact: true }).selectOption('relic:abyss-heart')
  await page.getByRole('button', { name: 'Liberar item' }).click()
  await status('Você já tem essa relíquia.')
  await close()
  for (let turn = 0; turn < 5; turn++) {
    await page.waitForFunction(() => document.querySelector('.target, .result-panel'))
    if (await page.locator('.result-panel').count()) break
    if (await page.locator('[data-action="skill"][data-value="charge"][aria-disabled="false"]').count()) {
      await page.locator('[data-action="skill"][data-value="charge"]').click()
    } else {
      await page.locator('[data-action="skill"]').first().click()
    }
    await page.locator('.target').first().click()
  }
  await page.getByRole('heading', { name: 'Vitória' }).waitFor()
  await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
  await page.locator('[data-action="hire"][data-value="sentry"]').click()
  await page.locator('#formation-sentry').waitFor()
  await open()
  await page.locator('#test-troop-sentry').fill('3')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await status('Alterações salvas.')
  await close()
  await page.getByText('Sentinela · Nv. 3', { exact: true }).waitFor()
  if (process.env.AURORA_VIEWER_URL) {
    await page.goto(process.env.AURORA_VIEWER_URL)
    const access = await page.request.get(new URL('/api/test-admin/access', process.env.AURORA_VIEWER_URL).href)
    assert.deepEqual(await access.json(), { allowed: false })
    await page.getByRole('button', { name: 'Novo jogo' }).click()
    await page.getByRole('textbox', { name: 'Nome do herói' }).fill('Visitante')
    await page.getByRole('button', { name: 'Começar aventura' }).click()
    await page.getByRole('heading', { name: 'Estação Aurora' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Testes', exact: true }).count(), 0)
  }
  console.log('Painel no Chromium móvel: níveis, atributos, recursos e relíquia persistem após recarregar.')
} finally {
  await browser.close()
}
