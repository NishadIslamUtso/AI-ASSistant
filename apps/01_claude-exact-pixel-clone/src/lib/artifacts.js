/**
 * artifacts.js — artifact detection + building
 *
 * RULE (fixes the Tic-Tac-Toe loop): an artifact is only created when the
 * assistant emits an explicit artifact fence, or the user asked for one.
 * Generic ```code``` blocks stay inline code — they never become artifacts.
 */
import { buildReactArtifactHtml, buildHtmlArtifactHtml } from './artifact-runner.js'

const ID = () => Math.random().toString(36).slice(2, 10)

/** explicit artifact fence: ```artifact:html  /  ```artifact:react  /  :::artifact */
const ARTIFACT_RE = /```artifact:(html|react|jsx|svg|js)[^\n]*\n([\s\S]*?)```/gi
const GENERIC_RE = /```(html|jsx|tsx|svg|javascript|js)\n([\s\S]*?)```/gi

function looksLikeApp(code = '') {
  const c = code.trim()
  return (
    /<!DOCTYPE|<html[\s>]|<canvas|createRoot|ReactDOM|function\s+App|export\s+default/i.test(c) &&
    c.length > 120
  )
}

/**
 * @param {string} text assistant output
 * @param {boolean} allowGeneric true only when the user explicitly asked for
 *        an app/game/page in this turn
 * @returns {{artifacts: Array, clean: string}}
 */
export function extractArtifacts(text, allowGeneric = false) {
  const artifacts = []
  let clean = text || ''

  clean = clean.replace(ARTIFACT_RE, (_m, type, code) => {
    artifacts.push(make(String(type).toLowerCase(), code))
    return ''
  })

  if (allowGeneric) {
    clean = clean.replace(GENERIC_RE, (m, type, code) => {
      if (!looksLikeApp(code)) return m
      artifacts.push(make(String(type).toLowerCase(), code))
      return ''
    })
  }

  return { artifacts, clean: clean.replace(/\n{3,}/g, '\n\n').trim() }
}

function make(type, code) {
  const code2 = String(code).trim()
  const isHtml = type === 'html' || type === 'svg' || /^<!DOCTYPE|^<html/i.test(code2)
  const kind = isHtml ? 'html' : type === 'js' || type === 'javascript' ? 'js' : 'react'
  return {
    id: ID(),
    kind,
    title: guessTitle(code2, kind),
    code: code2,
    html: kind === 'react' ? buildReactArtifactHtml(code2) : buildHtmlArtifactHtml(code2),
    createdAt: new Date().toISOString(),
  }
}

function guessTitle(code, kind) {
  const t = code.match(/<title>([^<]{1,60})<\/title>/i)
  if (t) return t[1].trim()
  const h = code.match(/<h1[^>]*>([^<]{1,60})<\/h1>/i)
  if (h) return h[1].trim()
  const fn = code.match(/function\s+([A-Z]\w{2,30})/)
  if (fn) return fn[1].replace(/([a-z])([A-Z])/g, '$1 $2')
  return kind === 'react' ? 'React Application' : kind === 'js' ? 'Script' : 'HTML Application'
}

/** crude "did the user ask me to build something?" detector (fixes the loop) */
export function userAskedForArtifact(prompt = '') {
  return /\b(build|make|create|write|code|generate|draw|render|design)\b[\s\S]{0,40}\b(app|application|game|page|website|site|html|component|tool|calculator|chart|todo|snake|tetris|tic[- ]?tac[- ]?toe|flappy|dashboard|form|widget|animation|simulation)\b/i.test(
    prompt
  )
}
