import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, X, AlertCircle, CheckCircle, Package, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { spoolsApi } from '../../api';
import { useQueryClient } from '@tanstack/react-query';
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

  const handleScan = async (detectedCodes: any[]) => {
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
            setTimeout(() => setError(null), 3000);
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
            setTimeout(() => setError(null), 3000);
          }
        }
      } catch (err) {
        console.error('Error processing QR code:', err);
        setError(err instanceof Error ? err.message : 'Failed to process QR code');
        setTimeout(() => setError(null), 3000);
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
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error assigning spool to location:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign spool to location');
      setState('error');
      setTimeout(() => {
        setState('scanning-location');
        setError(null);
      }, 3000);
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    
    const errorMessage = err?.message || String(err);
    
    // Only show error for actual permission/camera issues, not initialization warnings
    if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
      setCameraError(true);
      setError('Camera permission denied. Please allow camera access in your browser settings.');
    } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('No video input')) {
      setCameraError(true);
      setError('No camera found. Please connect a camera device.');
    } else if (errorMessage.includes('NotReadableError')) {
      setCameraError(true);
      setError('Camera is already in use by another application.');
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
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    // Force re-render of Scanner component
    scannerKey.current += 1;
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
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
              key={scannerKey.current}
              onScan={handleScan}
              onError={handleError}
              constraints={{
                facingMode: 'environment'
              }}
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

