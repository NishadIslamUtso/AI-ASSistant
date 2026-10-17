// Background v1.2 - page captures relay through here (a page's own origin
// cannot speak to the app; the background speaks as the extension, with the
// pairing token), optional history, fewer warnings.

importScripts('lib/vault-writer.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({id: "collect-now", title: "Collect this page now", contexts: ["page"]});
  chrome.contextMenus.create({id: "capture-structure", title: "Capture page structure (a11y tree)", contexts: ["page"]});
  chrome.contextMenus.create({id: "never-check", title: "Never check this site again", contexts: ["page"]});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "collect-now") {
    try {
      await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ["content-scripts/generic-capture.js"]});
    } catch(e) {
      console.error(e);
    }
  }
  if (info.menuItemId === "capture-structure") {
    try {
      await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ["content-scripts/a11y-capture.js"]});
    } catch(e) {
      console.error(e);
    }
  }
  if (info.menuItemId === "never-check") {
    try {
      const url = new URL(tab.url);
      const pattern = url.hostname + "/*";
      const data = await chrome.storage.sync.get({excluded_patterns: []});
      const list = data.excluded_patterns || [];
      if (!list.includes(pattern)) {
        list.push(pattern);
        await chrome.storage.sync.set({excluded_patterns: list});
      }
    } catch(e) {}
  }
});

// History listener - only if permission granted
async function hasHistoryPermission() {
  return await chrome.permissions.contains({permissions: ["history"]});
}

async function setupHistoryListener() {
  if (await hasHistoryPermission()) {
    chrome.history.onVisited.addListener(async (historyItem) => {
      const url = historyItem.url;
      const title = historyItem.title || "";
      const visited_at = new Date().toISOString();
      
      // Check blacklist
      try {
        const data = await chrome.storage.sync.get({excluded_patterns: []});
        const patterns = data.excluded_patterns || [];
        const isExcluded = patterns.some(p => url.includes(p.replace('/*','')));
        if (isExcluded) return;
      } catch(e) {}
      
      try {
        const token = await new Promise((done) => {
          try { chrome.storage.local.get({pairToken: ""}, (d) => done(typeof d.pairToken === "string" ? d.pairToken : "")); } catch(e) { done(""); }
        });
        await fetch("http://127.0.0.1:8765/capture", {
          method:"POST",
          headers:{"Content-Type":"application/json", "x-oddbrain-pair": token},
          body: JSON.stringify({type:"browser_visit", url, title, visited_at, capture_status:"visit-only", source:"history-api", captured_at: visited_at})
        });
      } catch(e) {
        // Queue
        const qdata = await chrome.storage.local.get({queue: []});
        const q = qdata.queue || [];
        q.push({type:"browser_visit", url, title, visited_at, capture_status:"visit-only"});
        await chrome.storage.local.set({queue: q});
      }
    });
  }
}

setupHistoryListener();

// Message handler for popup and content scripts. The sendResponse/return-true
// pattern, not a returned Promise: Promise answers are only honoured by the
// newest Chromium releases, and sendResponse works on every version this
// extension will ever meet.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "ob-capture") {
    // The one door for every page capture: the shared handler carries the
    // pair token, drops refusals as metadata-only, and queues true offline
    // captures for the flush.
    handleCaptureRelay(msg.payload).then(sendResponse).catch((e) => sendResponse({ok:false, error:String(e && e.message || e)}));
    return true; // the channel stays open for the async answer
  }
  if (msg.type === "ob-blacklist-get") {
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8765/blacklist", { headers: await pairHeaders(false) });
        if (!res.ok) return sendResponse({relay: null});
        const data = await res.json();
        sendResponse({relay: Array.isArray(data && data.excluded_patterns) ? data.excluded_patterns : null});
      } catch (e) { sendResponse({relay: null}); }
    })();
    return true;
  }
  if (msg.type === "ob-blacklist-update") {
    (async () => {
      try {
        await fetch("http://127.0.0.1:8765/capture", {
          method: "POST",
          headers: await pairHeaders(true),
          body: JSON.stringify({ type: "blacklist_update", excluded_patterns: msg.excluded_patterns || [] }),
        });
        sendResponse({relay: true});
      } catch (e) { sendResponse({relay: null}); }
    })();
    return true;
  }
  if (msg.type === "request_broad_access") {
    chrome.permissions.request({origins: ["<all_urls>"]}).then((granted) => sendResponse({granted}));
    return true;
  }
  if (msg.type === "request_history") {
    chrome.permissions.request({permissions: ["history"]}).then(async (granted) => {
      if (granted) await setupHistoryListener();
      sendResponse({granted});
    });
    return true;
  }
  return undefined;
});
