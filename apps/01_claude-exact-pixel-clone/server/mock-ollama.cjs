/**
 * mock-ollama.cjs — Ollama-compatible stub for sandboxes / demos ONLY.
 *
 * It exists so the UI can be exercised (and screenshotted) on a machine that
 * has no Ollama and no GPU. It implements just enough of the Ollama HTTP API:
 *   GET  /api/tags
 *   POST /api/chat   (NDJSON streaming)
 *
 * It is NEVER used by start-app.bat — the real build always talks to the real
 * Ollama on 127.0.0.1:11434. Start it manually with `npm run dev:mock`.
 */
const http = require('http')

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 11434

const MODELS = [
  { name: 'qwen2.5:3b', model: 'qwen2.5:3b', size: 1900000000,
    details: { family: 'qwen2', parameter_size: '3B', quantization_level: 'Q4_K_M' } },
  { name: 'qwen3-vl:4b', model: 'qwen3-vl:4b', size: 2900000000,
    details: { family: 'qwen3', parameter_size: '4B', quantization_level: 'Q4_K_M' } },
]

function replyFor(prompt) {
  const p = String(prompt || '')
  const last = p.split('\n').filter((l) => l.trim()).slice(-1)[0] || ''
  return [
    `**(demo reply — mock Ollama, no model loaded)**`,
    ``,
    `You said: “${last.slice(0, 200)}”`,
    ``,
    `- This response comes from \`server/mock-ollama.cjs\`, not from qwen2.5:3b.`,
    `- On your TUF A15, \`start-app.bat\` starts the **real** Ollama and this app streams from \`127.0.0.1:11434\`.`,
    `- The vault API (\`127.0.0.1:8765\`) writes into \`vault/AI-Brain/\` as Markdown.`,
    ``,
    `Ask for “build me a tic-tac-toe game” and the reply will include an \`artifact:html\` block that opens in the Artifacts panel.`,
  ].join('\n')
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

  if (req.url.startsWith('/api/tags')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ models: MODELS }))
  }

  if (req.url.startsWith('/api/chat')) {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', async () => {
      let payload = {}
      try { payload = JSON.parse(body || '{}') } catch {}
      const msgs = payload.messages || []
      const prompt = (msgs.find((m) => m.role === 'user') || {}).content || ''
      const text = /tic|tac|toe|game|snake|flappy/i.test(prompt)
        ? ARTIFACT_DEMO
        : replyFor(prompt)

      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' })
      const chunks = text.match(/[\s\S]{1,7}/g) || []
      for (const c of chunks) {
        res.write(JSON.stringify({ model: payload.model || MODELS[0].name, created_at: new Date().toISOString(), message: { role: 'assistant', content: c }, done: false }) + '\n')
        await new Promise((r) => setTimeout(r, 12))
      }
      res.write(JSON.stringify({ model: payload.model || MODELS[0].name, created_at: new Date().toISOString(), message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop' }) + '\n')
      res.end()
    })
    return
  }

  if (req.url === '/' || req.url === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ version: '0.0.0-mock' }))
  }

  res.writeHead(404); res.end('not found')
})

const ARTIFACT_DEMO = `Here you go — a runnable artifact:

\`\`\`artifact:html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tic Tac Toe</title>
<style>
 body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#faf9f7}
 .b{display:grid;grid-template-columns:repeat(3,90px);gap:6px}
 button{width:90px;height:90px;font-size:34px;background:#fff;border:1px solid #ddd;border-radius:10px;cursor:pointer}
 h1{font-size:20px;margin:0 0 14px}
</style></head><body><div>
<h1>Tic Tac Toe — artifact demo</h1>
<div class="b" id="b"></div><p id="s" style="text-align:center"></p>
<script>
let t=Array(9).fill(''),p='X';const b=document.getElementById('b'),s=document.getElementById('s');
function win(){return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(c=>t[c[0]]&&c.every(i=>t[i]===t[c[0]]))}
function draw(){b.innerHTML='';t.forEach((v,i)=>{const d=document.createElement('button');d.textContent=v;d.onclick=()=>{if(t[i]||win())return;t[i]=p;p=p==='X'?'O':'X';draw()};b.appendChild(d)});
const w=win();s.textContent=w?w.map(i=>t[i])[0]+' wins!':t.every(Boolean)?'Draw':'Turn: '+p}
draw();
</script></div></body></html>
\`\`\`

It opens in the Artifacts panel on the right.`

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-ollama] listening on http://127.0.0.1:${PORT}  (DEMO ONLY — not real Ollama)`)
})
