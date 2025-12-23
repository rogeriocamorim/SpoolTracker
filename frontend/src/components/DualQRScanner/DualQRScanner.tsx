import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, X, AlertCircle, CheckCircle, Package, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { spoolsApi } from '../../api';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';
import styles from './DualQRScanner.module.css';

interface DualQRScannerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type ScanState = 'idle' | 'scanning-spool' | 'scanning-location' | 'processing' | 'success' | 'error';

export function DualQRScanner({ onClose, onSuccess }: DualQRScannerProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ScanState>('scanning-spool');
  const [scannedSpool, setScannedSpool] = useState<{ uid: string; name: string } | null>(null);
  const [scannedLocation, setScannedLocation] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const scannerKey = useRef(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const constraintAttempt = useRef(0);

  interface DetectedCode {
    rawValue: string;
  }

  const handleScan = async (detectedCodes: DetectedCode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedUrl = detectedCodes[0].rawValue;
      
      try {
        if (state === 'scanning-spool') {
          // Check if it's a spool URL
          const spoolMatch = scannedUrl.match(/\/spools\/([^/]+)$/);
          if (spoolMatch) {
            const spoolUid = spoolMatch[1];
            // Fetch spool details
            const spool = await spoolsApi.getByUid(spoolUid);
            setScannedSpool({
              uid: spool.uid,
              name: `${spool.colorName} (${spool.materialName})`
            });
            setState('scanning-location');
            setError(null);
          } else {
            setError('This QR code is not a spool label. Please scan a spool QR code first.');
            if (errorTimeoutRef.current) {
              clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = setTimeout(() => {
              setError(null);
              errorTimeoutRef.current = null;
            }, 3000);
          }
        } else if (state === 'scanning-location') {
          // Check if it's a location URL
          const locationMatch = scannedUrl.match(/\/locations\/(\d+)$/);
          if (locationMatch) {
            const locationId = Number(locationMatch[1]);
            // Fetch location details
            const { locationsApi } = await import('../../api');
            const location = await locationsApi.getById(locationId);
            setScannedLocation({
              id: location.id,
              name: location.name
            });
            // Now assign spool to location
            await assignSpoolToLocation();
          } else {
            setError('This QR code is not a location label. Please scan a location QR code.');
            if (errorTimeoutRef.current) {
              clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = setTimeout(() => {
              setError(null);
              errorTimeoutRef.current = null;
            }, 3000);
          }
        }
      } catch (err) {
        logger.error('Error processing QR code', err instanceof Error ? err : new Error(String(err)), { component: 'DualQRScanner', state });
        setError(err instanceof Error ? err.message : 'Failed to process QR code');
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
          errorTimeoutRef.current = null;
        }, 3000);
      }
    }
  };

  const assignSpoolToLocation = async () => {
    if (!scannedSpool || !scannedLocation) return;

    setState('processing');
    setError(null);

    try {
      // Get spool by UID
      const spool = await spoolsApi.getByUid(scannedSpool.uid);
      
      // Move spool to location
      await spoolsApi.moveToLocation(spool.id, scannedLocation.id);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      setState('success');
      
      // Call success callback after a short delay
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        successTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      logger.error('Error assigning spool to location', err instanceof Error ? err : new Error(String(err)), { 
        component: 'DualQRScanner',
        spoolUid: scannedSpool?.uid,
        locationId: scannedLocation?.id,
      });
      setError(err instanceof Error ? err.message : 'Failed to assign spool to location');
      setState('error');
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setState('scanning-location');
        setError(null);
        errorTimeoutRef.current = null;
      }, 3000);
    }
  };

  const handleError = (err: Error | unknown) => {
    logger.error('QR Scanner error', err instanceof Error ? err : new Error(String(err)), { component: 'DualQRScanner' });
    
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
    // Force re-render of Scanner component
    scannerKey.current += 1;
  };

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    setState('scanning-spool');
    setScannedSpool(null);
    setScannedLocation(null);
    setError(null);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Camera size={20} />
            <h3>Move Spool to Location</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Status Display */}
        <div className={styles.status}>
          {state === 'scanning-spool' && (
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <Package size={20} />
              </div>
              <div>
                <strong>Step 1: Scan Spool</strong>
                <p>Point your camera at the spool QR code</p>
              </div>
            </div>
          )}

          {state === 'scanning-location' && scannedSpool && (
            <div className={styles.statusItem}>
              <div className={styles.statusIcon + ' ' + styles.completed}>
                <CheckCircle size={20} />
              </div>
              <div>
                <strong>Step 1: Spool Scanned ✓</strong>
                <p>{scannedSpool.name}</p>
              </div>
            </div>
          )}

          {state === 'scanning-location' && (
            <div className={styles.statusItem}>
              <div className={styles.statusIcon}>
                <MapPin size={20} />
              </div>
              <div>
                <strong>Step 2: Scan Location</strong>
                <p>Point your camera at the location QR code</p>
              </div>
            </div>
          )}

          {state === 'processing' && (
            <div className={styles.statusItem}>
              <div className={styles.statusIcon + ' ' + styles.processing}>
                <div className={styles.spinner} />
              </div>
              <div>
                <strong>Processing...</strong>
                <p>Assigning spool to location</p>
              </div>
            </div>
          )}

          {state === 'success' && scannedSpool && scannedLocation && (
            <div className={styles.statusItem + ' ' + styles.success}>
              <div className={styles.statusIcon}>
                <CheckCircle size={20} />
              </div>
              <div>
                <strong>Success!</strong>
                <p>{scannedSpool.name} moved to {scannedLocation.name}</p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className={styles.statusItem + ' ' + styles.error}>
              <div className={styles.statusIcon}>
                <AlertCircle size={20} />
              </div>
              <div>
                <strong>Error</strong>
                <p>{error || 'Something went wrong'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Scanner */}
        {(state === 'scanning-spool' || state === 'scanning-location') && (
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
        )}

        {error && state !== 'error' && !cameraError && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.actions}>
          {state === 'scanning-location' && (
            <Button variant="secondary" onClick={handleReset}>
              Scan Different Spool
            </Button>
          )}
          {(state === 'success' || state === 'error') && (
            <Button variant="secondary" onClick={handleReset}>
              Scan Another
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

