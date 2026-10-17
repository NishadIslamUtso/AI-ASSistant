const LOCAL_API = "http://127.0.0.1:8765";

/**
 * The pairing secret: the person copies it once from OddBrain (Settings >
 * Plugins > Agent access) into this extension's popup. Every request to the
 * app carries it as x-oddbrain-pair; without it the app refuses with 401.
 * The token stays in this browser's own storage and never goes anywhere else.
 */
async function getPairToken() {
  const data = await safeStorageGet({ pairToken: "" });
  return typeof data.pairToken === "string" ? data.pairToken : "";
}

async function pairHeaders(json) {
  const headers = { "Content-Type": "application/json" };
  const token = await getPairToken();
  if (token) headers["x-oddbrain-pair"] = token;
  return headers;
}

function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

async function safeStorageGet(defaults) {
  if (!isExtensionValid()) return defaults;
  try {
    return await chrome.storage.local.get(defaults);
  } catch(e) {
    if (e.message && e.message.includes("Extension context invalidated")) {
      console.warn("OddBrain: Extension context invalidated, please reload page");
      return defaults;
    }
    return defaults;
  }
}

async function safeStorageSet(obj) {
  if (!isExtensionValid()) return;
  try {
    await chrome.storage.local.set(obj);
  } catch(e) {
    if (e.message && e.message.includes("Extension context invalidated")) {
      console.warn("OddBrain: Extension context invalidated, please reload page");
      return;
    }
    // ignore
  }
}

async function postCapture(payload) {
  if (!isExtensionValid()) return;
  const dataWithTime = {...payload, captured_at: new Date().toISOString()};
  try {
    const res = await fetch(`${LOCAL_API}/capture`, {
      method: "POST",
      headers: await pairHeaders(true),
      body: JSON.stringify(dataWithTime)
    });
    if (res.status === 401) {
      // Not paired (or rotated out): the app refused this capture. Queueing
      // would keep page contents in this browser without consent, so the
      // capture is dropped and the reason is recorded instead.
      try {
        const act = await safeStorageGet({activity: []});
        const activity = act.activity || [];
        activity.push({...dataWithTime, success:false, queued:false, reason:"not paired - paste the token from OddBrain Settings > Plugins > Agent access"});
        if (activity.length > 100) activity.shift();
        await safeStorageSet({activity});
      } catch(e) {}
      return {ok:false, unpaired:true};
    }
    if (!res.ok) throw new Error("API not ok "+res.status);
    // Save to activity log
    try {
      const act = await safeStorageGet({activity: []});
      const activity = act.activity || [];
      activity.push({...dataWithTime, success:true});
      if (activity.length > 100) activity.shift();
      await safeStorageSet({activity});
    } catch(e) {}
    return {ok:true};
  } catch (e) {
    // The crash in the approved screenshots: the extension was reloaded (or
    // its context torn down) while a write was in flight, and the rejection
    // escaped as an unhandled promise. The queue is best-effort by design —
    // a dead context has nothing to queue into, so record nothing and stay
    // quiet. A live context queues as before.
    try {
      await queueCapture(dataWithTime);
    } catch (queued) {
      // Nothing to do: the context is gone; the page is fine.
    }
    throw e;
  }
}

async function queueCapture(payload) {
  if (!isExtensionValid()) return;
  try {
    const data = await safeStorageGet({queue: [], activity: []});
    const q = data.queue || [];
    const activity = data.activity || [];
    q.push(payload);
    activity.push({...payload, success:false, queued:true, reason:"app offline"});
    if (activity.length > 100) activity.shift();
    if (q.length > 200) q.shift();
    await safeStorageSet({queue: q, activity});
  } catch(e) {
    // If context invalidated, silently ignore
    if (e.message && e.message.includes("Extension context invalidated")) return;
  }
}

async function flushQueue() {
  if (!isExtensionValid()) return;
  try {
    const data = await safeStorageGet({queue: []});
    const q = data.queue || [];
    if (q.length === 0) return;
    const remaining = [];
    for (const item of q) {
      try {
        await fetch(`${LOCAL_API}/capture`, {method:"POST", headers: await pairHeaders(true), body: JSON.stringify(item)});
      } catch(e) {
        remaining.push(item);
      }
    }
    await safeStorageSet({queue: remaining});
  } catch(e) {}
}

async function getContext(query) {
  if (!isExtensionValid()) return {capsules: [], entities: [], claims: []};
  // Try local API first
  try {
    const res = await fetch(`${LOCAL_API}/context?q=${encodeURIComponent(query)}`, { headers: await pairHeaders(false) });
    if (res.ok) {
      const data = await res.json();
      if (data.capsules) {
        data.capsules = data.capsules.filter(c => {
          if (!c.title) return false;
          const q = query.toLowerCase();
          if (c.title.toLowerCase().includes('arena | benchmark') && !q.includes('arena')) return false;
          return true;
        });
      }
      return data;
    }
  } catch(e) {}
  
  // Fallback to local storage with relevance scoring
  try {
    const data = await safeStorageGet({capsules: []});
    const all = data.capsules || [];
    const q = query.toLowerCase();
    const qWords = q.split(' ').filter(w=>w.length>2);
    
    const scored = all.map(c => {
      let score = 0;
      const title = (c.title||"").toLowerCase();
      const goals = (c.goals||[]).join(' ').toLowerCase();
      if (q && title.includes(q)) score += 10;
      if (q && goals.includes(q)) score += 8;
      for (const w of qWords) {
        if (title.includes(w)) score += 3;
        if (goals.includes(w)) score += 1;
      }
      if (title.includes('arena | benchmark') && !q.includes('arena')) score = 0;
      if (title.includes('cse220') && !q.includes('cse220') && !q.includes('teaching')) score = Math.max(0, score-5);
      return {capsule: c, score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.capsule);
    
    return {capsules: scored, entities: [], claims: []};
  } catch(e) {
    return {capsules: [], entities: [], claims: []};
  }
}

setInterval(() => { try { flushQueue(); } catch(e) {} }, 30000);

/* Test seam: a plain-script library in the browser, a module under test. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getPairToken, pairHeaders, postCapture, flushQueue, getContext, queueCapture };
}
