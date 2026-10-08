#!/usr/bin/env bash
# Pull the latest main, build, and publish to the nginx web root.
# Run on the server from the repo folder:  ./deploy/deploy.sh
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/shilingibet-dashboard}"
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env - copy .env.example to .env and set the production URLs first." >&2
  exit 1
fi
if grep -qE '^VITE_[A-Z_]+=https?://localhost' .env; then
  echo "Refusing to deploy: .env still points at localhost." >&2
  exit 1
fi

git pull --ff-only
npm ci --no-audit --no-fund
npm run build

# Publish atomically-ish: copy new files, then remove files from old builds.
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete dist/ "$WEB_ROOT/"
echo "Deployed $(git rev-parse --short HEAD) to $WEB_ROOT"
