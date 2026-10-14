#!/bin/sh
# Vercel's install step for the browser build.
#
# This script acts on the folder it lives in, so it does not matter whether the
# project's Root Directory is the repository root or this app folder: Vercel
# finds it either way, and neither vercel.json has to know where it started.
set -e

APP="$(cd "$(dirname "$0")" && pwd)"
cd "$APP"

# ELECTRON_SKIP_BINARY_DOWNLOAD skips only the ~100 MB Electron binary, which a
# web host can never run. Do not replace it with --ignore-scripts: that also
# skips the installs that give esbuild and rollup their native binaries, and the
# build then fails later with an unrelated-looking error.
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install
