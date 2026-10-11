/**
 * mock-ollama.cjs — Ollama-compatible stub for sandboxes and demos ONLY.
 * Ported from the brain01 branch (best-of cherry-pick) and adapted.
 *
 * It exists so the UI can be exercised on a machine that has no Ollama and no
 * GPU. It implements just enough of the Ollama HTTP API:
 *   GET  /api/tags
 *   POST /api/show  (model verification — the app requires it before sending)
 *   POST /api/chat   (NDJSON streaming)
 *
 * It is NEVER started by start-app.bat, and it never touches the vault.
 * The real build always talks to the real Ollama on 127.0.0.1:11434.
 * Start it by hand with:  npm run dev:mock
 *
 * Every reply it produces says plainly that it is a mock.
 */
const http = require('http')

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 11434

const MODELS = [
  {
    name: 'qwen2.5:3b',
    model: 'qwen2.5:3b',
    size: 1900000000,
    details: { family: 'qwen2', parameter_size: '3B', quantization_level: 'Q4_K_M' },
  },
  {
    name: 'qwen3-vl:4b',
    model: 'qwen3-vl:4b',
    size: 2900000000,
    details: { family: 'qwen3', parameter_size: '4B', quantization_level: 'Q4_K_M' },
  },
]

const MOCK_NOTICE =
  '**(mock reply — no model loaded: this is `server/mock-ollama.cjs`, not qwen2.5:3b)**'

function replyFor(prompt) {
  const p = String(prompt || '')
  const last = p.split('\n').filter((l) => l.trim()).slice(-1)[0] || ''
  return [
    MOCK_NOTICE,
    '',
    `You said: “${last.slice(0, 200)}”`,
    '',
    'This sandbox has no Ollama and no GPU, so nothing here is a real generation.',
    'On your TUF A15 `start-app.bat` starts the **real** Ollama and this same UI streams from `127.0.0.1:11434`.',
    '',
    'Things worth trying in the preview:',
    '',
    '- **build me a tic tac toe game** → opens a runnable artifact in the side panel',
    '- **explain how to build an HTML app** → must NOT open an artifact (that is the Tic Tac Toe loop guard)',
    '- avatar (bottom-left) → Settings → Appearance → flip Theme to Light',
    '- `Ctrl+J` → AI-Brain panel → Capsules / Never-check / Today',
    '- Help → Today → the Today view with follow-up controls',
  ].join('\n')
}

const TIC_TAC_TOE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tic Tac Toe</title>
<style>
 body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#faf9f7;color:#171717}
 .b{display:grid;grid-template-columns:repeat(3,90px);gap:6px}
 button{width:90px;height:90px;font-size:34px;background:#fff;border:1px solid #ddd;border-radius:10px;cursor:pointer}
 h1{font-size:20px;margin:0 0 14px;text-align:center}
 #s{text-align:center;margin-top:12px}
</style></head><body><div>
<h1>Tic Tac Toe</h1>
<div class="b" id="b"></div><p id="s"></p>
<script>
let t=Array(9).fill(''),p='X';const b=document.getElementById('b'),s=document.getElementById('s');
function win(){return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(c=>t[c[0]]&&c.every(i=>t[i]===t[c[0]]))}
function draw(){b.innerHTML='';t.forEach((v,i)=>{const d=document.createElement('button');d.textContent=v;d.onclick=()=>{if(t[i]||win())return;t[i]=p;p=p==='X'?'O':'X';draw()};b.appendChild(d)});
const w=win();s.textContent=w?t[w[0]]+' wins!':t.every(Boolean)?"It's a draw":'Turn: '+p}
draw();
</script></div></body></html>`

const ARTIFACT_REPLY = `Here you go — a runnable artifact:

\`\`\`html
${TIC_TAC_TOE}
\`\`\`

It opens in the artifacts panel on the right.`

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (req.url.startsWith('/api/tags')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ models: MODELS }))
  }

  // POST /api/show — the app verifies the selected model is local before it
  // will send. Without this the preview cannot send at all.
  if (req.url.startsWith('/api/show')) {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      let name = ''
      try { name = JSON.parse(body || '{}').model || '' } catch (e) { /* ignore */ }
      const known = MODELS.find((m) => m.name === name)
      res.writeHead(known ? 200 : 404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(known ? {
        details: { family: known.details.family, parameter_size: known.details.parameter_size, quantization_level: 'Q4_K_M' },
        capabilities: /vl|vision/i.test(name) ? ['completion', 'vision'] : ['completion'],
      } : { error: `model '${name}' not found (mock)` }))
    })
    return
  }

  if (req.url.startsWith('/api/chat')) {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', async () => {
      let payload = {}
      try {
        payload = JSON.parse(body || '{}')
      } catch (e) {
        /* ignore */
      }
      const msgs = payload.messages || []
      const prompt = (msgs.find((m) => m.role === 'user') || {}).content || ''
      const text = /\b(tic|tac|toe|game|snake|flappy|build me|make me)\b/i.test(prompt)
        ? ARTIFACT_REPLY
        : replyFor(prompt)

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' })
      const chunks = text.match(/[\s\S]{1,7}/g) || []
      for (const c of chunks) {
        res.write(
          JSON.stringify({
            model: payload.model || MODELS[0].name,
            created_at: new Date().toISOString(),
            message: { role: 'assistant', content: c },
            done: false,
          }) + '\n',
        )
        await new Promise((r) => setTimeout(r, 10))
      }
      res.write(
        JSON.stringify({
          model: payload.model || MODELS[0].name,
          created_at: new Date().toISOString(),
          message: { role: 'assistant', content: '' },
          done: true,
          done_reason: 'stop',
        }) + '\n',
      )
      res.end()
    })
    return
  }

  if (req.url === '/' || req.url === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ version: '0.0.0-mock' }))
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-ollama] http://127.0.0.1:${PORT}  (DEMO ONLY — not real Ollama)`)
})
