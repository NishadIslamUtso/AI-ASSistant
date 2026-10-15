function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

let modalStyleInjected = false;
function injectModalStyle() {
  if (modalStyleInjected) return;
  try {
    const style = document.createElement('style');
    style.textContent = `
      .ai-assist-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2147483646; display:flex; align-items:center; justify-content:center; }
      .ai-assist-modal { background:#1e1e1e; border:1px solid #333; border-radius:12px; padding:20px; width:420px; max-width:90vw; color:#fff; font-family: ui-sans-serif, system-ui; box-shadow:0 16px 40px rgba(0,0,0,0.6); }
      .ai-assist-modal h3 { margin:0 0 12px; font-size:14px; }
      .ai-assist-modal label { display:block; font-size:11px; color:#aaa; margin:10px 0 4px; }
      .ai-assist-modal input, .ai-assist-modal textarea { width:100%; background:#2a2a2a; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px; box-sizing:border-box; }
      .ai-assist-modal textarea { min-height:60px; resize:vertical; }
      .ai-assist-modal .row { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; }
      .ai-assist-btn { background:#3a3a3a; color:#fff; border:1px solid #444; padding:7px 14px; border-radius:20px; cursor:pointer; font-size:12px; }
      .ai-assist-btn.primary { background:#fff; color:#000; border-color:#fff; }
      .ai-assist-btn:hover { opacity:0.9; }
      .ai-assist-toast { position:fixed; bottom:80px; right:20px; background:#1e1e1e; border:1px solid #333; color:#fff; padding:10px 14px; border-radius:8px; z-index:2147483647; font-size:12px; box-shadow:0 8px 20px rgba(0,0,0,0.4); }
      .ai-assist-fab { position:fixed; bottom:20px; right:20px; z-index:2147483645; background:#1a1a1a; color:#fff; border:1px solid #333; padding:8px 12px; border-radius:20px; cursor:pointer; font-size:12px; box-shadow:0 4px 12px rgba(0,0,0,0.3); }
      .ai-assist-fab:hover { background:#2a2a2a; }
      .ai-assist-cook { background:#2a2a2a; color:#fff; border:1px solid #444; padding:4px 10px; border-radius:20px; font-size:11px; cursor:pointer; margin-left:8px; }
    `;
    document.head.appendChild(style);
    modalStyleInjected = true;
  } catch(e) {}
}

function showToast(msg) {
  if (!isExtensionValid()) return;
  try {
    injectModalStyle();
    const t = document.createElement('div');
    t.className = 'ai-assist-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ try { t.remove(); } catch(e) {} }, 3000);
  } catch(e) {}
}

function showCapsuleModal(defaultTitle="") {
  return new Promise(resolve => {
    if (!isExtensionValid()) { resolve(null); return; }
    try {
      injectModalStyle();
      const overlay = document.createElement('div');
      overlay.className = 'ai-assist-overlay';
      overlay.innerHTML = `
        <div class="ai-assist-modal">
          <h3>Capture as Capsule</h3>
          <label>Capsule title</label>
          <input id="cap-title" value="${defaultTitle.replace(/"/g,'&quot;')}" placeholder="e.g. Website project - blue-white">
          <label>Goal</label>
          <input id="cap-goal" placeholder="e.g. Build website for CSE220">
          <label>Constraint</label>
          <input id="cap-constraint" placeholder="e.g. Simple step-by-step">
          <label>Background</label>
          <textarea id="cap-bg">${document.title.slice(0,300)}</textarea>
          <div class="row">
            <button class="ai-assist-btn" id="cap-cancel">Cancel</button>
            <button class="ai-assist-btn primary" id="cap-ok">Save Capsule</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const titleInput = overlay.querySelector('#cap-title');
      if (titleInput) titleInput.focus();
      overlay.querySelector('#cap-cancel').onclick = () => { try { overlay.remove(); } catch(e) {} resolve(null); };
      overlay.querySelector('#cap-ok').onclick = () => {
        try {
          const data = {
            title: overlay.querySelector('#cap-title').value.trim(),
            goal: overlay.querySelector('#cap-goal').value.trim(),
            constraint: overlay.querySelector('#cap-constraint').value.trim(),
            background: overlay.querySelector('#cap-bg').value.trim()
          };
          overlay.remove();
          resolve(data.title ? data : null);
        } catch(e) { resolve(null); }
      };
      overlay.addEventListener('click', e => { if (e.target===overlay){ try { overlay.remove(); } catch(err) {} resolve(null); } });
    } catch(e) { resolve(null); }
  });
}

function showCookModal(original, enhanced, contextUsed) {
  return new Promise(resolve => {
    if (!isExtensionValid()) { resolve(null); return; }
    try {
      injectModalStyle();
      const overlay = document.createElement('div');
      overlay.className = 'ai-assist-overlay';
      overlay.innerHTML = `
        <div class="ai-assist-modal" style="width:520px;">
          <h3>Cook This Prompt</h3>
          <label>Context used (${contextUsed.length} capsules)</label>
          <div style="background:#2a2a2a; border:1px solid #333; border-radius:6px; padding:8px; font-size:11px; color:#aaa; max-height:80px; overflow:auto; margin-bottom:10px;">
            ${contextUsed.map(c=>`<div>• ${c.title}</div>`).join('') || 'No relevant context - will use original'}
          </div>
          <label>Enhanced prompt</label>
          <textarea id="cook-text" style="min-height:120px;">${enhanced.replace(/</g,'&lt;')}</textarea>
          <div class="row">
            <button class="ai-assist-btn" id="cook-cancel">Cancel</button>
            <button class="ai-assist-btn primary" id="cook-ok">Use Enhanced</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#cook-cancel').onclick = () => { try { overlay.remove(); } catch(e) {} resolve(null); };
      overlay.querySelector('#cook-ok').onclick = () => {
        try {
          const val = overlay.querySelector('#cook-text').value;
          overlay.remove();
          resolve(val);
        } catch(e) { resolve(null); }
      };
    } catch(e) { resolve(null); }
  });
}

