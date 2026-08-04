#!/usr/bin/env bash
# ==============================================================================
# Results Matrix Limited (RML) — Gmail SMTP Relay Setup via msmtp
# Usage: sudo ./setup_smtp.sh "YOUR_16_CHAR_GMAIL_APP_PASSWORD"
# ==============================================================================

set -euo pipefail

GMAIL_USER="resultsmatrixtools@gmail.com"
APP_PASSWORD="${1:-}"

if [ -z "$APP_PASSWORD" ]; then
    echo "Error: Please provide your 16-character Gmail App Password." >&2
    echo "Usage: sudo $0 \"your_app_password\"" >&2
    exit 1
fi

# Remove spaces if user pasted password with spaces (e.g. "abcd efgh ijkl mnop")
CLEAN_PASSWORD=$(echo "$APP_PASSWORD" | tr -d ' ')

echo "--> Installing msmtp and mail tools..."
DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y msmtp msmtp-mta ca-certificates mailutils

echo "--> Configuring /etc/msmtprc for $GMAIL_USER..."
cat << EOF > /etc/msmtprc
# msmtp configuration for Results Matrix Limited
defaults
auth           on
tls            on
tls_starttls   on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

account        gmail
host           smtp.gmail.com
port           587
from           $GMAIL_USER
user           $GMAIL_USER
password       $CLEAN_PASSWORD

account default : gmail
EOF

chmod 600 /etc/msmtprc
touch /var/log/msmtp.log
chmod 666 /var/log/msmtp.log

echo "--> Testing SMTP configuration..."
TEST_REPORT="/tmp/smtp_test.txt"
echo "This is a test security notification from Results Matrix Limited server." > "$TEST_REPORT"

if command -v msmtp &> /dev/null; then
    echo "Sending test email via msmtp to $GMAIL_USER..."
    (
        echo "Subject: 🛡️ RML Server SMTP Test — $(date)"
        echo "To: $GMAIL_USER"
        echo "From: $GMAIL_USER"
        echo ""
        cat "$TEST_REPORT"
    ) | msmtp -t
    echo "✓ Test email sent!"
else
    echo "ERROR: msmtp installation failed." >&2
    exit 1
fi

echo "================================================================="
echo " SMTP Setup Complete!                                            "
echo " Daily security reports will now be sent via $GMAIL_USER          "
echo "================================================================="
