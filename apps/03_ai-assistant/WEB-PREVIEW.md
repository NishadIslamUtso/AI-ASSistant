# Looking at the app in a browser

The desktop app is the product. But waiting for a full Electron build to see a
button move is slow, and building on a machine you are not sitting at is slower
still. So the interface has a second way out: the renderer alone, built as a
plain static site and served anywhere.

Import the repository on Vercel and it builds with no settings to fill in — the
`vercel.json` at the repository root points at this app.

## What the browser preview is

- The **same renderer source**: the same components, the same Tailwind theme,
  the same `@shared` modules the desktop app uses. Not a mock-up, not a second
  copy to keep in sync.
- Built by plain Vite with no Electron involved, so the host needs no display and
  no desktop runtime.
- Fast: the whole thing compiles in a couple of seconds.

## What it is not

It cannot touch your files, your vault, your models or your shell. In the desktop
app those travel over the preload bridge (`window.api`), which a browser does not
have. So:

- `isDemo` is true, and the interface knows it — anything that needs the machine
  shows as unavailable rather than as a button that does nothing.
- The demo layer returns **empty, never invented** data. No fake chats, no fake
  vault entries, no fake model replies. You see the app's own empty states, which
  is what you want to be looking at anyway.
- Keys never exist in this build. There is nothing in the static bundle that can
  reach a provider, on purpose.

## Environment variables

None required. The preview makes no network requests of its own; its
`Content-Security-Policy` allows none, so this is enforced rather than promised.

## Commands

```bash
npm run build:web     # build the renderer to dist-web/
npm run preview:web   # serve dist-web/ on http://localhost:4174
npm run dev:web       # same, with hot reload, on http://localhost:5174
```

Both dev and preview servers bind `0.0.0.0` and accept any host header, so the
same commands work behind a tunnel or a preview proxy.

## Deploying

1. On Vercel: **Add New → Project → import this repository.** Deploy.
2. That is the whole setup. Build command, output directory and framework preset
   all come from `vercel.json`.

### Root Directory — both settings work

Vercel's **Root Directory** setting decides the working directory the build runs
in, and everything in `vercel.json` is relative to it. This project supports both
choices, so you cannot get it wrong:

- **Leave it empty** (the repository root), or
- **Set it to `apps/03_ai-assistant`** — convenient, because the Vercel dashboard
  then deals with this app alone.

The install and build commands detect which folder they are in by looking for the
app's own package name, and both write the built site to `dist-web` inside the
Root Directory. There is a copy of `vercel.json` in the app folder as well as at
the repository root for the same reason: Vercel reads the config from the Root
Directory, the two files are identical, and both settings therefore do exactly
the same thing.

An earlier version of this file assumed the repository root, and failed with
`cd: apps/03_ai-assistant: No such file or directory` when the Root Directory was
set to the app — it tried to descend into the folder it was already standing in.
If you set the Root Directory in the dashboard, clear any custom Install or Build
Command left over from that attempt, so the ones in `vercel.json` apply.

The install runs with `ELECTRON_SKIP_BINARY_DOWNLOAD=1`. That is deliberately not
`--ignore-scripts`: skipping every lifecycle script can leave esbuild and rollup
without their native binaries and the build then fails, while this variable skips
only the ~100 MB Electron binary that a web host can never run.

To deploy only when this app changes, set the project's **Ignored Build Step** to
`git diff --quiet HEAD^ HEAD -- apps/03_ai_assistant`. That is a dashboard
setting, not something this file can set for you.
