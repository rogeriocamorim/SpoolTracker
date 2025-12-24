import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { logger } from '../../utils/logger';
import styles from './QRScanner.module.css';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const scannerKey = useRef(0);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const constraintAttempt = useRef(0);

  interface DetectedCode {
    rawValue: string;
  }

  const errorTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScan = (detectedCodes: DetectedCode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedUrl = detectedCodes[0].rawValue;
      
      // Check if it's a valid spool or location URL
      if (scannedUrl.includes('/spools/') || scannedUrl.includes('/locations/')) {
        onScan(scannedUrl);
      } else {
        setError('This QR code is not a SpoolTracker label');
        if (errorTimeoutIdRef.current) {
          clearTimeout(errorTimeoutIdRef.current);
        }
        errorTimeoutIdRef.current = setTimeout(() => {
          setError(null);
          errorTimeoutIdRef.current = null;
        }, 3000);
      }
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
          <Scanner
            key={`${scannerKey.current}-${constraintAttempt.current}`}
            onScan={handleScan}
            onError={handleError}
            constraints={
              constraintAttempt.current === 0
                ? {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }
                : constraintAttempt.current === 1
                ? {
                    facingMode: 'environment'
                  }
                : undefined
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

        {!cameraError && (
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



