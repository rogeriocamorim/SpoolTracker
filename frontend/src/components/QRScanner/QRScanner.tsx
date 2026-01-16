import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, X, AlertCircle, RefreshCw, Eye, Printer, Package, MapPin } from 'lucide-react';
import { Button } from '../ui';
import { logger } from '../../utils/logger';
import { spoolsApi, locationsApi } from '../../api';
import type { Spool, Location } from '../../types';
import styles from './QRScanner.module.css';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

type ScanResult = {
  type: 'spool';
  uid: string;
  url: string;
  data?: Spool;
} | {
  type: 'location';
  id: number;
  url: string;
  data?: Location;
} | null;

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerKey = useRef(0);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const constraintAttempt = useRef(0);

  interface DetectedCode {
    rawValue: string;
  }

  const errorTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScan = async (detectedCodes: DetectedCode[]) => {
    if (detectedCodes && detectedCodes.length > 0 && !scanResult) {
      const scannedUrl = detectedCodes[0].rawValue;
      
      // Check if it's a spool URL
      const spoolMatch = scannedUrl.match(/\/spools\/([^/]+)$/);
      if (spoolMatch) {
        const uid = spoolMatch[1];
        setIsLoading(true);
        try {
          const spool = await spoolsApi.getByUid(uid);
          setScanResult({ type: 'spool', uid, url: scannedUrl, data: spool });
        } catch (err) {
          // Still show result even if we can't fetch details
          setScanResult({ type: 'spool', uid, url: scannedUrl });
        }
        setIsLoading(false);
        return;
      }
      
      // Check if it's a location URL
      const locationMatch = scannedUrl.match(/\/locations\/(\d+)$/);
      if (locationMatch) {
        const id = Number(locationMatch[1]);
        setIsLoading(true);
        try {
          const location = await locationsApi.getById(id);
          setScanResult({ type: 'location', id, url: scannedUrl, data: location });
        } catch (err) {
          // Still show result even if we can't fetch details
          setScanResult({ type: 'location', id, url: scannedUrl });
        }
        setIsLoading(false);
        return;
      }
      
      // Not a valid SpoolTracker QR code
      setError('This QR code is not a SpoolTracker label');
      if (errorTimeoutIdRef.current) {
        clearTimeout(errorTimeoutIdRef.current);
      }
      errorTimeoutIdRef.current = setTimeout(() => {
        setError(null);
        errorTimeoutIdRef.current = null;
      }, 3000);
    }
  };

  const handleError = (err: Error | unknown) => {
    logger.error('QR Scanner error', err instanceof Error ? err : new Error(String(err)), { component: 'QRScanner' });
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Only show error for actual permission/camera issues, not initialization warnings
    if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
      setCameraError(true);
      setError('Camera permission denied. Please allow camera access in your browser settings. On iOS, make sure you tap "Allow" when prompted.');
    } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('No video input')) {
      setCameraError(true);
      setError('No camera found. Please connect a camera device.');
    } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
      setCameraError(true);
      setError('Camera is already in use by another application.');
    } else if (errorMessage.includes('OverconstrainedError') || errorMessage.includes('ConstraintNotSatisfiedError')) {
      // Try with simpler constraints
      if (constraintAttempt.current < 2) {
        constraintAttempt.current += 1;
        setError('Camera constraints not supported. Trying alternative settings...');
        setTimeout(() => {
          scannerKey.current += 1;
        }, 500);
      } else {
        setCameraError(true);
        setError('Could not access camera with any available settings. Please try a different browser or device.');
      }
    } else {
      // For other errors, wait a bit before showing error (might be temporary)
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setCameraError(true);
        setError('Could not access camera. Please check permissions and try again.');
      }, 2000);
    }
  };

  const handleRetry = () => {
    setError(null);
    setCameraError(false);
    constraintAttempt.current = 0; // Reset to try best constraints first
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    // Force re-render of Scanner component with new key
    scannerKey.current += 1;
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setError(null);
    scannerKey.current += 1;
  };

  const handleViewDetails = () => {
    if (scanResult) {
      onScan(scanResult.url);
    }
  };

  const handleOpenInLabelife = async () => {
    if (!scanResult || scanResult.type !== 'spool' || !scanResult.data) {
      return;
    }

    const spool = scanResult.data;
    
    try {
      // Import labelife utilities dynamically
      const { generateAmlFile, downloadAmlFile } = await import('../../utils/labelife');
      
      // We need to generate the label image - create a temporary canvas
      const canvas = document.createElement('canvas');
      const LABEL_WIDTH = 151;
      const LABEL_HEIGHT = 113;
      const SCALE = 5;
      const QR_CODE_SIZE = 70;
      
      canvas.width = LABEL_WIDTH * SCALE;
      canvas.height = LABEL_HEIGHT * SCALE;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.scale(SCALE, SCALE);
      
      // Draw the label (simplified version)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);
      
      // Border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0.5, 0.5, LABEL_WIDTH - 1, LABEL_HEIGHT - 1);
      
      // Header
      const headerHeight = 18;
      const headerPadding = 4;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(headerPadding, headerPadding, LABEL_WIDTH - headerPadding * 2, headerHeight, 3);
      ctx.fill();
      
      // Brand icon
      ctx.fillStyle = '#ffffff';
      const iconX = headerPadding + 6;
      const iconY = headerPadding + 4;
      ctx.fillRect(iconX, iconY, 3, 10);
      ctx.fillRect(iconX + 5, iconY, 3, 10);
      
      // Manufacturer name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(spool.manufacturerName || 'Unknown', iconX + 14, headerPadding + headerHeight / 2);
      
      // Generate QR code using qrcode library
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(`/spools/${spool.uid}`, {
        width: QR_CODE_SIZE * SCALE,
        margin: 0,
        errorCorrectionLevel: 'L',
      });
      
      // Draw QR code
      const qrImage = new Image();
      await new Promise<void>((resolve) => {
        qrImage.onload = () => resolve();
        qrImage.src = qrDataUrl;
      });
      
      const contentY = headerPadding + headerHeight + 4;
      ctx.drawImage(qrImage, headerPadding + 2, contentY, QR_CODE_SIZE, QR_CODE_SIZE);
      
      // Info section
      const infoX = headerPadding + 2 + QR_CODE_SIZE + 6;
      let infoY = contentY + 2;
      
      // Filament type badge
      ctx.fillStyle = '#000000';
      const typeBadgeHeight = 14;
      ctx.font = 'bold 9px Arial, sans-serif';
      const typeTextWidth = ctx.measureText(spool.filamentTypeName || '').width;
      ctx.beginPath();
      ctx.roundRect(infoX, infoY, Math.min(typeTextWidth + 8, LABEL_WIDTH - infoX - headerPadding), typeBadgeHeight, 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(spool.filamentTypeName || '', infoX + 4, infoY + typeBadgeHeight / 2);
      
      // Color name
      infoY += typeBadgeHeight + 4;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textBaseline = 'top';
      const colorText = spool.colorProductCode 
        ? `${spool.colorName} (${spool.colorProductCode})`
        : spool.colorName || '';
      ctx.fillText(colorText, infoX, infoY);
      
      // Hex code
      infoY += 16;
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 10px Courier New, monospace';
      ctx.fillText((spool.colorHexCode || '#000000').toUpperCase(), infoX, infoY);
      
      // Get base64 from canvas
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      // Generate and download .aml file
      const labelName = `spool-${(spool.manufacturerName || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${(spool.filamentTypeName || '').replace(/\s+/g, '-')}-${spool.colorName || ''}-${spool.colorProductCode || spool.uid.slice(0, 8)}.aml`;
      const amlContent = generateAmlFile(labelName, 40, 30, imageBase64);
      downloadAmlFile(amlContent, labelName);
    } catch (err) {
      logger.error('Failed to generate Labelife file', err instanceof Error ? err : new Error(String(err)), { component: 'QRScanner' });
      setError('Failed to generate label file');
    }
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (errorTimeoutIdRef.current) {
        clearTimeout(errorTimeoutIdRef.current);
      }
    };
  }, []);

  // Render scan result view
  if (scanResult) {
    const isSpool = scanResult.type === 'spool';
    const data = scanResult.data;
    
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.title}>
              {isSpool ? <Package size={20} /> : <MapPin size={20} />}
              <h3>{isSpool ? 'Spool Found' : 'Location Found'}</h3>
            </div>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className={styles.scanResult}>
            <div className={styles.resultIcon}>
              {isSpool ? <Package size={48} /> : <MapPin size={48} />}
            </div>
            
            {isSpool && data && 'colorName' in data ? (
              <div className={styles.resultDetails}>
                <div 
                  className={styles.colorSwatch} 
                  style={{ backgroundColor: data.colorHexCode || '#ccc' }}
                />
                <h4>{data.colorName}</h4>
                <p className={styles.resultSubtitle}>
                  {data.manufacturerName} • {data.filamentTypeName}
                </p>
                {data.colorProductCode && (
                  <p className={styles.resultCode}>Code: {data.colorProductCode}</p>
                )}
              </div>
            ) : !isSpool && data && 'name' in data ? (
              <div className={styles.resultDetails}>
                <h4>{data.name}</h4>
                {data.locationType && (
                  <p className={styles.resultSubtitle}>{data.locationType}</p>
                )}
                {data.fullPath && (
                  <p className={styles.resultCode}>{data.fullPath}</p>
                )}
              </div>
            ) : (
              <div className={styles.resultDetails}>
                <h4>{isSpool ? `Spool: ${scanResult.uid}` : `Location #${scanResult.id}`}</h4>
              </div>
            )}
          </div>

          <div className={styles.resultActions}>
            <Button onClick={handleViewDetails} variant="primary">
              <Eye size={18} />
              View Details
            </Button>
            
            {isSpool && data && 'colorName' in data && (
              <Button onClick={handleOpenInLabelife} variant="secondary">
                <Printer size={18} />
                Open in Labelife
              </Button>
            )}
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleScanAgain}>
              <RefreshCw size={18} />
              Scan Another
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Camera size={20} />
            <h3>Scan QR Code</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scannerWrapper}>
          {isLoading ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <p>Loading...</p>
            </div>
          ) : (
            <Scanner
              key={`${scannerKey.current}-${constraintAttempt.current}`}
              onScan={handleScan}
              onError={handleError}
              constraints={
                constraintAttempt.current === 0
                  ? {
                      facingMode: { ideal: 'environment' },
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      // @ts-ignore - advanced constraints for focus
                      focusMode: { ideal: 'continuous' },
                      // @ts-ignore - try to set close focus distance (in meters, 0.1 = 10cm)
                      focusDistance: { ideal: 0.1 }
                    }
                  : constraintAttempt.current === 1
                  ? {
                      facingMode: 'user',
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      // @ts-ignore
                      focusMode: { ideal: 'continuous' }
                    }
                  : {
                      // Last resort: high resolution, any camera
                      width: { ideal: 1920 },
                      height: { ideal: 1080 }
                    }
              }
              styles={{
                container: {
                  width: '100%',
                  height: '100%',
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }
              }}
            />
          )}
          {cameraError && (
            <div className={styles.errorOverlay}>
              <div className={styles.errorState}>
                <AlertCircle size={48} />
                <h4>Camera Access Required</h4>
                <p>{error || 'Could not access camera. Please check permissions.'}</p>
                <div className={styles.instructions}>
                  <p><strong>To enable camera access:</strong></p>
                  <ul>
                    <li>Check your browser's permission settings</li>
                    <li>Make sure no other app is using the camera</li>
                    <li>Try refreshing the page and allowing access when prompted</li>
                  </ul>
                </div>
                <Button onClick={handleRetry} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} />
                  Retry Camera Access
                </Button>
              </div>
            </div>
          )}
          <div className={styles.scanFrame}>
            <div className={styles.corner + ' ' + styles.topLeft} />
            <div className={styles.corner + ' ' + styles.topRight} />
            <div className={styles.corner + ' ' + styles.bottomLeft} />
            <div className={styles.corner + ' ' + styles.bottomRight} />
          </div>
        </div>

        {error && !cameraError && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!cameraError && !isLoading && (
          <p className={styles.hint}>
            Point your camera at a spool or location QR code
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}



