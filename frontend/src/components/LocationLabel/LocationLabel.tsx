import { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Settings2 } from 'lucide-react';
import type { Location } from '../../types';
import { Button, Select } from '../ui';
import { generateAmlFile, elementToBase64, downloadAmlFile } from '../../utils/labelife';
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
              background: black;
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
              width: 22mm;
              height: 22mm;
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
              background: black;
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

  const handleDownloadAML = async () => {
    const labelElement = labelRef.current?.querySelector(`.${styles.label}`) as HTMLElement;
    if (!labelElement) return;

    // Convert entire label to PNG base64
    // Label size: 40mm x 30mm = 151px x 113px (at 96 DPI, 1mm = 3.7795px)
    const labelWidth = 151;
    const labelHeight = 113;
    
    // LocationLabel is already at correct size, so we can use it directly
    const imageBase64 = await elementToBase64(labelElement, labelWidth, labelHeight);

    // Generate .aml file with the full label image
    const labelName = `location-${location.name.replace(/\s+/g, '_')}-${location.id}.aml`;
    const amlContent = generateAmlFile(labelName, 40, 30, imageBase64);
    downloadAmlFile(amlContent, labelName);
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
            <div className={styles.brandHeader}>
              📍 {location.name}
            </div>
            <div className={styles.content}>
              <div className={`${styles.qrContainer} qrCode`}>
                <QRCodeCanvas
                  value={locationUrl}
                  size={85}
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
        <Button variant="secondary" onClick={handleDownloadAML}>
          <Download size={16} />
          Download .aml
        </Button>
        <Button onClick={handlePrint}>
          <Printer size={16} />
          Print Label
        </Button>
      </div>
    </div>
  );
}

