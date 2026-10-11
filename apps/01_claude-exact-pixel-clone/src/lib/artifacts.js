export function wantsArtifact(prompt, explicitlyEnabled = false) {
  if (explicitlyEnabled) return true
  if (/\b(?:don't|do not|never)\s+(?:create|make|build|generate|write)\b/i.test(prompt)) return false
  if (/\b(?:explain|how (?:do|can|to)|what is|review|debug)\b/i.test(prompt)) return false
  return /\b(?:create|build|make|generate|write|design|implement)\b[\s\S]{0,100}\b(?:artifact|html|website|web\s*(?:page|app)|application|interactive|game|dashboard|calculator)\b/i.test(prompt)
}
export function extractArtifacts(content, { requested, messageId, chatId, title }) {
  if (!requested) return []
  const artifacts = []
  const matches = [...content.matchAll(/```(html|svg)\s*\n([\s\S]*?)\n?```/gi)]
  if (!matches.length && /^\s*(?:<!doctype html|<html\b)/i.test(content) && /<\/html>\s*$/i.test(content)) {
    matches.push([content, 'html', content])
  }
  for (const match of matches.slice(0, 4)) {
    const source = match[2].trim()
    if (!source || source.length > 200_000) continue
    const type = match[1].toLowerCase()
    const htmlTitle = source.match(/<title>([^<]{1,100})<\/title>/i)?.[1]
    artifacts.push({
      id: `${messageId}-artifact-${artifacts.length}`, chatId, messageId, type,
      title: htmlTitle || title.slice(0, 60) || (type === 'html' ? 'HTML Application' : 'SVG Image'),
      createdAt: new Date().toISOString(), versions: [{ content: source, savedAt: new Date().toISOString() }],
    })
  }
  return artifacts
}
export const artifactSource = (artifact, version = artifact.versions.length - 1) => artifact.versions[version]?.content || ''
// Inline Visualizer (stolen from open-webui-plugins): while the model is still
// streaming, surface the last html/svg fence even before its closing ``` so the
// preview can render live. Returns null until there is enough markup to render.
export function extractLiveSource(content) {
  if (!content) return null
  const openers = [...content.matchAll(/```(html|svg)\s*\n/gi)]
  if (!openers.length) return null
  const last = openers[openers.length - 1]
  const start = last.index + last[0].length
  const rest = content.slice(start)
  const close = rest.indexOf('```')
  const source = (close === -1 ? rest : rest.slice(0, close)).trim()
  if (source.length < 80) return null
  return { type: last[1].toLowerCase(), source, complete: close !== -1 }
}
export function buildPreviewHtml(source, channel = 'artifact-preview') {
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
  // This is always the first head/CSP, even when the source contains a full page.
  // Additional CSPs in untrusted content cannot loosen this one.
  const channelJson = JSON.stringify(channel).replace(/</g, '\\u003c')
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif;background:white;color:#171717}*{box-sizing:border-box}body.pin-mode *{cursor:crosshair!important}body.pin-mode *:hover{outline:2px solid #d97757!important;outline-offset:1px}</style><script>
const channel = ${channelJson};
const report = message => parent.postMessage({type:'ai-assistant-artifact-error',channel,message:String(message).slice(0,500)}, '*');
addEventListener('error', event => report(event.message));
addEventListener('unhandledrejection', event => report(event.reason?.message || event.reason));
addEventListener('click', event => {const link=event.target.closest?.('a');if(link && !link.getAttribute('href')?.startsWith('#')) event.preventDefault();},true);
let pinOn = false;
addEventListener('message', event => {
  const data = event.data || {};
  if (data.channel !== channel) return;
  if (data.type === 'ai-assistant-pin-mode') { pinOn = Boolean(data.on); document.body.classList.toggle('pin-mode', pinOn); }
});
function selectorPath(el) {
  const parts = []; let cur = el;
  while (cur && cur !== document.body && cur.parentElement && parts.length < 6) {
    const index = Array.from(cur.parentElement.children).indexOf(cur);
    parts.unshift(cur.tagName.toLowerCase() + ':nth-child(' + (index + 1) + ')');
    cur = cur.parentElement;
  }
  return parts.join(' > ');
}
addEventListener('click', event => {
  if (!pinOn) return;
  event.preventDefault(); event.stopPropagation();
  const el = event.target; if (!el || el === document.body) return;
  parent.postMessage({type:'ai-assistant-artifact-pin', channel, selector: selectorPath(el), snippet: String(el.outerHTML || '').slice(0, 600)}, '*');
}, true);
</script></head><body>${source}</body></html>`
}
