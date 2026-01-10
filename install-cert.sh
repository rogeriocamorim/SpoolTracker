#!/bin/bash

# Script to download and install the SSL certificate from the remote server
# This will make the browser trust the certificate permanently

# Configuration - Load from .env.deploy if it exists
if [ -f ".env.deploy" ]; then
    echo "📝 Loading configuration from .env.deploy"
    export $(grep -v '^#' .env.deploy | xargs)
fi

REMOTE_HOST="${REMOTE_HOST:-192.168.2.13}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PASSWORD="${REMOTE_PASSWORD}"
SSL_DIR="/opt/spooltracker/ssl"
CERT_FILE="spooltracker-cert.pem"

# Find SSH key - check multiple common locations (same as deploy.sh)
find_ssh_key() {
    local keys=(
        "$HOME/.ssh/id_rsa_spooltracker"
        "$HOME/.ssh/id_rsa_dunerank"
        "$HOME/.ssh/id_ed25519_personal"
        "$HOME/.ssh/id_ed25519"
        "$HOME/.ssh/id_rsa"
    )
    for key in "${keys[@]}"; do
        if [ -f "$key" ]; then
            echo "$key"
            return 0
        fi
    done
    return 1
}

SSH_KEY=$(find_ssh_key) || SSH_KEY=""

echo "🔐 Installing SSL Certificate"
echo "=============================="
echo ""

# Check if we're on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Download certificate from remote server
echo "📥 Downloading certificate from $REMOTE_HOST..."

# Use same SSH logic as deploy.sh
if [ -f "$SSH_KEY" ]; then
    echo "🔑 Using SSH key: $SSH_KEY"
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST:$SSL_DIR/cert.pem" "$CERT_FILE" 2>/dev/null || {
        echo "❌ Failed to download certificate. Make sure:"
        echo "   1. The remote server is accessible"
        echo "   2. SSH key has proper permissions"
        echo "   3. The certificate exists on the remote server"
        exit 1
    }
elif command -v sshpass &> /dev/null && [ -n "$REMOTE_PASSWORD" ]; then
    echo "🔐 Using password authentication"
    sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST:$SSL_DIR/cert.pem" "$CERT_FILE" 2>/dev/null || {
        echo "❌ Failed to download certificate"
        exit 1
    }
else
    echo "⚠️  No SSH key or sshpass found."
    echo ""
    echo "Please either:"
    echo "   1. Set REMOTE_PASSWORD in .env.deploy file, or"
    echo "   2. Download the certificate manually:"
    echo "      scp $REMOTE_USER@$REMOTE_HOST:$SSL_DIR/cert.pem ./$CERT_FILE"
    echo ""
    read -p "Press Enter after downloading the certificate, or Ctrl+C to cancel..."
fi

if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate file not found: $CERT_FILE"
    exit 1
fi

echo "✅ Certificate downloaded: $CERT_FILE"
echo ""

# Install certificate based on OS
if [ "$OS" == "macos" ]; then
    echo "🍎 Installing certificate on macOS..."
    echo ""
    echo "You'll be prompted for your macOS password to add the certificate to Keychain."
    echo ""
    
    # Add to system keychain
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_FILE"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Certificate installed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Open Keychain Access (Applications > Utilities)"
        echo "   2. Search for '192.168.2.13' or 'SpoolTracker'"
        echo "   3. Double-click the certificate"
        echo "   4. Expand 'Trust' section"
        echo "   5. Set 'When using this certificate' to 'Always Trust'"
        echo "   6. Close and enter your password when prompted"
        echo ""
        echo "🔄 Restart your browser for changes to take effect"
    else
        echo "❌ Failed to install certificate. You may need to install it manually."
        echo "   Open Keychain Access and drag $CERT_FILE into the System keychain"
    fi
    
elif [ "$OS" == "linux" ]; then
    echo "🐧 Installing certificate on Linux..."
    echo ""
    
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        CERT_DIR="/usr/local/share/ca-certificates"
        sudo mkdir -p "$CERT_DIR"
        sudo cp "$CERT_FILE" "$CERT_DIR/spooltracker.crt"
        sudo update-ca-certificates
        
        if [ $? -eq 0 ]; then
            echo "✅ Certificate installed successfully!"
            echo "🔄 Restart your browser for changes to take effect"
        else
            echo "❌ Failed to install certificate"
        fi
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        CERT_DIR="/etc/pki/ca-trust/source/anchors"
        sudo cp "$CERT_FILE" "$CERT_DIR/spooltracker.crt"
        sudo update-ca-trust
        
        if [ $? -eq 0 ]; then
            echo "✅ Certificate installed successfully!"
            echo "🔄 Restart your browser for changes to take effect"
        else
            echo "❌ Failed to install certificate"
        fi
    else
        echo "⚠️  Unsupported Linux distribution. Please install manually:"
        echo "   1. Copy $CERT_FILE to your system's CA certificate directory"
        echo "   2. Run your distribution's certificate update command"
    fi
fi

# Cleanup
read -p "Delete downloaded certificate file? [y/N]: " cleanup
if [[ "$cleanup" =~ ^[Yy]$ ]]; then
    rm "$CERT_FILE"
    echo "🗑️  Certificate file deleted"
fi

echo ""
echo "✨ Done! The security warning should no longer appear after restarting your browser."

