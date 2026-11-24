import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'

const build = 'work/portable-build'
const destination = process.argv[2] ?? 'dist/reinos-da-aurora.html'
const mime = { '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }

async function dataUrl(path) {
  const mediaType = mime[extname(path)]
  if (!mediaType) throw new Error(`Formato de asset desconhecido: ${path}`)
  return `data:${mediaType};base64,${(await readFile(path)).toString('base64')}`
}

const html = await readFile(join(build, 'index.html'), 'utf8')
const scriptTag = html.match(/<script type="module"[^>]* src="([^"]+)"><\/script>/)
const stylesheetTag = html.match(/<link rel="stylesheet"[^>]* href="([^"]+)">/)
const iconTag = html.match(/<link rel="icon" href="([^"]+)"[^>]*>/)
if (!scriptTag || !stylesheetTag || !iconTag) throw new Error('A estrutura da build portátil mudou.')

const script = await readFile(join(build, scriptTag[1]), 'utf8')
const cssPath = join(build, stylesheetTag[1])
let css = await readFile(cssPath, 'utf8')
const cssUrls = new Map()
for (const match of css.matchAll(/url\((["']?)([^"')]+)\1\)/g)) {
  const url = match[2]
  if (url.startsWith('data:') || cssUrls.has(url)) continue
  cssUrls.set(url, await dataUrl(join(dirname(cssPath), url)))
}
css = css.replace(/url\((["']?)([^"')]+)\1\)/g, (declaration, _quote, url) => (
  cssUrls.has(url) ? `url(${cssUrls.get(url)})` : declaration
))

const cssAssets = new Set([...cssUrls.keys()].map((url) => basename(url)))
const assets = {}
for (const name of await readdir(join(build, 'assets'))) {
  if (name.endsWith('.webp') && !cssAssets.has(name)) {
    assets[name] = await dataUrl(join(build, 'assets', name))
  }
}
const licensePaths = await readdir(join(build, 'licenses'))
const licenses = await Promise.all(licensePaths.map(async (name) => (
  `${name}\n${await readFile(join(build, 'licenses', name), 'utf8')}`
)))
const iconUrl = await dataUrl(join(build, iconTag[1]))
const portable = html
  .replace(iconTag[0], () => `<link rel="icon" href="${iconUrl}" type="image/png">`)
  .replace(stylesheetTag[0], () => `<style>${css}</style>`)
  .replace(scriptTag[0], () => (
    `<script type="application/json" id="aurora-assets">${JSON.stringify(assets)}</script>\n`
    + `    <script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`
  ))
  .replace('</body>', () => `    <!--\n${licenses.join('\n\n').replaceAll('-->', '-- >')}\n    -->\n  </body>`)

await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, portable)
console.log(`HTML portátil criado em ${destination} (${(Buffer.byteLength(portable) / 1048576).toFixed(1)} MiB).`)
