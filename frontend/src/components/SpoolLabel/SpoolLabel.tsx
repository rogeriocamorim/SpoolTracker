import { useRef, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Image as ImageIcon } from 'lucide-react';
import type { Spool } from '../../types';
import { Button } from '../ui';
import { generateAmlFile, downloadAmlFile } from '../../utils/labelife';
import styles from './SpoolLabel.module.css';

interface SpoolLabelProps {
  spool: Spool;
  onClose?: () => void;
}

// Label dimensions at 96 DPI: 40mm x 30mm = 151px x 113px
const LABEL_WIDTH = 151;
const LABEL_HEIGHT = 113;
const SCALE = 5; // High resolution for printing
const QR_CODE_SIZE = 70; // Size of the QR code in pixels

export function SpoolLabel({ spool }: SpoolLabelProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrCodeCanvasRef = useRef<HTMLDivElement>(null);
  
  // Generate the URL that the QR code will link to
  const spoolUrl = `${window.location.origin}/spools/${spool.uid}`;
  
  // Product code for display (Bambu Lab code like 33102)
  const productCode = spool.colorProductCode || '';
  
  // Combine color name and product code like "Black (33102)"
  const colorWithCode = productCode 
    ? `${spool.colorName} (${productCode})` 
    : spool.colorName;

  const renderLabel = useCallback(async () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;

    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    // Set main canvas size at high resolution
    mainCanvas.width = LABEL_WIDTH * SCALE;
    mainCanvas.height = LABEL_HEIGHT * SCALE;

    // Scale context for high resolution
    ctx.scale(SCALE, SCALE);

    // White background with rounded corners
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);

    // Add subtle border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0.5, 0.5, LABEL_WIDTH - 1, LABEL_HEIGHT - 1);

    // Brand header (black bar at top)
    const headerHeight = 18;
    const headerPadding = 4;
    ctx.fillStyle = '#000000';
    roundRect(ctx, headerPadding, headerPadding, LABEL_WIDTH - headerPadding * 2, headerHeight, 3);
    ctx.fill();

    // Brand icon (two vertical bars)
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
    ctx.fillText(spool.manufacturerName, iconX + 14, headerPadding + headerHeight / 2);

    // Content area starts after header
    const contentY = headerPadding + headerHeight + 4;
    const qrSize = QR_CODE_SIZE;
    const qrX = headerPadding + 2;
    const qrY = contentY;

    // Draw QR code from the hidden QRCodeCanvas
    const qrCanvasElement = qrCodeCanvasRef.current?.querySelector('canvas');
    if (qrCanvasElement) {
      ctx.drawImage(qrCanvasElement, qrX, qrY, qrSize, qrSize);
    }

    // Info section (right of QR code)
    const infoX = qrX + qrSize + 6;
    const infoWidth = LABEL_WIDTH - infoX - headerPadding;
    let infoY = contentY + 2;

    // Filament type badge (e.g., "PETG HF")
    ctx.fillStyle = '#000000';
    const typeBadgeHeight = 14;
    const typeText = spool.filamentTypeName;
    ctx.font = 'bold 9px Arial, sans-serif';
    const typeTextWidth = ctx.measureText(typeText).width;
    roundRect(ctx, infoX, infoY, Math.min(typeTextWidth + 8, infoWidth), typeBadgeHeight, 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeText, infoX + 4, infoY + typeBadgeHeight / 2);

    // Color name with product code (e.g., "Black (33102)")
    infoY += typeBadgeHeight + 4;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Handle long text - wrap if needed
    const maxLineWidth = infoWidth - 2;
    const lines = wrapText(ctx, colorWithCode, maxLineWidth);
    lines.forEach((line, index) => {
      ctx.fillText(line, infoX, infoY + index * 12);
    });

    // Hex code (e.g., "#000000")
    infoY += lines.length * 12 + 6;
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.fillText(spool.colorHexCode.toUpperCase(), infoX, infoY);
  }, [spool.manufacturerName, spool.filamentTypeName, colorWithCode, spool.colorHexCode]);

  useEffect(() => {
    // Wait for QR code to render, then render label
    const timer = setTimeout(() => {
      renderLabel();
    }, 100);
    return () => clearTimeout(timer);
  }, [renderLabel]);

  const getCanvasBase64 = (): string => {
    const canvas = mainCanvasRef.current;
    if (!canvas) throw new Error('Main canvas not found');
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.split(',')[1];
  };

  const handleDownloadAML = async () => {
    try {
      // Wait a bit to ensure QR code is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      const imageBase64 = getCanvasBase64();
      const labelName = `spool-${spool.manufacturerName.replace(/\s+/g, '-').toLowerCase()}-${spool.filamentTypeName.replace(/\s+/g, '-')}-${spool.colorName}-${productCode || spool.uid.slice(0, 8)}.aml`;
      const amlContent = generateAmlFile(labelName, 40, 30, imageBase64);
      downloadAmlFile(amlContent, labelName);
    } catch (error) {
      console.error('Failed to generate AML:', error);
    }
  };

  const handleDownloadImage = async () => {
    try {
      // Wait a bit to ensure QR code is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
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
      link.download = `spool-${spool.manufacturerName.replace(/\s+/g, '-').toLowerCase()}-${spool.filamentTypeName.replace(/\s+/g, '-')}-${spool.colorName}-${productCode || spool.uid.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <h4 className={styles.previewTitle}>Spool Label Preview (40mm × 30mm)</h4>
        </div>

        <div className={styles.labelWrapper}>
          <canvas
            ref={mainCanvasRef}
            className={styles.labelCanvas}
            style={{
              width: LABEL_WIDTH,
              height: LABEL_HEIGHT,
            }}
          />
          {/* Hidden QRCodeCanvas to render QR code for drawing onto main canvas */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} ref={qrCodeCanvasRef}>
            <QRCodeCanvas
              value={spoolUrl}
              size={QR_CODE_SIZE * SCALE}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      <div className={styles.urlInfo}>
        <span className={styles.urlLabel}>QR links to:</span>
        <code className={styles.url}>{spoolUrl}</code>
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

// Helper function to draw rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
