// Background v1.1 - optional history, less warnings

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({id: "collect-now", title: "Collect this page now", contexts: ["page"]});
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
        await fetch("http://127.0.0.1:8765/capture", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
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

// Message handler for popup to request permissions
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "request_broad_access") {
    const granted = await chrome.permissions.request({origins: ["<all_urls>"]});
    return {granted};
  }
  if (msg.type === "request_history") {
    const granted = await chrome.permissions.request({permissions: ["history"]});
    if (granted) setupHistoryListener();
    return {granted};
  }
});
