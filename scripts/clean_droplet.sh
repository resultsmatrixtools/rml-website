#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited (RML) — WordPress-era droplet decommissioning
#
# Removes the LAMP stack the old WordPress site left behind, on a droplet that
# is already serving the new static site through nginx. Run as root.
#
#   ./clean_droplet.sh                 # report the plan, then prompt to purge
#   ./clean_droplet.sh --dry-run       # report only, change nothing
#   ./clean_droplet.sh --remove-user X # additionally retire local account X
#   ./clean_droplet.sh --firewall      # additionally enable ufw (22/80/443)
#
# Deliberately NOT done here:
#   * No `apt upgrade`. Unattended upgrades restart services and can stall on
#     config-file prompts; do OS patching as its own step, when you are watching.
#   * No touching /tmp, /var/tmp or /dev/shm. Wiping those on a running system
#     pulls sockets and lock files out from under live services.
#   * No touching Let's Encrypt state. The certs are live and rate-limited.
# ==============================================================================

set -euo pipefail

# Packages that must survive: the web server, TLS renewal, mail (the daily
# security scan pipes its report to sendmail), SSH, firewall.
PROTECTED_PATTERN='^(nginx|nginx-.*|certbot|python3-certbot.*|sendmail|sendmail-.*|sensible-mda|openssh-server|openssh-client|ufw)$'

# Package name prefixes belonging to the retired WordPress stack.
DOOMED_PATTERN='^(apache2|apache2-.*|libapache2-.*|php|php[0-9.]+.*|php-.*|libphp.*|mysql-server.*|mysql-client.*|mysql-common|mariadb-server.*|mariadb-client.*|phpmyadmin)$'

SITE_VHOST=/etc/nginx/sites-enabled/resultsmatrix
BACKUP_DIR=/root/decommission-$(date +%F)

DRY_RUN=0
REMOVE_USER=""
ENABLE_FIREWALL=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        --remove-user) REMOVE_USER="${2:?--remove-user needs a username}"; shift 2 ;;
        --firewall) ENABLE_FIREWALL=1; shift ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

