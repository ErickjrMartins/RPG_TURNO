import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const url = process.env.AURORA_URL ?? 'http://localhost:4183/'
const browser = await chromium.launch({ executablePath: process.env.AURORA_CHROMIUM_PATH })

async function quickBattle(page) {
  await page.getByRole('button', { name: 'Pular efeitos' }).click()
  for (let i = 0; i < 18; i++) {
    await page.locator('.target, .result-panel').first().waitFor()
    if (await page.locator('.result-panel').count()) break
    await page.locator('[data-action="skill"]').first().click()
    await page.locator('.target').first().click()
  }
  await page.getByRole('heading', { name: 'Vitória' }).waitFor()
  await page.getByRole('button', { name: 'Seguir para Alvor' }).click()
}

async function newHero(page, name, profession) {
  const problems = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('response', (response) => { if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`) })
  await page.goto(url)
  await page.getByRole('button', { name: 'Novo jogo' }).click()
  await page.getByRole('button', { name: profession, exact: true }).click()
  await page.getByRole('textbox', { name: 'Nome do herói' }).fill(name)
  await page.getByRole('button', { name: 'Começar aventura' }).click()
  await page.getByRole('heading', { name: 'Estação Aurora' }).waitFor()
  await page.locator('.hero-vitals [role=meter]').waitFor()
  await quickBattle(page)
  return problems
}

async function study(page) {
  await page.getByRole('button', { name: 'Árvore de Habilidades' }).click()
  assert.equal(await page.locator('.arcana-node').count(), 15)
  const learn = page.getByRole('button', { name: 'Aprender · 1 ponto' })
  await page.locator('.arcana-node[data-value="spark"]').click()
  assert.equal(await learn.isDisabled(), true)
  await page.locator('.arcana-node[data-value="focus"]').click()
  await learn.click()
  await page.locator('.arcana-budget b').filter({ hasText: /^1$/ }).waitFor()
  await page.locator('.arcana-node[data-value="spark"]').click()
  await learn.click()
  await page.locator('.arcana-budget b').filter({ hasText: /^0$/ }).waitFor()
  if (process.env.AURORA_SCREENSHOTS) await page.screenshot({ path: 'work/mage-tree-030.png', fullPage: true })
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Árvore de Habilidades' }).click()
  assert.equal(await page.locator('.arcana-node[data-studied="true"]').count(), 2)
  await page.getByRole('button', { name: /Central de Contenção/ }).click()
}

async function join(page) {
  await page.getByRole('button', { name: 'Pátio de Alvor' }).click()
  await page.getByRole('button', { name: 'Entrar na praça online' }).click()
  await page.getByText('Sessão online ativa.').waitFor()
}

async function chapterAccess(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const conn = indexedDB.open('reinos-da-aurora', 1)
    conn.onerror = () => reject(conn.error)
    conn.onsuccess = () => {
      const db = conn.result
      const transaction = db.transaction('profiles', 'readwrite')
      const store = transaction.objectStore('profiles')
      const read = store.get('campaign')
      read.onsuccess = () => {
        const save = read.result
        const cleared = { stars: 3, clears: 1 }
        save.completed.push('gate')
        for (const id of ['watch', 'hollow', 'core', 'drowned', 'mothvault']) save.campaign.zones[id] = cleared
        save.hero.xp = 550
        store.put(save, 'campaign')
      }
      transaction.oncomplete = () => { db.close(); resolve() }
      transaction.onabort = () => { db.close(); reject(transaction.error) }
    }
  }))
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Árvore de Habilidades' }).click()
  for (const id of ['renew', 'thread']) {
    await page.locator(`.arcana-node[data-value="${id}"]`).click()
    await page.getByRole('button', { name: 'Aprender · 1 ponto' }).click()
    await page.locator(`.arcana-node[data-value="${id}"][data-studied="true"]`).waitFor()
  }
  await page.getByRole('button', { name: 'Equipar habilidade' }).click()
  await page.locator('.arcana-loadout').getByRole('button', { name: 'Fio de Âmbar' }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Expedições' }).click()
  await page.getByRole('heading', { name: 'Galerias Subterrâneas' }).waitFor()
  await page.getByRole('heading', { name: 'Coberturas de Alvor' }).waitFor()
  await page.locator('[data-action="expedition"][data-value="frostpath"]').click()
  await page.locator('.arena-frame.terrain-ridge').waitFor()
  await page.getByRole('heading', { name: 'Cobertura da Geada' }).waitFor()
  const amber = page.getByRole('button', { name: /Fio de Âmbar/ })
  await amber.waitFor()
  await page.locator('.arena-world strong').filter({ hasText: 'Lince de Geada' }).first().waitFor()
  await page.getByRole('button', { name: 'Pular efeitos' }).click()
  await page.getByRole('button', { name: /Centelha/ }).click()
  await page.locator('.target').first().click()
  await page.getByRole('heading', { name: 'Sua vez' }).waitFor()
  await amber.click()
  await page.getByText('Aliado com menor porcentagem de Vida').waitFor()
  assert.equal(await page.locator('.target').count(), 1)
  await page.locator('.target').click()
  await page.getByText(/usou Fio de Âmbar/).first().waitFor()
  await page.getByRole('heading', { name: 'Sua vez' }).waitFor()
  await page.getByRole('button', { name: /Chuva Astral/ }).click()
  await page.locator('.target').first().click()
  await page.getByText(/Lince de Geada sofreu/).first().waitFor()
  if (process.env.AURORA_SCREENSHOTS) await page.screenshot({ path: 'work/frostpath-030.png', fullPage: true })
}

try {
  const firstContext = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const secondContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const [first, second] = await Promise.all([firstContext.newPage(), secondContext.newPage()])
  const [firstProblems, secondProblems] = await Promise.all([
    newHero(first, 'Runa de Alvor', 'Canalizador'), newHero(second, 'Nilo do Vale', 'Vanguarda'),
  ])
  await study(first)
  await Promise.all([join(first), join(second)])
  await first.getByText('2 jogadores na praça').waitFor()
  await second.getByText('2 jogadores na praça').waitFor()
  const runeThere = second.locator('.plaza-avatar').filter({ hasText: 'Runa de Alvor' })
  const previous = await runeThere.evaluate((node) => node.style.left)
  await first.locator('.plaza-ground').focus()
  await first.keyboard.press('ArrowLeft')
  await second.waitForFunction((left) => [...document.querySelectorAll('.plaza-avatar')].some((entry) => entry.textContent.includes('Runa de Alvor') && entry.style.left !== left), previous)
  if (process.env.AURORA_SCREENSHOTS) await first.screenshot({ path: 'work/plaza-030.png', fullPage: true })
  await second.getByRole('button', { name: 'Sair da sessão online' }).click()
  await first.getByText('1 jogador na praça').waitFor()
  await first.getByRole('button', { name: /Central de Contenção/ }).click()
  await chapterAccess(first)
  assert.deepEqual(firstProblems, [])
  assert.deepEqual(secondProblems, [])
  console.log('Árvore de 15 nós, preparação salva, Fio de Âmbar, Chuva Astral, mapas e dois navegadores na praça verificados.')
} finally {
  await browser.close()
}
