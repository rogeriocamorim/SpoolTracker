import { useRef, useEffect, useCallback, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Image as ImageIcon } from 'lucide-react';
import type { Location } from '../../types';
import { Button } from '../ui';
import { generateAmlFile, downloadAmlFile } from '../../utils/labelife';
import styles from './LocationLabel.module.css';

interface LocationLabelProps {
  location: Location;
  onClose?: () => void;
}

// Label dimensions at 96 DPI: 40mm x 30mm = 151px x 113px
const LABEL_WIDTH = 151;
const LABEL_HEIGHT = 113;
const SCALE = 5; // High resolution for printing
const TEXT_BAR_WIDTH = 30;

export function LocationLabel({ location }: LocationLabelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Safely get location properties with fallbacks
  const locationId = location?.id || '';
  const locationName = location?.name || '';
  
  // Check if data is ready
  const isDataReady = Boolean(locationId && locationName);
  
  // Generate the URL that the QR code will link to
  const locationUrl = locationId ? `${window.location.origin}/locations/${locationId}` : '';

  const renderLabel = useCallback(() => {
    if (!isDataReady) return;
    
    const canvas = previewCanvasRef.current;
    const qrContainer = qrContainerRef.current;
    if (!canvas || !qrContainer) return;

    // Find the QR canvas inside the container
    const qrCanvas = qrContainer.querySelector('canvas') as HTMLCanvasElement;
    if (!qrCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size at high resolution
    canvas.width = LABEL_WIDTH * SCALE;
    canvas.height = LABEL_HEIGHT * SCALE;

    // Scale context for high resolution
    ctx.scale(SCALE, SCALE);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);

    // Black text bar on left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, TEXT_BAR_WIDTH, LABEL_HEIGHT);

    // Draw rotated text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Move to center of text bar, rotate, then draw
    ctx.translate(TEXT_BAR_WIDTH / 2, LABEL_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2); // Rotate -90 degrees (text reads bottom to top)
    ctx.fillText(locationName, 0, 0);
    ctx.restore();

    // Draw QR code from the hidden QRCodeCanvas
    const qrSize = Math.min(LABEL_WIDTH - TEXT_BAR_WIDTH - 8, LABEL_HEIGHT - 8);
    const qrX = TEXT_BAR_WIDTH + (LABEL_WIDTH - TEXT_BAR_WIDTH - qrSize) / 2;
    const qrY = (LABEL_HEIGHT - qrSize) / 2;
    
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    
    setIsReady(true);
  }, [isDataReady, locationName]);

  useEffect(() => {
    // Wait for QR code to render, then render the label
    const timer = setTimeout(() => {
      renderLabel();
    }, 200);
    return () => clearTimeout(timer);
  }, [renderLabel, locationUrl]);

  const getCanvasBase64 = (): string => {
    const canvas = previewCanvasRef.current;
    if (!canvas) throw new Error('Canvas not found');
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1];
  };

  const handleDownloadAML = async () => {
    if (!isDataReady) return;
    try {
      // Re-render to make sure it's up to date
      renderLabel();
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const imageBase64 = getCanvasBase64();
      const labelName = `location-${locationName.replace(/\s+/g, '_')}-${locationId}.aml`;
      const amlContent = generateAmlFile(labelName, 40, 30, imageBase64);
      downloadAmlFile(amlContent, labelName);
    } catch (error) {
      console.error('Failed to generate AML:', error);
    }
  };

  const handleDownloadImage = async () => {
    if (!isDataReady) return;
    try {
      // Re-render to make sure it's up to date
      renderLabel();
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const imageBase64 = getCanvasBase64();
      
      // Convert base64 to blob and download
      const byteCharacters = atob(imageBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `location-${locationName.replace(/\s+/g, '_')}-${locationId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };
  
  // Don't render the full component if data is not ready
  if (!isDataReady) {
    return (
      <div className={styles.container}>
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <h4 className={styles.previewTitle}>Loading location label...</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <h4 className={styles.previewTitle}>Location Label Preview (40mm × 30mm)</h4>
        </div>

        <div className={styles.labelWrapper}>
          {/* Hidden QR code canvas that we'll draw from */}
          {locationUrl && (
            <div ref={qrContainerRef} style={{ position: 'absolute', left: -9999, top: -9999 }}>
              <QRCodeCanvas
                value={locationUrl}
                size={100 * SCALE}
                level="H"
                includeMargin={false}
              />
            </div>
          )}
          
          {/* Main preview canvas */}
          <canvas
            ref={previewCanvasRef}
            className={styles.labelCanvas}
            style={{
              width: LABEL_WIDTH,
              height: LABEL_HEIGHT,
              opacity: isReady ? 1 : 0,
            }}
          />
        </div>
      </div>

      <div className={styles.urlInfo}>
        <span className={styles.urlLabel}>QR links to:</span>
        <code className={styles.url}>{locationUrl}</code>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleDownloadImage}>
          <ImageIcon size={16} />
          Download as Image
        </Button>
        <Button onClick={handleDownloadAML}>
          <Download size={16} />
          Download .aml
        </Button>
      </div>
    </div>
  );
}
