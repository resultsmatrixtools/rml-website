#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited — Daily Security, Malware & Vulnerability Automated Scanner
# Runs daily via cron, performs ClamAV + rkhunter scans, and emails a report.
# ==============================================================================

set -euo pipefail

# Configuration — Set your destination email address below
ALERT_EMAIL="${1:-info@resultsmatrix.com}"
REPORT_FILE="/tmp/daily_security_report_$(date +%F).txt"
HOSTNAME=$(hostname -f 2>/dev/null || hostname)

echo "=================================================================" > "$REPORT_FILE"
echo " DAILY SECURITY & MALWARE REPORT — $HOSTNAME " >> "$REPORT_FILE"
echo " Date: $(date)" >> "$REPORT_FILE"
echo "=================================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. ClamAV Malware Scan
echo "[1/4] Running ClamAV Malware Scan..." >> "$REPORT_FILE"
echo "-----------------------------------------------------------------" >> "$REPORT_FILE"
# Ensure definitions are updated
freshclam --quiet 2>/dev/null || true
# Scan key directories (-i only outputs infected files)
clamscan -r -i /var/www /tmp /var/tmp /dev/shm /root /etc >> "$REPORT_FILE" 2>&1 || true
echo "" >> "$REPORT_FILE"

# 2. Rootkit Hunter Audit
echo "[2/4] Running Rootkit Hunter Audit..." >> "$REPORT_FILE"
echo "-----------------------------------------------------------------" >> "$REPORT_FILE"
if command -v rkhunter &> /dev/null; then
    rkhunter --check --sk --report-warnings-only >> "$REPORT_FILE" 2>&1 || true
else
    echo "rkhunter is not installed." >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 3. System Vulnerability & Package Audit
echo "[3/4] System Vulnerabilities & Available Security Patches..." >> "$REPORT_FILE"
echo "-----------------------------------------------------------------" >> "$REPORT_FILE"
apt-get update -qq 2>/dev/null || true
UPGRADABLE=$(apt list --upgradable 2>/dev/null | grep -i security || true)
if [ -n "$UPGRADABLE" ]; then
    echo "Security Updates Available:" >> "$REPORT_FILE"
    echo "$UPGRADABLE" >> "$REPORT_FILE"
else
    echo "All system security packages are up to date." >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 4. Open Network Ports & Active Listeners
echo "[4/4] Active Listening Ports (Network Audit)..." >> "$REPORT_FILE"
echo "-----------------------------------------------------------------" >> "$REPORT_FILE"
ss -tulpn >> "$REPORT_FILE" 2>&1 || true
echo "" >> "$REPORT_FILE"

echo "=================================================================" >> "$REPORT_FILE"
echo " END OF REPORT " >> "$REPORT_FILE"
echo "=================================================================" >> "$REPORT_FILE"

# Send Email Report
if command -v mail &> /dev/null; then
    mail -s "🛡️ Daily Security Report — $HOSTNAME ($(date +%F))" "$ALERT_EMAIL" < "$REPORT_FILE"
elif command -v sendmail &> /dev/null; then
    (
      echo "Subject: 🛡️ Daily Security Report — $HOSTNAME ($(date +%F))"
      echo "To: $ALERT_EMAIL"
      echo "From: root@$HOSTNAME"
      echo ""
      cat "$REPORT_FILE"
    ) | sendmail -t
else
    echo "Warning: Neither 'mail' nor 'sendmail' is installed. Output saved to $REPORT_FILE."
fi

# Cleanup report file after 7 days
find /tmp -name "daily_security_report_*.txt" -mtime +7 -delete 2>/dev/null || true
