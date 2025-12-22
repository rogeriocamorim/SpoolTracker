import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Settings2 } from 'lucide-react';
import type { Location } from '../../types';
import { Button, Select } from '../ui';
import styles from './LocationLabel.module.css';

interface LocationLabelProps {
  location: Location;
  onClose?: () => void;
}

type LabelSlot = 'name' | 'type' | 'description' | 'capacity' | 'id';

const slotOptions: { value: LabelSlot; label: string }[] = [
  { value: 'name', label: 'Location Name' },
  { value: 'type', label: 'Location Type' },
  { value: 'description', label: 'Description' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'id', label: 'Location ID' },
];

export function LocationLabel({ location }: LocationLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Customizable slots - default configuration
  const [slots, setSlots] = useState<LabelSlot[]>(['name', 'type']);
  
  // Generate the URL that the QR code will link to
  const locationUrl = `${window.location.origin}/locations/${location.id}`;
  
  const getSlotValue = (slot: LabelSlot): string => {
    switch (slot) {
      case 'name':
        return location.name;
      case 'type':
        return location.locationType || 'Location';
      case 'description':
        return location.description || '';
      case 'capacity':
        return location.capacity ? `Capacity: ${location.capacity}` : '';
      case 'id':
        return `ID: ${location.id}`;
      default:
        return '';
    }
  };

  const getSlotStyle = (slot: LabelSlot): string => {
    switch (slot) {
      case 'name':
        return styles.name;
      case 'type':
        return styles.typeBadge;
      case 'description':
        return styles.description;
      case 'capacity':
        return styles.capacity;
      case 'id':
        return styles.id;
      default:
        return '';
    }
  };

  const handleSlotChange = (index: number, value: LabelSlot) => {
    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
  };

  const printTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !labelRef.current) return;
    
    // Clear any existing timeout
    if (printTimeoutRef.current) {
      clearTimeout(printTimeoutRef.current);
    }

    const slotContent = slots
      .map((slot) => {
        const value = getSlotValue(slot);
        if (!value) return '';
        const isTypeBadge = slot === 'type';
        const isMono = slot === 'id';
        return isTypeBadge
          ? `<span class="type-badge">${value}</span>`
          : isMono
            ? `<span class="mono-text">${value}</span>`
            : `<span class="text-line">${value}</span>`;
      })
      .filter(Boolean)
      .join('\n                ');

    const labelHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Location Label - ${location.name}</title>
          <style>
            @page {
              size: 40mm 30mm;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
              width: 40mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              background: white;
            }
            .label {
              width: 40mm;
              height: 30mm;
              padding: 1.5mm;
              display: flex;
              flex-direction: column;
              border: 0.3mm solid #ccc;
              border-radius: 1.5mm;
            }
            .brand-header {
              background: ${location.color || '#00AE42'};
              color: white;
              font-size: 4mm;
              font-weight: 900;
              padding: 1mm 2mm;
              display: flex;
              align-items: center;
              gap: 1.5mm;
              border-radius: 1mm;
              letter-spacing: -0.3mm;
            }
            .content {
              display: flex;
              flex: 1;
              gap: 2mm;
              padding-top: 1.5mm;
            }
            .qr-container {
              width: 15mm;
              height: 15mm;
              flex-shrink: 0;
            }
            .qr-container svg {
              width: 100%;
              height: 100%;
            }
            .info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 0.5mm;
            }
            .type-badge {
              background: ${location.color || '#00AE42'};
              color: white;
              font-size: 3mm;
              font-weight: 900;
              padding: 0.6mm 1.5mm;
              border-radius: 0.5mm;
              display: inline-block;
              width: fit-content;
              letter-spacing: -0.1mm;
            }
            .text-line {
              font-size: 3mm;
              font-weight: 900;
              color: black;
              letter-spacing: -0.1mm;
              line-height: 1.3;
            }
            .mono-text {
              font-size: 2.8mm;
              color: #333;
              font-family: 'Courier New', monospace;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand-header">
              📍 ${location.name}
            </div>
            <div class="content">
              <div class="qr-container">
                ${labelRef.current.querySelector('.qrCode')?.innerHTML || ''}
              </div>
              <div class="info">
                ${slotContent}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(labelHtml);
    printWindow.document.close();
    printWindow.focus();
    printTimeoutRef.current = setTimeout(() => {
      printWindow.print();
      printTimeoutRef.current = null;
    }, 250);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, []);

  const handleDownloadSVG = () => {
    const svgElement = labelRef.current?.querySelector('.qrCode svg');
    if (!svgElement) return;

    // Build slot content for SVG
    let yOffset = 28;
    const svgSlotContent = slots
      .map((slot) => {
        const value = getSlotValue(slot);
        if (!value) return '';
        
        const isTypeBadge = slot === 'type';
        const isMono = slot === 'id';
        
        let content = '';
        if (isTypeBadge) {
          content = `<rect x="66" y="${yOffset}" width="80" height="14" rx="2" fill="${location.color || '#00AE42'}"/>
  <text x="70" y="${yOffset + 11}" font-family="Arial Black, sans-serif" font-size="10" font-weight="900" fill="white">${value}</text>`;
          yOffset += 16;
        } else if (isMono) {
          content = `<text x="66" y="${yOffset + 11}" font-family="Courier New, monospace" font-size="9" font-weight="bold" fill="#333">${value}</text>`;
          yOffset += 14;
        } else {
          content = `<text x="66" y="${yOffset + 11}" font-family="Arial Black, sans-serif" font-size="10" font-weight="900" fill="black">${value}</text>`;
          yOffset += 14;
        }
        return content;
      })
      .filter(Boolean)
      .join('\n  ');

    const labelSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="151" height="113" viewBox="0 0 151 113">
  <rect width="151" height="113" fill="white" rx="5" stroke="#ccc" stroke-width="1"/>
  
  <!-- Brand Header -->
  <rect x="6" y="6" width="139" height="18" rx="3" fill="${location.color || '#00AE42'}"/>
  <text x="11" y="20" font-family="Arial Black, sans-serif" font-size="13" font-weight="900" fill="white">📍 ${location.name}</text>
  
  <!-- QR Code placeholder area -->
  <g transform="translate(8, 28) scale(0.95)">
    ${svgElement.innerHTML}
  </g>
  
  <!-- Info -->
  ${svgSlotContent}
</svg>`;

    const blob = new Blob([labelSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `location-label-${location.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <h4 className={styles.previewTitle}>Location Label Preview (40mm × 30mm)</h4>
          <button
            className={styles.settingsButton}
            onClick={() => setShowSettings(!showSettings)}
            title="Customize label"
          >
            <Settings2 size={18} />
          </button>
        </div>
        
        {showSettings && (
          <div className={styles.settings}>
            <p className={styles.settingsLabel}>Customize label information:</p>
            <div className={styles.slotGrid}>
              {slots.map((slot, index) => (
                <Select
                  key={index}
                  options={slotOptions}
                  value={slot}
                  onChange={(e) => handleSlotChange(index, e.target.value as LabelSlot)}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.labelWrapper} ref={labelRef}>
          <div className={styles.label}>
            <div className={styles.brandHeader} style={{ backgroundColor: location.color || '#00AE42' }}>
              📍 {location.name}
            </div>
            <div className={styles.content}>
              <div className={`${styles.qrContainer} qrCode`}>
                <QRCodeSVG
                  value={locationUrl}
                  size={60}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className={styles.info}>
                {slots.map((slot, index) => {
                  const value = getSlotValue(slot);
                  if (!value) return null;
                  return (
                    <span key={index} className={getSlotStyle(slot)}>
                      {value}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.urlInfo}>
        <span className={styles.urlLabel}>QR links to:</span>
        <code className={styles.url}>{locationUrl}</code>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleDownloadSVG}>
          <Download size={16} />
          Download SVG
        </Button>
        <Button onClick={handlePrint}>
          <Printer size={16} />
          Print Label
        </Button>
      </div>
    </div>
  );
}

