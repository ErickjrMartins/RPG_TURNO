import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const appUrl = process.env.AURORA_URL ?? 'http://localhost:4173/'
const url = new URL(appUrl)
const localFile = url.protocol === 'file:'
const portable = localFile || url.pathname.endsWith('/reinos-da-aurora.html')
const checkOffline = process.env.AURORA_TEST_OFFLINE !== '0'
const executablePath = process.env.AURORA_CHROMIUM_PATH
const apps = [
  { className: 'Vanguarda', presentation: 'Masculina', name: 'Dário', heavy: 'Investida', viewport: { width: 1440, height: 960 } },
  { className: 'Atirador', presentation: 'Feminina', name: 'Liora', heavy: 'Rajada Dupla', viewport: { width: 390, height: 844 }, isMobile: true },
  { className: 'Canalizador', presentation: 'Feminina', name: 'Alda', heavy: 'Chuva Astral', viewport: { width: 1280, height: 800 } },
]

async function recruit(page, id) {
  await page.locator(`[data-action="hire"][data-value="${id}"]`).click()
  await page.locator(`#formation-${id}`).waitFor()
}

async function fast(page) {
  const effects = page.getByRole('button', { name: 'Pular efeitos' })
  if (await effects.getAttribute('aria-pressed') === 'false') await effects.click()
  const speed = page.getByRole('button', { name: 'Velocidade 1 vezes' })
  if (await speed.count()) await speed.click()
}

async function verifyAbyss(page, isTouch, heavyName) {
  await page.getByRole('button', { name: 'Campo de Treino' }).click()
  await page.getByRole('heading', { name: 'Campo de Treino' }).waitFor()
  await page.locator('.arena-canvas canvas').waitFor()
  assert.equal(await page.locator('.unit-label').count(), 12)
  await fast(page)
  for (let i = 0; i < 2; i++) {
    await page.locator('.target').first().waitFor()
    await page.locator('[data-action="skill"]').first().click()
    const enemy = page.locator('.target').first()
    await (isTouch ? enemy.tap() : enemy.click())
  }
  const ultimate = page.locator('.ultimate-skill[aria-disabled="false"]')
  await ultimate.waitFor()
  await (isTouch ? ultimate.tap() : ultimate.click())
  assert.ok(await page.locator('.target-list').innerText())
  await page.getByRole('button', { name: 'Pular efeitos' }).click()
  const target = page.locator('.target').first()
  await (isTouch ? target.tap() : target.click())
  await page.locator('.arena-world.abyss-opening').waitFor()
  await page.locator('.abyss-banner').waitFor()
  if (process.env.AURORA_SCREENSHOTS) await page.screenshot({ path: `work/arena-${isTouch ? 'mobile' : heavyName.replaceAll(' ', '-')}.png` })
  await fast(page)
  for (let i = 0; i < 2; i++) {
    await page.locator('.target').first().waitFor()
    await page.locator('[data-action="skill"]').first().click()
    await page.locator('.target').first().click()
  }
  await page.locator('.abyss-banner').waitFor({ state: 'detached' })
  await page.getByRole('button', { name: 'Encerrar treino' }).click()
  await page.getByRole('heading', { name: 'Refúgio de Alvor' }).waitFor()
}

async function finish(page, heavyName, isTouch) {
  const heavy = page.locator('[data-action="skill"]').filter({ hasText: heavyName })
  const basic = page.locator('[data-action="skill"]').first()
  for (let i = 0; i < 18; i++) {
    await page.waitForFunction(() => document.querySelector('.target') || document.querySelector('.result-panel h1'))
    const outcome = page.locator('.result-panel h1')
    if (await outcome.count()) {
      assert.equal(await outcome.textContent(), 'Vitória')
      return
    }
    const useHeavy = await heavy.getAttribute('aria-disabled') === 'false'
    const sealed = (await page.locator('.battle-brief').innerText()).startsWith('Barreira do Núcleo')
    const chosen = sealed && await page.locator('.ultimate-skill[aria-disabled="false"]').count() ? page.locator('.ultimate-skill') : useHeavy ? heavy : basic
    await (isTouch ? chosen.tap() : chosen.click())
    const target = page.locator('.target').first()
    await (isTouch ? target.tap() : target.click())
  }
  throw new Error('A batalha não terminou.')
}