[[ $EUID -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

# Sanity check: refuse to run anywhere that is not already serving the new
# site, so this cannot be pasted onto the wrong droplet.
[[ -e $SITE_VHOST ]] || {
    echo "Refusing to run: $SITE_VHOST not found." >&2
    echo "This script is only for the droplet already serving the new site." >&2
    exit 1
}

say() { printf '\n=== %s ===\n' "$1"; }

# ------------------------------------------------------------------------------
# 1. Report what would change
# ------------------------------------------------------------------------------

say "Installed packages to be purged"
mapfile -t DOOMED < <(
    dpkg-query -W -f='${Package}\t${Status}\n' 2>/dev/null \
        | awk -F'\t' '$2 ~ /^install ok installed/ {print $1}' \
        | grep -E "$DOOMED_PATTERN" \
        | grep -Ev "$PROTECTED_PATTERN" \
        | sort
)
if [[ ${#DOOMED[@]} -eq 0 ]]; then
    echo "(none — packages already removed)"
else
    printf '  %s\n' "${DOOMED[@]}"
fi

say "Databases present (all will be dumped, then MySQL removed)"
if command -v mysql &>/dev/null; then
    mysql -N -B -e 'show databases;' 2>/dev/null | sed 's/^/  /' || echo "  (cannot connect)"
else
    echo "  (mysql client not installed)"
fi

say "Files and directories to be removed"
for path in /var/www/html /root/wp-cli.phar /root/mailinabox \
            /etc/nginx/sites-available/default \
            /etc/nginx/sites-available/default.dpkg-dist \
            '/etc/nginx/sites-available/hope-app,conf' \
            /root/.ssh/id_rsa /root/.ssh/id_rsa.pub; do
    [[ -e $path ]] && echo "  $path ($(du -sh "$path" 2>/dev/null | cut -f1))"
done
echo "  (the resultsmatrix vhost, certs and sendmail are left alone)"

[[ -n $REMOVE_USER ]] && {
    say "Local account to retire: $REMOVE_USER"
    getent passwd "$REMOVE_USER" | sed 's/^/  /' || echo "  (no such account)"
}

if [[ $DRY_RUN -eq 1 ]]; then
    say "Dry run — nothing changed"
    exit 0
fi

# ------------------------------------------------------------------------------
# 2. Confirm
# ------------------------------------------------------------------------------

say "Confirm"
echo "This permanently removes the above. Databases are dumped to $BACKUP_DIR first."
read -r -p "Type PURGE to proceed: " reply
[[ $reply == PURGE ]] || { echo "Aborted."; exit 1; }

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# ------------------------------------------------------------------------------
# 3. Back up every database before MySQL goes
# ------------------------------------------------------------------------------

if command -v mysqldump &>/dev/null; then
    say "Dumping databases"
    dump="$BACKUP_DIR/all-databases.sql.gz"
    if mysqldump --all-databases --single-transaction --routines --events 2>/dev/null | gzip > "$dump"; then
        # A dump that is present but tiny means mysqldump failed silently.
        size=$(stat -c%s "$dump")
        if [[ $size -lt 1024 ]]; then
            echo "Dump is only ${size} bytes — mysqldump did not succeed. Stopping." >&2
            echo "Investigate before removing MySQL; your data is still intact." >&2
            exit 1
        fi
        echo "  $dump ($(du -h "$dump" | cut -f1))"
    else
        echo "mysqldump failed. Stopping — nothing has been removed yet." >&2
        exit 1
    fi
    echo "  COPY THIS OFF THE SERVER before you trust it:"
    echo "  scp root@\$DROPLET:$dump ."
fi

# ------------------------------------------------------------------------------
# 4. Purge the WordPress stack
# ------------------------------------------------------------------------------

if [[ ${#DOOMED[@]} -gt 0 ]]; then
    say "Purging packages"
    DEBIAN_FRONTEND=noninteractive apt-get purge -y "${DOOMED[@]}"
    DEBIAN_FRONTEND=noninteractive apt-get autoremove --purge -y
fi

# ------------------------------------------------------------------------------
# 5. Remove leftover files
# ------------------------------------------------------------------------------

say "Removing leftover files"
archive="$BACKUP_DIR/old-web-root.tar.gz"
if [[ -d /var/www/html ]]; then
    # Keep a copy of the old web root: it is small and occasionally holds the
    # only trace of a customisation nobody documented.
    tar -czf "$archive" -C /var/www html 2>/dev/null || true
    [[ -f $archive ]] && echo "  archived old web root -> $archive"
    rm -rf /var/www/html
    echo "  removed /var/www/html"
fi

for path in /root/wp-cli.phar /root/mailinabox \
            /etc/nginx/sites-available/default \
            /etc/nginx/sites-available/default.dpkg-dist \
            '/etc/nginx/sites-available/hope-app,conf'; do
    if [[ -e $path ]]; then
        rm -rf "$path"
        echo "  removed $path"
    fi
done

# A private key on a server is a credential anyone with root here can reuse.
for path in /root/.ssh/id_rsa /root/.ssh/id_rsa.pub; do
    if [[ -e $path ]]; then
        cp -a "$path" "$BACKUP_DIR/" 2>/dev/null || true
        rm -f "$path"
        echo "  removed $path (copy kept in $BACKUP_DIR)"
    fi
done

# Apache leaves its config tree behind after purge.
[[ -d /etc/apache2 ]] && { rm -rf /etc/apache2; echo "  removed /etc/apache2"; }

# ------------------------------------------------------------------------------
# 6. Retire a local account, if asked
# ------------------------------------------------------------------------------

if [[ -n $REMOVE_USER ]]; then
    say "Retiring account: $REMOVE_USER"
    if ! getent passwd "$REMOVE_USER" >/dev/null; then
        echo "  no such account — nothing to do"
    elif pgrep -u "$REMOVE_USER" >/dev/null 2>&1; then
        echo "  REFUSING: $REMOVE_USER still owns running processes." >&2
        echo "  Investigate with: ps -u $REMOVE_USER" >&2
    else
        home=$(getent passwd "$REMOVE_USER" | cut -d: -f6)
        if [[ -d $home ]]; then
            tar -czf "$BACKUP_DIR/home-$REMOVE_USER.tar.gz" -C "$(dirname "$home")" \
                "$(basename "$home")" 2>/dev/null || true
            echo "  archived $home"
        fi
        crontab -u "$REMOVE_USER" -r 2>/dev/null && echo "  removed crontab" || true
        deluser --remove-home "$REMOVE_USER" 2>/dev/null \
            || userdel -r "$REMOVE_USER" 2>/dev/null \
            || echo "  account removal failed — check manually" >&2
        echo "  account retired"
    fi
fi

# ------------------------------------------------------------------------------
# 7. Optional firewall
# ------------------------------------------------------------------------------

if [[ $ENABLE_FIREWALL -eq 1 ]] && command -v ufw &>/dev/null; then
    say "Enabling firewall"
    # Port 22 explicitly as well as the app profile: if the profile is missing,
    # `ufw allow OpenSSH` fails and enabling would lock you out of SSH.
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    ufw status verbose
fi

# ------------------------------------------------------------------------------
# 8. Verify the things that must still work
# ------------------------------------------------------------------------------

say "Verification"

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "  nginx config valid, reloaded"
else
    echo "  NGINX CONFIG IS INVALID — not reloading. Fix before disconnecting." >&2
fi

code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: resultsmatrix.com' http://127.0.0.1/ || echo 000)
echo "  site responds locally: HTTP $code"
[[ $code == 200 ]] || echo "  ^ expected 200 — investigate before DNS traffic hits this box." >&2

if command -v certbot &>/dev/null; then
    certbot certificates 2>/dev/null | grep -E 'Certificate Name|Expiry' | sed 's/^/  /'
else
    echo "  CERTBOT IS MISSING — TLS renewal is broken." >&2
fi

command -v sendmail &>/dev/null \
    && echo "  sendmail present (daily security report can still send)" \
    || echo "  sendmail missing — daily_security_scan.sh cannot email its report." >&2

say "Done"
echo "Backups and archives: $BACKUP_DIR"
echo "Copy them off the server, verify, then delete them from /root."
