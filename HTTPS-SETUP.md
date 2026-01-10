# HTTPS Setup for Camera Access

Chrome and other modern browsers require HTTPS to access the camera. This guide will help you set up HTTPS for your SpoolTracker application.

## Quick Setup

1. **Generate SSL Certificate:**
   ```bash
   ./generate-ssl-cert.sh
   ```

2. **Deploy the application:**
   ```bash
   ./deploy.sh --all
   ```

3. **Access the application via HTTPS:**
   - Open: `https://192.168.2.13:3443`
   - You'll see a security warning (this is normal for self-signed certificates)
   - Click "Advanced" → "Proceed to 192.168.2.13 (unsafe)"

4. **Allow camera permissions:**
   - Chrome will now allow you to grant camera permissions
   - The camera should work for QR scanning

## Important Notes

- **Port 3443**: HTTPS is available on port 3443 (to avoid conflicts with other services)
- **Self-signed certificate**: You'll need to accept the security warning the first time
- **HTTP redirect**: HTTP (port 3000) will automatically redirect to HTTPS
- **Certificate location**: Certificates are stored in `./ssl/` directory

## Troubleshooting

If the certificate doesn't work:
1. Make sure the `ssl/` directory exists and contains `cert.pem` and `key.pem`
2. Check that port 3443 is not blocked by firewall
3. Verify the certificate was generated correctly:
   ```bash
   openssl x509 -in ssl/cert.pem -text -noout
   ```

## Regenerating Certificate

If you need to regenerate the certificate:
```bash
rm -rf ssl/
./generate-ssl-cert.sh
./deploy.sh --restart
```

