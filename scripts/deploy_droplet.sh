#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited (RML) — Self-Hosted Nginx Deployment Script (Option B)
# Run as root on your DigitalOcean Droplet to set up Nginx, SSL, & static build.
# ==============================================================================

set -euo pipefail

DOMAIN="resultsmatrix.com"
WWW_DOMAIN="www.resultsmatrix.com"
SITE_DIR="/var/www/resultsmatrix"
REPO_URL="https://github.com/resultsmatrixtools/rml-website.git"

echo "=========================================="
echo " Starting Self-Hosted Nginx Setup (Option B)"
echo "=========================================="

# 1. Install System Dependencies, Security Scanners & Node 22 (LTS) if missing
echo "--> Installing Nginx, Certbot, ClamAV, rkhunter, mailutils & Node.js 22..."
DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y curl git nginx certbot python3-certbot-nginx clamav rkhunter mailutils

if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]; then
    echo "--> Installing Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "--> Node version: $(node -v)"
echo "--> NPM version:  $(npm -v)"

# 2. Clone or Update Repository
if [ ! -d "$SITE_DIR" ]; then
    echo "--> Cloning repository into $SITE_DIR..."
    git clone "$REPO_URL" "$SITE_DIR"
else
    echo "--> Fetching latest code..."
    cd "$SITE_DIR"
    git fetch origin
    git checkout main
    git pull origin main
fi

# 3. Install NPM Dependencies & Build Production Bundle
cd "$SITE_DIR"
echo "--> Building production static output (dist/)..."
npm ci
npm run build

# 4. Configure Nginx Virtual Host (only if not already created/configured)
if [ ! -f /etc/nginx/sites-available/resultsmatrix ]; then
    echo "--> Configuring Nginx virtual host..."
    cat << EOF > /etc/nginx/sites-available/resultsmatrix
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;

    root $SITE_DIR/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html =404;
    }

    # Cache static assets (images, fonts, bundles)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|webp)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Custom 404
    error_page 404 /404.html;
}
EOF
else
    echo "--> Nginx virtual host already exists, skipping overwrite..."
fi

# Enable site and remove default
ln -sf /etc/nginx/sites-available/resultsmatrix /etc/nginx/sites-enabled/resultsmatrix
rm -f /etc/nginx/sites-enabled/default

echo "--> Testing Nginx configuration..."
nginx -t
systemctl reload nginx

# 5. Make deployment scripts executable & configure cron jobs
chmod +x $SITE_DIR/scripts/*.sh

CRON_DEPLOY="*/5 * * * * flock -n /tmp/rml-deploy.lock $SITE_DIR/scripts/cron_deploy.sh >> /var/log/rml-deploy.log 2>&1"
CRON_SECURITY="0 2 * * * flock -n /tmp/rml-security.lock $SITE_DIR/scripts/daily_security_scan.sh >> /var/log/rml-security-scan.log 2>&1"

(crontab -l 2>/dev/null | grep -v "$SITE_DIR/scripts/cron_deploy.sh" | grep -v "$SITE_DIR/scripts/daily_security_scan.sh"; echo "$CRON_DEPLOY"; echo "$CRON_SECURITY") | crontab -

echo "--> Configured auto-deployment cron job (polls every 5 minutes)."
echo "--> Configured daily security scan cron job (runs nightly at 2:00 AM)."

echo "=========================================="
echo " Nginx & Auto-Deploy Setup Complete!     "
echo " Next step: Run Certbot for SSL certificate:"
echo " certbot --nginx -d $DOMAIN -d $WWW_DOMAIN "
echo "=========================================="
