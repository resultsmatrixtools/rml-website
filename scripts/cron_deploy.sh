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

# The advisory services (names, prices, descriptions) live in the CRM, not in this
# repo, and are read when the site is built. So a change made in the CRM needs a
# rebuild even though nothing was pushed here. feed_hash fingerprints the CRM's
# public services feed (ignoring its timestamp); the fingerprint of the last
# build is kept in $FEED_STATE.
#   prints nothing, exits 0   no CRM address is configured (nothing to watch)
#   prints a hash, exits 0    the feed was read
#   exits 1                   the feed is configured but could not be read
# What the last successful build used. Both are written only after a build succeeds, so a
# failed build (of new code or of new services) is retried on the next run.
FEED_STATE="$SITE_DIR/.services-feed.sha256"
BUILT_STATE="$SITE_DIR/.last-built-commit"
feed_hash() {
    local url body
    url=$(
        set -a
        # shellcheck disable=SC1090
        [ -f "$SITE_DIR/.env" ] && . <(grep -E '^PUBLIC_[A-Z0-9_]+=' "$SITE_DIR/.env")
        if [ -n "${PUBLIC_CRM_SERVICES_URL:-}" ]; then
            echo "$PUBLIC_CRM_SERVICES_URL"
        elif [ -n "${PUBLIC_CRM_ENDPOINT:-}" ]; then
            base="${PUBLIC_CRM_ENDPOINT%/}"
            echo "${base%/lead-capture}/crm-services"
        fi
    )
    [ -z "$url" ] && return 0
    body=$(curl -fsS --max-time 20 "$url") || return 1
    printf '%s' "$body" | sed 's/"generated_at" *: *"[^"]*" *,\{0,1\}//' | sha256sum | cut -d' ' -f1
}

# 1. Fetch latest state from remote main
git fetch origin main --quiet

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

# If the services feed cannot be read, do nothing this time and try again on the
# next run. A build without it would either fail or publish an empty services
# page, and a failed build can leave the served site half-written.
if ! FEED_HASH=$(feed_hash); then
    echo "[$(date -u)] WARNING: the CRM services feed could not be read; skipping this run." >&2
    exit 0
fi
LAST_FEED_HASH=$(cat "$FEED_STATE" 2>/dev/null || true)
# First run after this was added: assume the checked-out commit is the one that was built.
LAST_BUILT_COMMIT=$(cat "$BUILT_STATE" 2>/dev/null || echo "$LOCAL_HASH")

# 2. Check if anything changed: new commits on main, or a change in the CRM services
CODE_CHANGED=false
[ "$LAST_BUILT_COMMIT" != "$REMOTE_HASH" ] && CODE_CHANGED=true
if [ "$CODE_CHANGED" = false ] && [ "$FEED_HASH" = "$LAST_FEED_HASH" ]; then
    # No changes — exit silently
    exit 0
fi

# 3. Something changed — begin deployment process
echo "----------------------------------------------------------------------"
if [ "$CODE_CHANGED" = true ]; then
    echo "[$(date -u)] New changes detected on origin/main!"
    echo "Last built:    $LAST_BUILT_COMMIT"
    echo "Remote commit: $REMOTE_HASH"
else
    echo "[$(date -u)] The CRM services changed; rebuilding."
fi
echo "----------------------------------------------------------------------"

# Reset working tree to match remote main cleanly
echo "--> Syncing repository to origin/main..."
git reset --hard origin/main

# Install dependencies (only when the code changed; a services-only rebuild needs none)
if [ "$CODE_CHANGED" = true ]; then
    echo "--> Checking dependencies..."
    npm ci --prefer-offline --no-audit
fi

# Build static production bundle
echo "--> Building production static site (dist/)..."
# Load the build-time PUBLIC_* variables (CRM endpoint, Turnstile site key,
# HubSpot IDs) from the untracked .env on this server. Only PUBLIC_ lines are
# exported, so any other secret in that file never reaches the build.
if [ -f "$SITE_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . <(grep -E '^PUBLIC_[A-Z0-9_]+=' "$SITE_DIR/.env")
    set +a
else
    echo "WARNING: $SITE_DIR/.env not found; building without PUBLIC_* variables." >&2
fi

PUBLIC_SITE_URL="https://resultsmatrix.com" npm run build

# The build succeeded: remember what it used, so the next run only rebuilds on a real change.
# (Written before the reload so a failed reload cannot cause a rebuild loop.)
printf '%s' "$REMOTE_HASH" > "$BUILT_STATE"
printf '%s' "$FEED_HASH" > "$FEED_STATE"

# Reload web server
echo "--> Reloading Nginx..."
if command -v systemctl &> /dev/null; then
    systemctl reload nginx
else
    nginx -s reload
fi

echo "[$(date -u)] ✓ Deployment completed successfully!"
echo "----------------------------------------------------------------------"
