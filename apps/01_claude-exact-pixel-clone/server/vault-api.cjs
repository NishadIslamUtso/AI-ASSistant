const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8765;

// Vault path - try multiple locations
const configuredVaultPath = process.env.AI_BRAIN_PATH?.trim();
const repositoryStarterVaultPath = path.join(__dirname, '../../../vault/AI-Brain');
// Do not guess at personal folders; a personal vault must be explicitly selected via AI_BRAIN_PATH.
const possibleVaultPaths = [configuredVaultPath, repositoryStarterVaultPath].filter(Boolean);

let VAULT_PATH = null;
for (const p of possibleVaultPaths) {
  if (fs.existsSync(p)) { VAULT_PATH = p; break; }
}
if (!VAULT_PATH) {
  VAULT_PATH = path.join(__dirname, '../../../vault/AI-Brain');
  console.log('AI-Brain vault not found in configured locations; using the repository starter vault:', VAULT_PATH);
}

console.log('Vault path:', VAULT_PATH);

function safeSegment(value, fallback = 'item') {
  const result = String(value ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\.\.+/g, '-')
    .replace(/^\.+|[. ]+$/g, '')
    .slice(0, 120);
  return result || fallback;
}

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

// Ensure dirs
function ensureDir(rel) {
  const root = path.resolve(VAULT_PATH);
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error('Invalid vault path');
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
}

// Write browser activity JSONL
function appendJsonl(relFile, obj) {
  const full = path.join(VAULT_PATH, relFile);
  ensureDir(path.dirname(relFile));
  fs.appendFileSync(full, JSON.stringify(obj) + '\n', 'utf-8');
}

function appendActivity(relFile, text) {
  const full = path.join(VAULT_PATH, relFile);
  ensureDir(path.dirname(relFile));
  fs.appendFileSync(full, `- ${text}\n`, 'utf-8');
}

// Write markdown file
function writeMarkdown(relFile, content) {
  const full = path.join(VAULT_PATH, relFile);
  ensureDir(path.dirname(relFile));
  fs.writeFileSync(full, content, 'utf-8');
  return full;
}

