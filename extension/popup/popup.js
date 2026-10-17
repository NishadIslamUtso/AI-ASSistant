// Popup v1.1 - handles optional permissions, better relevance

async function checkPermissions() {
  const broad = await chrome.permissions.contains({origins: ["<all_urls>"]});
  const history = await chrome.permissions.contains({permissions: ["history"]});
  document.getElementById('broad-banner').style.display = broad ? 'none' : 'block';
  document.getElementById('history-banner').style.display = history ? 'none' : 'block';
  document.getElementById('status').textContent = broad ? '● Broad access' : '● AI sites only';
  document.getElementById('status').style.color = broad ? '#0a0' : '#aa0';
}

document.getElementById('enable-broad')?.addEventListener('click', async () => {
  const granted = await chrome.permissions.request({origins: ["<all_urls>"]});
  if (granted) checkPermissions();
});

document.getElementById('enable-history')?.addEventListener('click', async () => {
  const granted = await chrome.permissions.request({permissions: ["history"]});
  if (granted) checkPermissions();
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.content').forEach(c=>c.style.display='none');
    document.getElementById(tab.dataset.tab+'-tab').style.display='block';
    if (tab.dataset.tab === 'capsules') loadCapsules();
    if (tab.dataset.tab === 'blacklist') loadBlacklist();
    if (tab.dataset.tab === 'activity') loadActivity();
  });
});

async function loadCapsules() {
  const data = await chrome.storage.local.get({capsules: []});
  const search = document.getElementById('search').value.toLowerCase();
  let capsules = data.capsules || [];
  // Filter out low-quality test data unless searched
  if (!search) {
    capsules = capsules.filter(c => {
      const t = (c.title||"").toLowerCase();
      if (t.includes('arena | benchmark') && t.length < 50) return false;
      return true;
    });
  }
  if (search) {
    capsules = capsules.filter(c => 
      c.title.toLowerCase().includes(search) || 
      (c.background||"").toLowerCase().includes(search) ||
      (c.goals||[]).join(' ').toLowerCase().includes(search)
    );
  }
  const list = document.getElementById('capsule-list');
  list.innerHTML = capsules.slice(-20).reverse().map(c => `
    <div class="capsule" draggable="true" data-id="${c.id}">
      <div class="capsule-title">${c.title}</div>
      <div class="capsule-meta">v${c.version} • ${(c.goals||[]).join(', ').slice(0,60) || c.background.slice(0,60)} • ${new Date(c.updated).toLocaleDateString()}</div>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:11px;">No capsules yet. Click Capture as Capsule on any AI chat.</p>';

  list.querySelectorAll('.capsule').forEach(el => {
    el.addEventListener('dragstart', e => {
      const id = el.dataset.id;
      const capsule = capsules.find(c=>c.id===id);
      e.dataTransfer.setData('application/x-capsule', JSON.stringify(capsule));
      e.dataTransfer.setData('text/plain', `[${capsule.title}] ${capsule.goals.join(', ')}`);
    });
  });
}

document.getElementById('search')?.addEventListener('input', loadCapsules);

async function loadBlacklist() {
  const data = await chrome.storage.sync.get({excluded_patterns: []});
  const list = document.getElementById('blacklist-list');
  const patterns = data.excluded_patterns || [];
  list.innerHTML = patterns.map(p => `
    <div class="blacklist-item">
      <span>${p}</span>
      <button data-pattern="${p}" class="remove-blacklist">Remove</button>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:11px;">Empty = check everything (your default rule)</p>';

  list.querySelectorAll('.remove-blacklist').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pattern = btn.dataset.pattern;
      const d = await chrome.storage.sync.get({excluded_patterns: []});
      const filtered = (d.excluded_patterns||[]).filter(x=>x!==pattern);
      await blacklistChanged(filtered);
      loadBlacklist();
    });
  });
}

// Pairing: the token the person pasted from OddBrain's Agent access card.
async function loadPairing() {
  try {
    const data = await chrome.storage.local.get({pairToken: ""});
    document.getElementById('pair-token').value = data.pairToken || "";
    const status = document.getElementById('pair-status');
    status.textContent = data.pairToken ? "\u25cf Paired with this browser's stored token." : "No token yet - captures will be refused (401) until you paste one.";
    status.style.color = data.pairToken ? "#0a0" : "#e0a000";
  } catch(e) {}
}
document.getElementById('pair-save')?.addEventListener('click', async () => {
  const value = document.getElementById('pair-token').value.trim();
  await chrome.storage.local.set({pairToken: value});
  const status = document.getElementById('pair-status');
  status.textContent = value ? "Saved. The next capture carries it as x-oddbrain-pair." : "Cleared.";
  status.style.color = value ? "#0a0" : "#e0a000";
});
document.getElementById('pair-clear')?.addEventListener('click', async () => {
  await chrome.storage.local.set({pairToken: ""});
  document.getElementById('pair-token').value = "";
  loadPairing();
});
loadPairing();

// Blacklist changes ride the same message door as captures: the background
// tells the APP (the vault is the source of truth), and the local copy below
// is the offline mirror. A write that only touched this browser would be
// silently undone by the next sync from the app.
async function blacklistChanged(list) {
  await chrome.storage.sync.set({excluded_patterns: list});
  try { await chrome.runtime.sendMessage({type: "ob-blacklist-update", excluded_patterns: list}); } catch(e) {}
}

document.getElementById('blacklist-add')?.addEventListener('click', async () => {
  const input = document.getElementById('blacklist-input');
  const pattern = input.value.trim();
  if (!pattern) return;
  const data = await chrome.storage.sync.get({excluded_patterns: []});
  const list = data.excluded_patterns || [];
  if (!list.includes(pattern)) {
    list.push(pattern);
    await blacklistChanged(list);
    input.value = '';
    loadBlacklist();
  }
});

async function loadActivity() {
  const data = await chrome.storage.local.get({queue: [], activity: []});
  const queue = data.queue || [];
  const activity = data.activity || [];
  const log = document.getElementById('activity-log');
  const items = [...activity.slice(-20).reverse(), ...queue.map(q=>({...q, queued:true}))];
  log.innerHTML = items.map(item => `
    <div class="log">
      ${item.queued ? '[QUEUED] ' : ''}${item.type} - ${(item.url||item.title||'').slice(0,60)} - ${item.reason||item.capture_status||''} - ${new Date(item.captured_at||Date.now()).toLocaleTimeString()}
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:11px;">No activity yet</p>';
}

document.getElementById('capture-current')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  try {
    await chrome.scripting.executeScript({target:{tabId: tab.id}, files:["content-scripts/generic-capture.js"]});
  } catch(e) {}
  window.close();
});

document.getElementById('clear-queue')?.addEventListener('click', async () => {
  await chrome.storage.local.set({queue: [], activity: []});
  loadActivity();
});

document.getElementById('test-offline')?.addEventListener('click', async () => {
  await chrome.storage.local.set({queue: [{type:"test", url:"https://example.com", reason:"test offline", captured_at: new Date().toISOString()}]});
  loadActivity();
});

// Initial
checkPermissions();
loadCapsules();
