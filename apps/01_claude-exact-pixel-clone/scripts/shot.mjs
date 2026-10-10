/**
 * Screenshot the running app so it can be compared against the user's real
 * Claude screenshots. Usage:  node scripts/shot.mjs <name> [actions]
 *
 * Actions (comma separated):
 *   settings   open the Settings modal
 *   apps       open Apps & extensions
 *   user       open the user menu
 *   file       open the File menu
 *   ctx        open the chat context menu
 *   vault      open the vault panel
 *   today      open the Today view
 *   chat       click the first chat, type and send a message
 *   artifact   ask the mock model for a game (artifact panel)
 *   newchat    click New
 */
import { chromium } from 'playwright'
import fs from 'fs'

const name = process.argv[2] || 'app'
const actions = (process.argv[3] || '').split(',').filter(Boolean)
const OUT = process.env.SHOT_DIR || '/home/user/shots'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 680 }, deviceScaleFactor: 1.5 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.addInitScript(() => {
  try {
    localStorage.setItem('claude_exact_chats_v2', 'reset')
  } catch {}
})
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' })
await page.evaluate(() => { localStorage.removeItem('claude_exact_chats_v2') })
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(900)

for (const a of actions) {
  if (a === 'settings') { await page.evaluate(() => {}) } // handled below
}

if (actions.includes('user')) {
  await page.click('button[title="nishadislamutso@gmail.com"]')
} else if (actions.includes('file')) {
  await page.click('button[title="File  Edit  View  Go  Help"]')
} else if (actions.includes('ctx')) {
  // 191646 right-clicks the chat row at device y=918 (the last fully visible one)
  await page.mouse.click(100, 612, { button: 'right' })
} else if (actions.includes('vault')) {
  await page.click('button[title="AI-Brain vault"]')
} else if (actions.includes('apps')) {
  await page.click('button[title="nishadislamutso@gmail.com"]')
  await page.click('text=Get apps and extensions')
} else if (actions.includes('settings')) {
  await page.click('button[title="nishadislamutso@gmail.com"]')
  await page.click('text=Settings')
} else if (actions.includes('today')) {
  await page.click('button[title="AI-Brain vault"]')
  await page.click('text=Open Today view')
} else if (actions.includes('chat') || actions.includes('artifact')) {
  await page.click('text=Refining a 5-day workout cycle')
  await page.waitForTimeout(300)
  const box = page.locator('textarea').first()
  await box.click()
  await box.fill(actions.includes('artifact') ? 'build me a tic tac toe game' : 'hello, who are you?')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(actions.includes('artifact') ? 6000 : 4000)
}

await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/${name}.png` })
console.log(`saved ${OUT}/${name}.png`)
console.log('ERRORS:', JSON.stringify(errors, null, 1))
await browser.close()