// POST /capture - from extension and app
app.post('/capture', (req, res) => {
  const data = req.body;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth()+1).padStart(2,'0');
  const dateStr = now.toISOString().split('T')[0];

  try {
    if (data.type === 'browser_visit') {
      const rel = `02 Sources/Browser Activity/${year}/${month}.jsonl`;
      appendJsonl(rel, {
        url: data.url,
        title: data.title,
        visited_at: data.visited_at || data.captured_at,
        capture_status: data.capture_status || 'visit-only',
        source: data.source || 'history-api'
      });
      // Activity log
      appendActivity(`09 Activity & Undo/${year}/${month}.md`, `[${now.toISOString()}] visit ${data.url} - ${data.capture_status}`);
    } 
    else if (data.type === 'web_page') {
      if (!data.url) throw new Error('no url');
      const id = Date.now();
      const rel = `02 Sources/Web Pages/${year}/${id}.md`;
      const md = `---
id: web-${id}
url: ${data.url}
title: ${data.title || ''}
captured_at: ${data.captured_at}
provider: web
---

# ${data.title || data.url}

Source: ${data.url}

## Content
${(data.content||'').slice(0,10000)}
`;
      writeMarkdown(rel, md);
      appendJsonl(`02 Sources/Browser Activity/${year}/${month}.jsonl`, {
        url: data.url,
        title: data.title,
        visited_at: data.captured_at,
        capture_status: 'content-captured',
        source_id: rel
      });
    }
    else if (data.type === 'conversation') {
      const provider = safeSegment(data.provider || 'Other', 'Other');
      const id = safeSegment(data.conversation_id || `conversation-${Date.now()}`, `conversation-${Date.now()}`);
      const rel = `02 Sources/Conversations/${provider}/${year}/${id}.md`;
      const transcript = (data.messages||[]).map(m => `### [${m.role}] ${m.timestamp}\n${m.text}\n`).join('\n');
      const md = `---
id: ${id}
provider: ${provider}
url: ${data.url || ''}
title: ${data.title || ''}
captured_at: ${data.captured_at}
completeness: ${data.completeness || 'full'}
---

# ${data.title || 'Conversation '+id}

Provider: ${provider}
URL: ${data.url || ''}

## Transcript
${transcript}
`;
      writeMarkdown(rel, md);
      // Also create entity if needed - simple heuristic
      if (data.title && data.title.length > 5) {
        const entityId = 'entity-' + id;
        const entityRel = `03 Memory/Entities/${entityId}.md`;
        if (!fs.existsSync(path.join(VAULT_PATH, entityRel))) {
          const entityMd = `---
id: ${entityId}
type: topic
status: confirmed
importance: normal
sensitivity: ordinary
retention: keep-until-user-deletes
created: ${data.captured_at}
updated: ${data.captured_at}
sources: ["[[${id}]]"]
---

# ${data.title}

## Overview
Captured from ${provider}.

## Sources
- [[${id}]]
`;
          writeMarkdown(entityRel, entityMd);
        }
      }
    }
    else if (data.type === 'capsule') {
      const c = data.capsule || {};
      const capsuleId = safeSegment(c.id, `capsule-${Date.now()}`);
      const rel = `03 Memory/Entities/capsule-${capsuleId}.md`;
      const md = `---
id: ${c.id}
type: capsule
title: ${c.title}
created: ${c.created}
updated: ${c.updated}
version: ${c.version}
status: ${c.status}
importance: ${c.importance}
sources: ${JSON.stringify(c.sources||[])}
related_entities: ${JSON.stringify(c.related_entities||[])}
---

# Capsule: ${c.title}

## Goals
${(c.goals||[]).map(g=>'- '+g).join('\n')}

## Constraints
${(c.constraints||[]).map(c=>'- '+c).join('\n')}

## Background
${c.background||''}

## Decisions
${(c.decisions||[]).map(d=>'- '+d).join('\n')}

## Sources
${(c.sources||[]).join('\n')}
`;
      writeMarkdown(rel, md);
    }
    else if (data.type === 'wasnt_accessible') {
      const rel = `01 Inbox/Processing Errors/${year}-${month}.md`;
      ensureDir('01 Inbox/Processing Errors');
      const full = path.join(VAULT_PATH, rel);
      fs.appendFileSync(full, `- ${data.captured_at} wasn't accessible: ${data.url} - reason: ${data.reason} - provider: ${data.provider||'web'}\n`);
      appendActivity(`09 Activity & Undo/${year}/${month}.md`, `[${data.captured_at}] wasn't accessible ${data.url} - ${data.reason}`);
    }
    else if (data.type === 'blacklist_update') {
      const rel = `00 System/Privacy & Access.md`;
      // Append to activity, actual file managed manually but log here
      appendActivity(`09 Activity & Undo/${year}/${month}.md`, `[${data.captured_at}] blacklist updated: ${JSON.stringify(data.excluded_patterns)}`);
    }

    res.json({ok: true, vault: VAULT_PATH});
  } catch (e) {
    console.error('Capture error', e);
    res.status(500).json({error: e.message});
  }
});

// GET /context?q=... - search vault for relevant capsules/entities
app.get('/context', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json({capsules: [], entities: [], claims: []});

  try {
    const entitiesDir = path.join(VAULT_PATH, '03 Memory/Entities');
    let capsules = [];
    let entities = [];

    if (fs.existsSync(entitiesDir)) {
      const files = fs.readdirSync(entitiesDir).filter(f=>f.endsWith('.md')).slice(-100); // last 100
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(entitiesDir, file), 'utf-8');
          const lower = content.toLowerCase();
          let score = 0;
          const qWords = q.split(' ').filter(w=>w.length>2);
          for (const w of qWords) {
            if (lower.includes(w)) score += 1;
          }
          if (q && lower.includes(q)) score += 5;

          // Penalize generic test
          if (content.toLowerCase().includes('arena | benchmark') && !q.includes('arena')) score = 0;
          if (score > 0) {
            // Extract frontmatter id and title
            const idMatch = content.match(/id:\s*(.+)/);
            const titleMatch = content.match(/title:\s*(.+)/) || content.match(/# Capsule:\s*(.+)/) || content.match(/# (.+)/);
            const id = idMatch ? idMatch[1].trim() : file.replace('.md','');
            const title = titleMatch ? titleMatch[1].trim() : file;
            capsules.push({id, title, background: content.slice(0,500), goals: [], score});
          }
        } catch(e) {}
      }
      capsules.sort((a,b)=>b.score-a.score);
      capsules = capsules.slice(0,5).map(({score, ...rest})=>rest);
    }

    res.json({capsules, entities, claims: []});
  } catch(e) {
    console.error(e);
    res.json({capsules: [], entities: [], claims: []});
  }
});

app.get('/', (req,res)=>res.json({ok:true, vault: VAULT_PATH, message: 'AI ASSistant Vault API at 127.0.0.1:8765'}));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`AI ASSistant Vault API running at http://127.0.0.1:${PORT}`);
  console.log(`Vault: ${VAULT_PATH}`);
});