function addCaptureButton() {
  if (!isExtensionValid()) return;
  try {
    if (document.getElementById('ai-assist-fab-capsule')) return;
    injectModalStyle();
    const btn = document.createElement('button');
    btn.id = 'ai-assist-fab-capsule';
    btn.className = 'ai-assist-fab';
    btn.textContent = 'Capture as Capsule';
    btn.onclick = async () => {
      if (!isExtensionValid()) { showToast("Extension updated, please reload page"); return; }
      const defaultTitle = document.title.slice(0,60);
      const data = await showCapsuleModal(defaultTitle);
      if (!data) return;
      const capsule = {
        id: "capsule-"+Date.now(),
        title: data.title,
        goals: data.goal ? [data.goal] : [],
        constraints: data.constraint ? [data.constraint] : [],
        background: data.background,
        decisions: [],
        sources: [location.href],
        related_entities: [],
        attachments: [],
        importance: "normal",
        status: "active",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: 1
      };
      try {
        const local = await chrome.storage.local.get({capsules: []});
        const capsules = local.capsules || [];
        capsules.push(capsule);
        await chrome.storage.local.set({capsules});
      } catch(e) {}
      try { 
        await postCapture({type: "capsule", capsule}); 
        showToast("Capsule saved: "+capsule.title);
      } catch(e) { 
        showToast("Queued - app offline, will sync when app starts");
      }
    };
    document.body.appendChild(btn);
  } catch(e) {}
}

document.addEventListener('dragover', e => { try { e.preventDefault(); } catch(err) {} });
document.addEventListener('drop', async e => {
  if (!isExtensionValid()) return;
  try {
    const capsuleData = e.dataTransfer.getData('application/x-capsule');
    if (!capsuleData) return;
    e.preventDefault();
    const capsule = JSON.parse(capsuleData);
    const input = document.querySelector('textarea, [contenteditable="true"], div[contenteditable="true"]');
    if (!input) { showToast("No chat input found"); return; }
    const text = `Context: ${capsule.title}\nGoals: ${capsule.goals.join(', ')}\nConstraints: ${capsule.constraints.join(', ')}\nBackground: ${capsule.background.slice(0,400)}`;
    const enhanced = await showCookModal("", text, [capsule]);
    if (!enhanced) return;
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = enhanced + "\n\n" + (input.value||"");
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.focus();
    } else {
      input.focus();
      try { document.execCommand('insertText', false, enhanced + "\n\n"); } catch(err) {}
    }
    showToast("Context injected");
  } catch(err) {}
});

async function addCookButton() {
  if (!isExtensionValid()) return;
  try {
    const composer = document.querySelector('textarea, div[contenteditable="true"]');
    if (!composer || document.getElementById('ai-assist-cook-btn')) return;
    const parent = composer.parentElement;
    if (!parent) return;
    const btn = document.createElement('button');
    btn.id = 'ai-assist-cook-btn';
    btn.className = 'ai-assist-cook';
    btn.textContent = 'Cook This Prompt';
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isExtensionValid()) { showToast("Extension updated, please reload page"); return; }
      const current = composer.value || composer.textContent || composer.innerText || "";
      if (!current.trim()) { showToast("Type a prompt first"); return; }
      try {
        const context = await getContext(current.slice(-200));
        const relevant = (context.capsules||[]).filter(c => {
          const title = (c.title||"").toLowerCase();
          const q = current.toLowerCase();
          if (title.includes('arena | benchmark') && !q.includes('arena')) return false;
          if (title.includes('cse220') && !q.includes('cse220') && !q.includes('teaching')) return false;
          return true;
        }).slice(0,3);
        let enhanced;
        if (relevant.length === 0) enhanced = current;
        else {
          const ctxText = relevant.map(c => `[${c.title}: Goals: ${c.goals.join(', ')} | Constraints: ${c.constraints.join(', ')}]`).join("\n");
          enhanced = ctxText + "\n\n" + current;
        }
        const result = await showCookModal(current, enhanced, relevant);
        if (result !== null) {
          if (composer.tagName === 'TEXTAREA') {
            composer.value = result;
            composer.dispatchEvent(new Event('input', {bubbles:true}));
          } else {
            composer.textContent = result;
            composer.dispatchEvent(new Event('input', {bubbles:true}));
          }
          composer.focus();
        }
      } catch(err) {}
    };
    parent.appendChild(btn);
  } catch(e) {}
}

setTimeout(() => { try { addCaptureButton(); addCookButton(); } catch(e) {} }, 1500);
setInterval(() => { try { addCookButton(); } catch(e) {} }, 4000);
\n// The approved screenshots' second crash path: a rejection that outlives the\n// extension context must never surface as a page error.\nwindow.addEventListener('unhandledrejection', (event) => {\n  if (String(event.reason || '').includes('Extension context invalidated')) event.preventDefault();\n});\n