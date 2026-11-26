import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const output = resolve('work/sites-build/dist')
await rm(output, { recursive: true, force: true })
await mkdir(`${output}/server`, { recursive: true })
await cp('dist', `${output}/client`, { recursive: true })
await cp('server/sites-worker.mjs', `${output}/server/index.js`)
await cp('server/test-admin.mjs', `${output}/server/test-admin.mjs`)
await writeFile(`${output}/server/wrangler.json`, JSON.stringify({
  main: 'index.js',
  compatibility_date: '2026-06-01',
  assets: { directory: '../client', binding: 'ASSETS', run_worker_first: ['/api/test-admin/access'] },
}, null, 2))
