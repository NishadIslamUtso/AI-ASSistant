import { explicitlyAsked } from './artifacts.js'

/**
 * demo.js — offline "demo responder".
 *
 * This exists so the UI can be exercised (streaming, markdown, artifacts,
 * thinking panel) on a machine where Ollama is not running. It is OFF by
 * default, it is clearly labelled in the transcript when it answers, and it is
 * never used when a real model is reachable.
 *
 * Enable it with ?demo=1 in the URL or the switch in Settings > Capabilities.
 */

const TIC_TAC_TOE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Tic Tac Toe</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: system-ui, -apple-system, Segoe UI, sans-serif; background:#f6f5f3; }
  .wrap { text-align:center; }
  h1 { font-size:20px; margin:0 0 4px; font-weight:600; }
  #status { color:#666; font-size:14px; margin-bottom:14px; }
  .board { display:grid; grid-template-columns:repeat(3,84px); gap:8px; justify-content:center; }
  .cell { width:84px; height:84px; background:#fff; border:1px solid #e3e2e0; border-radius:10px;
          font-size:34px; font-weight:600; color:#1a1a1a; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:background .12s; }
  .cell:hover { background:#faf9f8; }
  .cell:disabled { cursor:default; }
  button.action { margin-top:16px; padding:8px 16px; border-radius:8px; border:1px solid #d6d5d3;
                  background:#fff; cursor:pointer; font-size:14px; }
  button.action:hover { background:#faf9f8; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Tic Tac Toe</h1>
    <div id="status">Your turn (X)</div>
    <div class="board" id="board"></div>
    <button class="action" onclick="reset()">New game</button>
  </div>
<script>
  const board = document.getElementById('board');
  const status = document.getElementById('status');
  let cells = Array(9).fill('');
  let turn = 'X';
  let over = false;
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function draw() {
    board.innerHTML = '';
    cells.forEach((v, i) => {
      const b = document.createElement('button');
      b.className = 'cell';
      b.textContent = v;
      b.disabled = over || !!v;
      b.onclick = () => play(i);
      board.appendChild(b);
    });
  }
  function winner() {
    for (const l of LINES) if (cells[l[0]] && cells[l[0]] === cells[l[1]] && cells[l[1]] === cells[l[2]]) return cells[l[0]];
    return cells.every(Boolean) ? 'draw' : null;
  }
  function play(i) {
    if (over || cells[i]) return;
    cells[i] = turn;
    const w = winner();
    if (w) { over = true; draw(); status.textContent = w === 'draw' ? "It's a draw" : w + ' wins'; return; }
    turn = turn === 'X' ? 'O' : 'X';
    draw();
    status.textContent = 'Your turn (' + turn + ')';
    if (turn === 'O') setTimeout(best, 260);
  }
  function best() {
    const empty = cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length || winner()) return;
    cells[empty[Math.floor(Math.random() * empty.length)]] = 'O';
    const w = winner();
    if (w) { over = true; draw(); status.textContent = w === 'draw' ? "It's a draw" : w + ' wins'; return; }
    turn = 'X'; draw(); status.textContent = 'Your turn (X)';
  }
  function reset() { cells = Array(9).fill(''); turn = 'X'; over = false; status.textContent = 'Your turn (X)'; draw(); }
  draw();
</script>
</body>
</html>`

const DEMO_PAGE = (title = 'Demo page') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; background:#f6f5f3; color:#1a1a1a;
         margin:0; padding:32px; }
  .card { max-width:520px; margin:0 auto; background:#fff; border:1px solid #e6e5e3;
          border-radius:14px; padding:24px; }
  h1 { margin:0 0 8px; font-size:20px; }
  p { color:#555; line-height:1.6; }
  button { margin-top:12px; padding:8px 14px; border-radius:8px; border:1px solid #d6d5d3;
           background:#faf9f8; cursor:pointer; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>This artifact was produced by the demo responder so you can check the
       artifact panel, preview and code tabs.</p>
    <button onclick="this.textContent = 'Clicked ' + new Date().toLocaleTimeString()">
      Click me
    </button>
  </div>
</body>
</html>`

function replyFor(prompt, userName) {
  const p = String(prompt).trim()
  const asked = explicitlyAsked(p)
  const wantsGame = /\b(game|tic[\s-]?tac[\s-]?toe|snake|tetris|pong|flappy)\b/i.test(p)

  if (asked && wantsGame) {
    return `Here you go — a complete, playable Tic Tac Toe game.\n\n\`\`\`html\n${TIC_TAC_TOE}\n\`\`\`\n\nOpen it in the artifact panel to play.`
  }
  if (asked) {
    const title = (p.replace(/\b(make|create|build|write|generate|give me)\b/gi, '').trim() || 'Demo page').slice(0, 40)
    return `Here is a self-contained page for that.\n\n\`\`\`html\n${DEMO_PAGE(title)}\n\`\`\`\n`
  }
  return [
    `Hi ${userName} — this answer comes from the **demo responder**, not from a model.`,
    '',
    'Ollama is not reachable, so nothing here is a real generation. Once `ollama serve` is running',
    'and `qwen2.5:3b` is pulled, this same box will reply for real.',
    '',
    'What the demo responder proves the UI can do:',
    '',
    '- stream a reply token by token',
    '- render **markdown**, lists, `inline code` and fenced blocks',
    '- open an HTML artifact in the side panel (try: "make me a tic tac toe game")',
    '',
    `\nYou wrote: "${p.slice(0, 160)}"`,
  ].join('\n')
}

/** Mimics chatStream(): calls onToken repeatedly, resolves when done. */
export function demoStream({ prompt, userName = 'there', onToken, signal, speed = 7 }) {
  return new Promise((resolve, reject) => {
    const full =
      '_Demo responder — Ollama offline._\n\n' + replyFor(prompt, userName)
    let i = 0
    const tick = () => {
      if (signal?.aborted) {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        return
      }
      if (i >= full.length) {
        resolve(full)
        return
      }
      const step = Math.max(1, Math.round(Math.random() * 5))
      onToken?.(full.slice(i, i + step))
      i += step
      setTimeout(tick, speed)
    }
    setTimeout(tick, 180)
  })
}
