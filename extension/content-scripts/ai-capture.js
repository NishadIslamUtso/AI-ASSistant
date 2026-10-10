function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

const PROVIDERS = {
  "chat.openai.com": "ChatGPT",
  "chatgpt.com": "ChatGPT",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "aistudio.google.com": "Gemini",
  "chat.deepseek.com": "DeepSeek",
  "www.deepseek.com": "DeepSeek",
  "grok.com": "Grok",
  "www.perplexity.ai": "Perplexity",
  "copilot.microsoft.com": "Copilot"
};

function getProvider() {
  try { return PROVIDERS[location.hostname] || "Other"; } catch(e) { return "Other"; }
}

function captureSubmittedMessages() {
  if (!isExtensionValid()) return [];
  const messages = [];
  const selectors = ['[data-message-author-role]', '[data-testid="conversation-turn"]', '.font-claude-message', '.message'];
  for (const sel of selectors) {
    try {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 10) {
          messages.push({role: el.getAttribute('data-message-author-role') || 'unknown', text: text.slice(0,5000), timestamp: new Date().toISOString()});
        }
      });
    } catch(e) {}
    if (messages.length > 0) break;
  }
  return messages;
}

document.addEventListener('click', async (e) => {
  if (!isExtensionValid()) return;
  const target = e.target;
  const isSend = target.closest('button[data-testid="send-button"], button[aria-label="Send"]') || target.textContent?.includes('Send');
  if (isSend) {
    setTimeout(async () => {
      if (!isExtensionValid()) return;
      try {
        const url = location.href;
        if (await checkBlacklist(url)) return;
        const messages = captureSubmittedMessages();
        if (messages.length === 0) {
          try { await postCapture({type: "wasnt_accessible", url, reason: "no messages found - layout changed", provider: getProvider()}); } catch(err) {}
          return;
        }
        try { await postCapture({type: "conversation", provider: getProvider(), url, title: document.title, conversation_id: url.split('/').pop(), messages, completeness: "full"}); } catch(err) {}
      } catch(err) {}
    }, 1000);
  }
});

setTimeout(async () => {
  if (!isExtensionValid()) return;
  try {
    const url = location.href;
    if (await checkBlacklist(url)) return;
    const messages = captureSubmittedMessages();
    if (messages.length > 0) {
      try { await postCapture({type: "conversation", provider: getProvider(), url, title: document.title, conversation_id: url.split('/').pop(), messages, completeness: "full"}); } catch(err) {}
    }
  } catch(err) {}
}, 2000);
