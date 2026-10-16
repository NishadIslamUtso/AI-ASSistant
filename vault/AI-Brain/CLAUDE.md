# CLAUDE.md — how to work in this vault

This folder is a second brain. The app captures sources into it; you make
it useful. The rules below are few and absolute.

## The wall

- Never edit or delete anything in `02 Sources/`. The app writes each file there once, and that file IS the record of what was captured. Synthesis lands in `05 Knowledge/`.
- Leave `00 System/`, `04 Working Memory/` and `09 Activity & Undo/` to the app.

## Privacy

- `00 System/Privacy & Access.md` lists excluded patterns. They are absolute: never read, index, quote, or link a file whose path matches one — and never copy its contents into a new note.

## Writing notes

- One topic per note, in `05 Knowledge/` (or `wiki/` where that is the vault's own name).
- Every note starts with YAML frontmatter:

  ```yaml
  ---
  id: YYYYMMDDHHMMSS
  title: "Short title"
  type: concept        # concept | person | project | summary
  status: raw          # raw | processing | verified
  tags: [lowercase-tags]
  connections: ["[[an existing note]]"]
  last_ai_audit: YYYY-MM-DDTHH:MM:SS
  ---
  ```

- Link only files that exist. A `[[link]]` to a file that is not there is a lie in bold brackets — create the note or drop the link.
- Say what a source says, never what it implies about being read or agreed with. A visit is not a reading.
- When a new fact contradicts an existing verified note, add a `## Contradiction` section to the old note and say both sides. Do not silently pick a winner.

## Bookkeeping

- After any change, append one line under `## Changes` in `index.md`: the date, what was done, where.
- When a source has been fully used, note it and move on — the sources folder keeps everything, so nothing needs deleting.

## Growing the structure

- You may add folders or files when the work needs them. Record every addition in `index.md`. Never rename, move, or delete the folders described above.