async function verifyProgression(page, heavy) {
  const camp = () => page.getByRole('button', { name: /Refúgio de Alvor/ }).click()
  const relic = (id) => page.locator(`.relic-cell[data-value="${id}"]`).click()
  await page.getByRole('button', { name: 'Abrir Relicário' }).click()
  await relic('dawn-brooch')
  await page.getByRole('button', { name: /^Refinar/ }).click()
  await page.getByRole('button', { name: /^Transferir/ }).click()
  await relic('gate-insignia')
  await page.getByText('Incomum · GRAU 1 · REFINO +1', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Encaixar Prego de Ataque' }).click()
  await page.getByRole('button', { name: 'Remover Prego de Ataque' }).click()
  await page.getByRole('button', { name: 'Equipar · Talismã de Domínio' }).click()
  await page.getByRole('button', { name: 'Organizar', exact: true }).click()
  await camp()
  const missionMenu = () => page.getByRole('button', { name: 'Expedições', exact: true }).click()
  const watch = page.locator('[data-action="expedition"][data-value="watch"]')
  await missionMenu()
  for (let i = 0; i < 3; i++) {
    await watch.click()
    await page.getByRole('heading', { name: 'Posto das Cinzas', exact: true }).waitFor()
    await fast(page)
    await finish(page, heavy, false)
    assert.equal(await page.getByText(/estrelas · Primeira Purificação/).count(), i === 0 ? 1 : 0)
    await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
    await missionMenu()
  }
  const sweep = page.locator('[data-action="sweep"][data-value="watch"]')
  await sweep.click()
  await page.getByText(/Energia diária 4\/5/).waitFor()
  await page.getByRole('button', { name: '4 participantes' }).click()
  await page.getByRole('button', { name: 'Romper Selo' }).click()
  await page.getByRole('button', { name: 'Entrar no Ninho da Ruptura' }).click()
  await page.getByRole('heading', { name: 'Ninho da Ruptura', exact: true }).waitFor()
  await fast(page)
  await finish(page, heavy, false)
  assert.equal(await page.locator('.expedition-loot li').count(), 4)
  await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
  await missionMenu()
  await page.locator('[data-action="core"][data-value="pest"]').click()
  await page.getByText(/6 Marcas de Expurgo/).waitFor()
  await camp()
  await page.getByRole('button', { name: 'Abrir Relicário' }).click()
  const pest = page.locator('[data-action="glyph-place"][data-value="glyph-pest"]')
  for (let i = 0; i < 3; i++) {
    await pest.click()
    await page.locator('#view[aria-busy="false"]').waitFor()
  }
  await page.getByText(/\+10 recurso inicial/).waitFor()
  await page.getByRole('button', { name: 'Traje de Clã' }).click()
  await page.locator('[data-action="style-earn"][data-value="purge-mantle"]').click()
  await page.locator('[data-action="style-stats"][data-value="purge-mantle"]').click()
  await page.getByRole('button', { name: 'Eventos', exact: true }).click()
  await page.getByRole('button', { name: 'Resgatar hoje' }).click()
  await page.getByRole('button', { name: 'Dia resgatado' }).waitFor()
  await page.locator('[data-action="recharge"][data-value="sparks"]').click()
  await page.getByText(/^120 Cash simulado ·/).waitFor()
  await page.getByRole('button', { name: 'Verificar último recibo' }).click()
  await page.getByText('Recibo já contabilizado. Saldo preservado.').waitFor()
  await page.locator('[data-action="recharge-claim"][data-value="0"]').click()
  await page.locator('[data-action="recharge-claim"][data-value="0"]').filter({ hasText: 'Resgatado' }).waitFor()
  await page.getByRole('button', { name: 'Ver Indumentárias' }).click()
  await page.locator('[data-action="style-earn"][data-value="nocturne-mantle"]').click()
  await page.locator('[data-action="style-look"][data-value="nocturne-mantle"]').click()
  await page.locator('.hero-style.mantle').waitFor()
  assert.equal(await page.locator('[data-action="style-stats"][data-value="purge-mantle"]').getAttribute('aria-pressed'), 'true')
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.locator('.city-hero-marker .hero-style.mantle').waitFor()
  await page.getByRole('button', { name: 'Eventos', exact: true }).click()
  await page.getByRole('button', { name: 'Dia resgatado' }).waitFor()
  await page.getByText(/^30 Cash simulado ·/).waitFor()
  console.log('Expedições, Varredura, Altar, Relicário, aparência e eventos simulados verificados pelo fluxo da interface.')
}

async function testCampaign(browser, setup) {
  const { className, presentation, name, heavy, viewport, isMobile = false } = setup
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (entry) => { if (entry.type() === 'error') errors.push(entry.text()) })
  page.on('response', (response) => { if (response.status() >= 400) errors.push(response.url()) })
  page.on('request', (request) => {
    if (portable && /^(https?:|file:)/.test(request.url()) && request.url() !== appUrl) {
      errors.push(`Recurso externo na versão portátil: ${request.url()}`)
    }
  })
  try {
    const response = await page.goto(appUrl)
    if (isMobile && checkOffline) {
      if (!portable) await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
      if (portable && !localFile) {
        const body = await response.body()
        await context.route(appUrl, (route) => route.fulfill({ body, contentType: 'text/html; charset=utf-8' }))
      }
      await context.setOffline(true)
      await page.reload()
    }
    await page.getByRole('button', { name: 'Novo jogo' }).click()
    if (className === 'Vanguarda') {
      for (const choice of ['Vanguarda', 'Atirador', 'Canalizador']) {
        await page.getByRole('button', { name: choice, exact: true }).click()
        for (const form of ['Masculina', 'Feminina']) {
          await page.getByRole('button', { name: form, exact: true }).click()
          await page.locator('.character-art').evaluate(image => image.decode())
        }
      }
    }
    await page.getByRole('textbox', { name: 'Nome do herói' }).fill(name)
    await page.getByRole('button', { name: className, exact: true }).click()
    await page.getByRole('button', { name: presentation, exact: true }).click()
    const source = await page.locator('.character-art').getAttribute('src')
    const form = presentation === 'Feminina' ? 'feminine' : 'masculine'
    if (portable) {
      const id = { Vanguarda: 'warrior', Atirador: 'archer', Canalizador: 'mage' }[className]
      const assets = JSON.parse(await page.locator('#aurora-assets').textContent())
      assert.equal(source, assets[`${id}-${form}.webp`])
      assert.match(source, /^data:image\/webp;base64,/)
    } else {
      assert.match(source, new RegExp(form))
    }
    await page.locator('.character-art').evaluate(image => image.decode())
    await page.getByRole('button', { name: 'Começar aventura' }).click()
    await page.getByRole('heading', { name: 'Ruínas do Farol' }).waitFor()
    await page.locator('.arena-canvas canvas').waitFor()
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.arena-canvas canvas')
      const imageData = canvas?.getContext('2d')?.getImageData(250, 150, 630, 250).data
      return imageData?.some((value, index) => index % 4 === 3 && value > 50)
    })
    await page.getByRole('button', { name: 'Pausar', exact: true }).click()
    assert.equal(await page.locator('.target').count(), 0)
    await page.getByRole('button', { name: 'Retomar', exact: true }).click()
    await page.getByRole('button', { name: 'Pular efeitos' }).click()
    await page.getByRole('button', { name: 'Velocidade 1 vezes' }).click()
    await page.getByRole('button', { name: 'Velocidade 2 vezes' }).waitFor()
    if (!isMobile && className === 'Canalizador') {
      await page.keyboard.press('2')
      assert.equal(await page.locator('[data-value="rain"]').getAttribute('aria-pressed'), 'true')
    }
    await finish(page, heavy, isMobile)
    await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
    await page.getByRole('heading', { name: 'Refúgio de Alvor' }).waitFor()
    await page.getByRole('button', { name: 'Equipar', exact: true }).click()
    await page.getByText('Equipado', { exact: true }).waitFor()
    await recruit(page, 'sentry')
    await recruit(page, 'bowman')
    await page.locator('#formation-bowman').selectOption('5')
    await page.waitForFunction(() => document.querySelector('#view')?.getAttribute('aria-busy') === 'false')
    await page.reload()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('heading', { name: 'Refúgio de Alvor' }).waitFor()
    assert.equal(await page.locator('#formation-bowman').inputValue(), '5')
    await page.getByText('Equipado', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Ir ao Portão' }).click()
    await page.getByRole('heading', { name: 'Portão Caído' }).waitFor()
    await page.getByRole('button', { name: 'Pular efeitos' }).click()
    await finish(page, heavy, isMobile)
    await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
    await page.getByText('Nível 2 · 140 XP', { exact: false }).waitFor()
    assert.equal(await page.locator('[data-balance=gold]').textContent(), '94')
    await page.reload()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByText('Nível 2 · 140 XP', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Ir ao Portão' }).count(), 0)
    assert.equal(await page.locator('[data-balance=gold]').textContent(), '94')
    await verifyAbyss(page, isMobile, heavy)
    if (className === 'Vanguarda') {
      const choose = (id) => page.locator(`[data-action="building"][data-value="${id}"]`).click()
      const upgrade = page.getByRole('button', { name: 'Melhorar', exact: true })
      await page.clock.install()
      await choose('farm')
      assert.equal(await upgrade.isDisabled(), true)
      await choose('council')
      await upgrade.click()
      await page.getByText('Melhoria em andamento', { exact: true }).waitFor()
      assert.equal(await page.locator('[data-balance=gold]').textContent(), '76')
      await page.reload()
      await page.getByRole('button', { name: 'Continuar' }).click()
      await choose('council')
      await page.getByText('Melhoria em andamento', { exact: true }).waitFor()
      await page.clock.fastForward(13000)
      await page.getByText('Edifícios até o nível 2', { exact: true }).waitFor()
      await choose('farm')
      const beforeHarvest = Number(await page.locator('[data-balance=supplies]').textContent())
      await page.getByRole('button', { name: 'Coletar provisões' }).click()
      await page.waitForFunction((before) => Number(document.querySelector('[data-balance=supplies]')?.textContent) > before, beforeHarvest)
      await page.locator('#view[aria-busy="false"]').waitFor()
      assert.equal(await page.getByRole('button', { name: 'Coletar provisões' }).isDisabled(), true)
      await upgrade.click()
      await page.getByText('Melhoria em andamento', { exact: true }).waitFor()
      await choose('barracks')
      await upgrade.click()
      await page.getByText('Melhoria em andamento', { exact: true }).waitFor()
      await choose('treasury')
      await upgrade.click()
      await page.getByText('Melhoria em andamento', { exact: true }).waitFor()
      await page.clock.fastForward(17000)
      await page.getByText('Capacidade de 750 ouro', { exact: true }).waitFor()
      await choose('farm')
      const storedBeforeTraining = Number(await page.locator('[data-balance=supplies]').textContent())
      await page.getByRole('button', { name: 'Coletar provisões' }).click()
      await page.waitForFunction((before) => Number(document.querySelector('[data-balance=supplies]')?.textContent) > before, storedBeforeTraining)
      await choose('barracks')
      await page.getByRole('button', { name: /^Treinar Sentinela/ }).click()
      await page.getByText('Sentinela · Nv. 2', { exact: true }).waitFor()
      await page.reload()
      await page.getByRole('button', { name: 'Continuar' }).click()
      await page.getByText('Sentinela · Nv. 2', { exact: true }).waitFor()
      if (process.env.AURORA_SCREENSHOTS) await page.locator('.city').screenshot({ path: 'work/refugio-m2.png' })
      console.log('Cidade: melhorias dos quatro edifícios, colheita, limites, recarga e treinamento verificados.')
    }
    if (className === 'Vanguarda') await verifyProgression(page, heavy)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    assert.deepEqual(errors, [])
    console.log(`${className}/${presentation} ${isMobile ? '390 px, toque' + (checkOffline ? ', offline' : '') : 'desktop'}: dois encontros, recompensas, recrutamento, retomada e console verificados.`)
  } finally {
    await context.close()
  }
}

const browser = await chromium.launch({ executablePath })
try {
  const outcomes = await Promise.allSettled(apps.map((setup) => testCampaign(browser, setup)))
  for (const result of outcomes) if (result.status === 'rejected') throw result.reason
} finally {
  await browser.close()
}
