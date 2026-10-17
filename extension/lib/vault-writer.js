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

/**
 * A REFUSED capture is recorded as metadata only - type, address, title,
 * time, reason. Never the page text: a browser record of a capture the app
 * declined is exactly the leak the pairing rule exists to prevent.
 * (The offline queue below is different by design: it is the outbox for a
 * capture the person's OWN extension made, held until the app returns,
 * clearable from the popup.)
 */
function rejectionRecord(dataWithTime, reason) {
  return { type: dataWithTime.type, url: dataWithTime.url, title: dataWithTime.title, captured_at: dataWithTime.captured_at, success: false, queued: false, reason };
}

async function recordActivity(entry) {
  try {
    const act = await safeStorageGet({activity: []});
    const activity = act.activity || [];
    activity.push(entry);
    if (activity.length > 100) activity.shift();
    await safeStorageSet({activity});
  } catch(e) {}
}

/**
 * The whole capture conversation with the app, in one function the background
 * service worker runs for every content script. Pages cannot reach the app
 * themselves (their own origin is refused at the door), so a capture travels:
 * content script -> this handler in the background (extension origin + pair
 * token) -> OddBrain. The popup may run it directly - same code.
 */
async function handleCaptureRelay(payload) {
  const dataWithTime = {...payload, captured_at: new Date().toISOString()};
  try {
    const res = await fetch(`${LOCAL_API}/capture`, {
      method: "POST",
      headers: await pairHeaders(true),
      body: JSON.stringify(dataWithTime)
    });
    if (res.status === 401 || res.status === 403) {
      // Not paired (or rotated out), or the origin was refused: the app
      // declined this capture. Nothing but the metadata is kept.
      await recordActivity(rejectionRecord(dataWithTime, res.status === 401
        ? "not paired - paste the token from OddBrain Settings > Plugins > Agent access"
        : "refused by the app (" + res.status + ")"));
      return {ok:false, unpaired: res.status === 401};
    }
    if (!res.ok) throw new Error("API not ok "+res.status);
    await recordActivity({...dataWithTime, success:true});
    return {ok:true};
  } catch (e) {
    // The crash in the approved screenshots: the extension was reloaded (or
    // its context torn down) while a write was in flight, and the rejection
    // escaped as an unhandled promise. The queue is best-effort by design —
    // a dead context has nothing to queue into, so record nothing and stay
    // quiet. A live context queues as before (the outbox, not a rejection).
    try {
      await queueCapture(dataWithTime);
    } catch (queued) {
      // Nothing to do: the context is gone; the page is fine.
    }
    throw e;
  }
}

async function postCapture(payload) {
  if (!isExtensionValid()) return;
  // Relay first: inside a web page, the request must go out from the
  // background (the page's own origin cannot speak to the app). No receiver
  // (the popup, or a plain test) runs the handler right here instead.
  try {
    const answer = await chrome.runtime.sendMessage({type: "ob-capture", payload});
    if (answer) return answer;
  } catch(e) { /* no listener in this context - run it here */ }
  return handleCaptureRelay(payload);
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
  module.exports = { getPairToken, pairHeaders, postCapture, handleCaptureRelay, flushQueue, getContext, queueCapture };
}
