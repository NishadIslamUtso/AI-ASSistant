function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

let suggestionBox = null;
let lastQuery = "";

function injectStyle() {
  try {
    if (document.getElementById('ai-assist-suggest-style')) return;
    const style = document.createElement('style');
    style.id = 'ai-assist-suggest-style';
    style.textContent = `
      #ai-assistant-suggestions { position:absolute; z-index:2147483646; background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:6px; max-width:320px; display:none; box-shadow:0 8px 24px rgba(0,0,0,0.5); font-family: ui-sans-serif, system-ui; }
      .ai-suggest-item { padding:8px; cursor:pointer; border-radius:6px; font-size:12px; color:#fff; }
      .ai-suggest-item:hover { background:#2a2a2a; }
      .ai-suggest-title { font-weight:600; font-size:12px; }
      .ai-suggest-meta { color:#aaa; font-size:10px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    `;
    document.head.appendChild(style);
  } catch(e) {}
}

function createSuggestionBox() {
  if (!isExtensionValid()) return null;
  try {
    injectStyle();
    if (suggestionBox) return suggestionBox;
    const box = document.createElement('div');
    box.id = 'ai-assistant-suggestions';
    document.body.appendChild(box);
    suggestionBox = box;
    return box;
  } catch(e) { return null; }
}

function isRelevant(capsule, query) {
  if (!isExtensionValid() || !query || query.length < 3) return false;
  try {
    const q = query.toLowerCase();
    const title = (capsule.title||"").toLowerCase();
    const goals = (capsule.goals||[]).join(' ').toLowerCase();
    if (title.includes('arena | benchmark') && !q.includes('arena') && !q.includes('benchmark')) return false;
    if (title.includes('cse220') && !q.includes('cse220') && !q.includes('teaching') && !q.includes('rate')) return false;
    let score = 0;
    if (title.includes(q)) score += 10;
    if (goals.includes(q)) score += 8;
    const qWords = q.split(' ').filter(w=>w.length>2);
    for (const w of qWords) {
      if (title.includes(w)) score += 2;
      if (goals.includes(w)) score += 1;
    }
    return score >= 2;
  } catch(e) { return false; }
}

async function showSuggestions(input, query) {
  if (!isExtensionValid() || query === lastQuery) return;
  lastQuery = query;
  try {
    const box = createSuggestionBox();
    if (!box) return;
    if (!query || query.length < 4) { box.style.display='none'; return; }
    const context = await getContext(query);
    const relevant = (context.capsules||[]).filter(c => isRelevant(c, query)).slice(0,4);
    if (relevant.length === 0) { box.style.display='none'; return; }
    box.innerHTML = relevant.map(item => 
      `<div class="ai-suggest-item" data-id="${item.id}">
        <div class="ai-suggest-title">${item.title}</div>
        <div class="ai-suggest-meta">${(item.goals||[]).join(', ').slice(0,80) || (item.background||"").slice(0,80)}</div>
      </div>`
    ).join('');
    const rect = input.getBoundingClientRect();
    box.style.left = (rect.left + window.scrollX) + 'px';
    box.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    box.style.display = 'block';
    box.querySelectorAll('.ai-suggest-item').forEach(el => {
      el.onclick = () => {
        if (!isExtensionValid()) return;
        try {
          const id = el.getAttribute('data-id');
          const selected = relevant.find(i=>i.id===id);
          if (selected) {
            const text = `[${selected.title}]`;
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
              const start = input.selectionStart || 0;
              input.value = input.value.slice(0,start) + text + ' ' + input.value.slice(start);
              input.dispatchEvent(new Event('input', {bubbles:true}));
            } else {
              try { document.execCommand('insertText', false, text + ' '); } catch(e) {}
            }
            box.style.display='none';
          }
        } catch(e) {}
      };
    });
  } catch(e) {}
}

let debounceTimer = null;
document.addEventListener('focusin', (e) => {
  if (!isExtensionValid()) return;
  try {
    const target = e.target;
    if (target.matches('textarea, input[type="text"], div[contenteditable="true"][role="textbox"], div[contenteditable="true"]')) {
      const handler = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (!isExtensionValid()) return;
          try {
            const query = (target.value || target.textContent || "").slice(-120);
            showSuggestions(target, query);
          } catch(err) {}
        }, 700);
      };
      target.addEventListener('input', handler);
      target.addEventListener('keyup', handler);
    }
  } catch(e) {}
});

document.addEventListener('click', (e) => {
  if (!isExtensionValid()) return;
  try {
    if (!e.target.closest('#ai-assistant-suggestions') && !e.target.matches('textarea, input, div[contenteditable]')) {
      if (suggestionBox) suggestionBox.style.display='none';
    }
  } catch(err) {}
});
