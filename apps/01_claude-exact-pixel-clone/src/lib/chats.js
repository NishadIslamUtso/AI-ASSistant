import { STORAGE } from './constants.js'
import { loadJSON } from './storage.js'

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// Seed list copied from the screenshots (titles truncated where the screenshot truncates them).
const SEED_TITLES = [
  ['Identifying your charisma type'],
  ['Repurposing an old Realme 6i phone'],
  ['Fix AI-generated Facebook profile picture'],
  ['Psychiatric prescription for multiple diagnoses'],
  ['PSY 101 midterm exam preparation and pr…'],
  ['PSY 101 midterm exam preparation and ch…'],
  ['STA201 MID'],
  ['Creating a new skill'],
  ['PHY-112 electrostatics study notes compi…'],
  ['Hash table search and function implemen…'],
  ['CSE220 MID'],
  ['PSY 101 midterm exam preparation and cl…'],
  ['Student-style problem solving approach'],
  ['Comprehensive notes from slides with fo…'],
  ['Quick income for ADHD students'],
  ['Battery pricing…'],
  ['মাতৃভাষার প্রি…'],
]

export function seedChats() {
  const oct8 = { id: 'seed-0', title: 'Refining a 5-day workout cycle', updatedAt: new Date(2026, 9, 8, 18).getTime(), pinned: false }
  const older = SEED_TITLES.map(([title], i) => ({
    id: `seed-${i + 1}`,
    title,
    updatedAt: new Date(2026, 8, 30 - i, 12).getTime(), // Sep 30 going back, so they stay in "Older"
    pinned: false,
  }))
  return [oct8, ...older]
}

// Chats saved by the first build had {id,title,date:'Oct 8'|'Older'}. Convert them once.
function migrate(c) {
  if (typeof c.updatedAt === 'number') return { pinned: false, ...c }
  const updatedAt = c.date === 'Oct 8' ? new Date(2026, 9, 8, 18).getTime() : new Date(2026, 8, 1, 12).getTime()
  return { id: c.id, title: c.title, updatedAt, pinned: !!c.pinned }
}

export function loadChats() {
  const saved = loadJSON(STORAGE.chats, null)
  if (!Array.isArray(saved)) return seedChats() // first run only; a user who deletes everything keeps an empty list
  return saved.map(migrate)
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// Sidebar groups: Pinned, Today, then "Oct 8"-style per day for the last 7 days, then Older.
export function groupChats(chats, now = new Date()) {
  const groups = new Map()
  const add = (label, chat) => {
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(chat)
  }
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
  for (const chat of sorted) {
    if (chat.pinned) {
      add('Pinned', chat)
      continue
    }
    const d = new Date(chat.updatedAt)
    const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
    if (days <= 0) add('Today', chat)
    else if (days < 7) add(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), chat)
    else add('Older', chat)
  }
  const labels = [...groups.keys()].sort((a, b) => (a === 'Pinned' ? -1 : b === 'Pinned' ? 1 : 0))
  return labels.map((label) => ({ label, items: groups.get(label) }))
}

export function greetingFor(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
