#!/bin/bash

# Generate self-signed SSL certificate for local development
# This allows HTTPS access which is required for camera permissions in Chrome

CERT_DIR="./ssl"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# Create SSL directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -subj "/C=US/ST=State/L=City/O=SpoolTracker/CN=192.168.2.13" \
  -addext "subjectAltName=IP:192.168.2.13,DNS:localhost,DNS:192.168.2.13"

echo "✅ SSL certificate generated successfully!"
echo "   Certificate: $CERT_FILE"
echo "   Private Key: $KEY_FILE"
echo ""
echo "⚠️  Note: You'll need to accept the security warning in your browser"
echo "   when first accessing https://192.168.2.13:3000"

