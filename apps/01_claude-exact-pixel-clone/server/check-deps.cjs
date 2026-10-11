const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const root = path.resolve(__dirname, '..')
const files = ['package.json', 'package-lock.json']
const hash = crypto.createHash('sha256').update(files.map(file => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '').join('\n')).digest('hex')
const marker = path.join(root, 'node_modules', '.ai-assistant-deps')
try {
  for (const name of ['vite', 'react', 'react-markdown', 'remark-gfm', 'express', 'yaml']) if (!fs.existsSync(path.join(root, 'node_modules', name, 'package.json'))) throw new Error(`Missing ${name}`)
  if (process.platform === 'win32' && process.arch === 'x64' && !fs.existsSync(path.join(root, 'node_modules/@rollup/rollup-win32-x64-msvc'))) throw new Error('Missing Windows Rollup optional dependency')
  if (process.argv.includes('--record')) fs.writeFileSync(marker, hash)
  else if (!fs.existsSync(marker) || fs.readFileSync(marker, 'utf8') !== hash) throw new Error('Dependencies changed')
} catch (error) { console.error(error.message); process.exitCode = 1 }
