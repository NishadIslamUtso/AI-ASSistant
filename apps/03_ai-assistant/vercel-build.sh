#!/bin/sh
# Vercel's build step: produce the browser build and put it where Vercel looks.
#
# Vercel uploads <Root Directory>/dist-web. When the Root Directory is this app
# folder the build already lands there. When it is the repository root, the
# result is copied up to <repository root>/dist-web. The copy is decided by the
# files on disk, so both Root Directory settings do exactly the same thing.
set -e

APP="$(cd "$(dirname "$0")" && pwd)"
cd "$APP"

npm run build:web

# Is this app folder inside an "apps/" directory of a checkout? If so, that
# checkout is the repository root, and a Root Directory of "repository root"
# needs the built site up there too. When the Root Directory is this folder the
# copy is simply ignored — Vercel uploads the folder it was told about.
ROOT="$(cd "$APP/../.." && pwd)"
if [ -d "$ROOT/apps/03_ai-assistant" ]; then
  rm -rf "$ROOT/dist-web"
  cp -r "$APP/dist-web" "$ROOT/dist-web"
fi
