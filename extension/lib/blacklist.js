const DEFAULT_EXCLUDED = ["bank.com/*"];

function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

function globToRegex(glob) {
  try {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\$&');
    const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
    return new RegExp(regexStr);
  } catch(e) { return null; }
}

function isExcluded(url, patterns) {
  if (!url) return false;
  for (const pat of patterns) {
    try {
      const re = globToRegex(pat);
      if (re && re.test(url)) return true;
      if (url.includes(pat.replace('/*',''))) return true;
    } catch(e) {}
  }
  return false;
}

async function checkBlacklist(url) {
  if (!isExtensionValid()) return false;
  try {
    const data = await chrome.storage.sync.get({excluded_patterns: DEFAULT_EXCLUDED});
    return isExcluded(url, data.excluded_patterns || []);
  } catch(e) {
    if (e.message && e.message.includes("Extension context invalidated")) return false;
    return false;
  }
}

async function addToBlacklist(pattern) {
  if (!isExtensionValid()) return;
  try {
    const data = await chrome.storage.sync.get({excluded_patterns: DEFAULT_EXCLUDED});
    const list = data.excluded_patterns || [];
    if (!list.includes(pattern)) {
      list.push(pattern);
      await chrome.storage.sync.set({excluded_patterns: list});
      try { await postCapture({type: "blacklist_update", excluded_patterns: list}); } catch(e) {}
    }
  } catch(e) {}
}

async function removeFromBlacklist(pattern) {
  if (!isExtensionValid()) return;
  try {
    const data = await chrome.storage.sync.get({excluded_patterns: DEFAULT_EXCLUDED});
    const list = (data.excluded_patterns || []).filter(p => p !== pattern);
    await chrome.storage.sync.set({excluded_patterns: list});
    try { await postCapture({type: "blacklist_update", excluded_patterns: list}); } catch(e) {}
  } catch(e) {}
}
