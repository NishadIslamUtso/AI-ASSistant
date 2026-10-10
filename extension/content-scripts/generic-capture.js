function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

async function extractReadable() {
  try {
    const clone = document.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, iframe, noscript').forEach(el=>el.remove());
    const text = clone.body?.innerText || "";
    return text.trim().slice(0,10000);
  } catch(e) { return ""; }
}

(async () => {
  if (!isExtensionValid()) return;
  try {
    const url = location.href;
    if (await checkBlacklist(url)) return;
    const aiHosts = ["chat.openai.com","chatgpt.com","claude.ai","gemini.google.com","chat.deepseek.com","grok.com","perplexity.ai","copilot.microsoft.com"];
    if (aiHosts.some(h => location.hostname.includes(h))) return;
    const title = document.title;
    const content = await extractReadable();
    if (content.length < 100) return;
    try { await postCapture({type: "web_page", url, title, content, completeness: "full"}); } catch(e) {
      try { await postCapture({type: "wasnt_accessible", url, reason: "app offline or extraction failed"}); } catch(err) {}
    }
  } catch(e) {}
})();
