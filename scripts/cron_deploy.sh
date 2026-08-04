#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited (RML) — Automated Cron Deployment Script
# Polls origin/main on GitHub and builds/deploys automatically when changes occur.
# ==============================================================================

set -euo pipefail

SITE_DIR="${SITE_DIR:-/var/www/resultsmatrix}"

if [ ! -d "$SITE_DIR/.git" ]; then
    echo "[$(date -u)] ERROR: $SITE_DIR is not a git repository." >&2
    exit 1
fi

cd "$SITE_DIR"

# 1. Fetch latest state from remote main
git fetch origin main --quiet

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

# 2. Check if local is up to date with remote
if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    # No changes — exit silently
    exit 0
fi

# 3. New commits detected — begin deployment process
echo "----------------------------------------------------------------------"
echo "[$(date -u)] New changes detected on origin/main!"
echo "Local commit:  $LOCAL_HASH"
echo "Remote commit: $REMOTE_HASH"
echo "----------------------------------------------------------------------"

# Pull latest code
git pull origin main

# Install dependencies if package.json or package-lock.json changed
echo "--> Checking dependencies..."
npm ci --prefer-offline --no-audit

# Build static production bundle
echo "--> Building production static site (dist/)..."
PUBLIC_SITE_URL="https://resultsmatrix.com" npm run build

# Reload web server
echo "--> Reloading Nginx..."
if command -v systemctl &> /dev/null; then
    systemctl reload nginx
else
    nginx -s reload
fi

echo "[$(date -u)] ✓ Deployment completed successfully!"
echo "----------------------------------------------------------------------"
