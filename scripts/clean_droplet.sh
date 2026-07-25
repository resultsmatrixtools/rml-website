#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited (RML) — Droplet Decommissioning & Security Audit Script
# Run as root on your DigitalOcean Droplet to purge WordPress & audit malware.
# ==============================================================================

set -euo pipefail

echo "=========================================="
echo " Starting Droplet Security & WP Cleanup   "
echo "=========================================="

# 1. Option Backup Prompt
read -p "Do you want to create a database & uploads backup before purging? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "--> Creating backup in /root/..."
    if command -v mysqldump &> /dev/null; then
        mysqldump --all-databases > /root/wp_all_dbs_backup_$(date +%F).sql || true
    fi
    if [ -d "/var/www" ]; then
        tar -czvf /root/wp_www_backup_$(date +%F).tar.gz /var/www || true
    fi
    echo "✓ Backups saved to /root/"
fi

# 2. Stop and purge PHP / WordPress services
echo "--> Stopping PHP & Web server services..."
systemctl stop php* || true
systemctl disable php* || true

# 3. Purge Web Root
echo "--> Purging WordPress web root files..."
rm -rf /var/www/html/*
rm -rf /var/www/wordpress/*

# 4. Audit Crontabs
echo "--> Auditing System Crontabs..."
cat /etc/crontab
ls -la /etc/cron.*/
ls -la /var/spool/cron/crontabs/

# 5. Clean Temporary Storage Locations
echo "--> Purging temporary directories..."
rm -rf /tmp/* /var/tmp/* /dev/shm/* 2>/dev/null || true

# 6. Check Active Network Listeners
echo "--> Active Network Listeners:"
ss -tulpn

# 7. Update OS packages & Firewall
echo "--> Applying OS Security Updates & Firewall rules..."
apt-get update && apt-get upgrade -y
if command -v ufw &> /dev/null; then
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

echo "=========================================="
echo " Cleanup Complete! Server ready for deploy."
echo "=========================================="
