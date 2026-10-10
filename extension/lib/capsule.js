function isExtensionValid() {
  try { return !!(chrome.runtime && chrome.runtime.id); } catch(e) { return false; }
}

function createCapsule({title, goals=[], constraints=[], background="", decisions=[], sources=[], related_entities=[], attachments=[], importance="normal"}) {
  return {
    id: "capsule-" + Date.now(),
    title: title || "Untitled Capsule",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    version: 1,
    parent_id: null,
    goals,
    constraints,
    background,
    decisions,
    sources,
    related_entities,
    attachments,
    importance,
    status: "active"
  };
}

function newVersion(capsule, updates) {
  return {
    ...capsule,
    ...updates,
    version: capsule.version + 1,
    parent_id: capsule.id,
    id: capsule.id + "-v" + (capsule.version + 1),
    updated: new Date().toISOString()
  };
}

function toMarkdown(capsule) {
  return `---
id: ${capsule.id}
title: ${capsule.title}
---
# ${capsule.title}
`;
}

async function saveCapsule(capsule) {
  if (!isExtensionValid()) return;
  try {
    const data = await chrome.storage.local.get({capsules: []});
    const capsules = data.capsules || [];
    capsules.push(capsule);
    await chrome.storage.local.set({capsules});
    try { await postCapture({type: "capsule", capsule}); } catch(e) {}
  } catch(e) {
    if (e.message && e.message.includes("Extension context invalidated")) return;
  }
}
