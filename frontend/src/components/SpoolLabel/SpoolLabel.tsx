import { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Settings2 } from 'lucide-react';
import type { Spool } from '../../types';
import { Button, Select } from '../ui';
import { generateAmlFile, elementToBase64, downloadAmlFile } from '../../utils/labelife';
import styles from './SpoolLabel.module.css';

interface SpoolLabelProps {
  spool: Spool;
  onClose?: () => void;
}

type LabelSlot = 'type' | 'color' | 'productCode' | 'hexCode' | 'weight' | 'location' | 'spoolType' | 'uid';

const slotOptions: { value: LabelSlot; label: string }[] = [
  { value: 'type', label: 'Filament Type' },
  { value: 'color', label: 'Color Name' },
  { value: 'productCode', label: 'Product Code' },
  { value: 'hexCode', label: 'Hex Code' },
  { value: 'weight', label: 'Weight' },
  { value: 'location', label: 'Location' },
  { value: 'spoolType', label: 'Spool Type' },
  { value: 'uid', label: 'Spool ID' },
];

const spoolTypeLabels: Record<string, string> = {
  PLASTIC: 'Plastic',
  REFILL: 'Refill',
  CARDBOARD: 'Cardboard',
};

export function SpoolLabel({ spool }: SpoolLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const printTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Customizable slots - default configuration
  const [slots, setSlots] = useState<LabelSlot[]>(['type', 'color', 'productCode', 'hexCode']);
  
  // Generate the URL that the QR code will link to
  const spoolUrl = `${window.location.origin}/spools/${spool.uid}`;
  
  // Product code for display (Bambu Lab code like 10100)
  const productCode = spool.colorProductCode || '';

  const getSlotValue = (slot: LabelSlot): string => {
    switch (slot) {
      case 'type':
        return spool.filamentTypeName;
      case 'color':
        return spool.colorName;
      case 'productCode':
        return productCode ? `(${productCode})` : '';
      case 'hexCode':
        return spool.colorHexCode.toUpperCase();
      case 'weight':
        return spool.currentWeightGrams ? `${spool.currentWeightGrams}g` : '';
      case 'location':
        const locName = spool.storageLocationName || spool.location || 'Unknown';
        return spool.locationDetails ? `${locName}: ${spool.locationDetails}` : locName;
      case 'spoolType':
        return spool.spoolType ? spoolTypeLabels[spool.spoolType] : '';
      case 'uid':
        return spool.uid.slice(0, 8);
      default:
        return '';
    }
  };

  const getSlotStyle = (slot: LabelSlot): string => {
    switch (slot) {
      case 'type':
        return styles.typeBadge;
      case 'color':
        return styles.colorName;
      case 'productCode':
        return styles.productCode;
      case 'hexCode':
        return styles.colorCode;
      case 'weight':
        return styles.weight;
      case 'location':
        return styles.location;
      case 'spoolType':
        return styles.spoolType;
      case 'uid':
        return styles.uid;
      default:
        return '';
    }
  };

  const handleSlotChange = (index: number, value: LabelSlot) => {
    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
  };

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
        const isMono = slot === 'hexCode' || slot === 'uid';
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
          <title>Spool Label - ${spool.colorName}</title>
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
            .brand-icon {
              display: flex;
              gap: 0.5mm;
            }
            .brand-icon span {
              width: 1.2mm;
              height: 3.5mm;
              background: white;
            }
            .content {
              display: flex;
              flex: 1;
              gap: 2mm;
              padding-top: 1.5mm;
            }
            .qr-container {
              width: 18mm;
              height: 18mm;
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
              <div class="brand-icon">
                <span></span>
                <span></span>
              </div>
              ${spool.manufacturerName}
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
    // The preview is scaled up (272px x 203px), so we need to capture at actual size
    const labelWidth = 151;
    const labelHeight = 113;
    
    // Create a temporary container with actual size for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = `${labelWidth}px`;
    tempContainer.style.height = `${labelHeight}px`;
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.backgroundColor = '#ffffff';
    document.body.appendChild(tempContainer);
    
    // Clone the label and scale it down to actual size
    const clonedLabel = labelElement.cloneNode(true) as HTMLElement;
    const scale = labelWidth / 272; // 151/272 = 0.555
    clonedLabel.style.width = '272px';
    clonedLabel.style.height = '203px';
    clonedLabel.style.transform = `scale(${scale})`;
    clonedLabel.style.transformOrigin = 'top left';
    clonedLabel.style.backgroundColor = '#ffffff';
    
    // Convert QR code SVG to image to ensure it's captured
    const qrCodeElement = clonedLabel.querySelector('.qrCode');
    if (qrCodeElement) {
      const qrSvg = qrCodeElement.querySelector('svg') as SVGSVGElement;
      if (qrSvg) {
        try {
          // Get the SVG dimensions
          const svgRect = qrSvg.getBoundingClientRect();
          const svgWidth = svgRect.width || 80;
          const svgHeight = svgRect.height || 80;
          
          // Create a canvas to render the SVG
          const canvas = document.createElement('canvas');
          canvas.width = svgWidth;
          canvas.height = svgHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Serialize SVG to string
            const svgData = new XMLSerializer().serializeToString(qrSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            // Load SVG as image and draw on canvas
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                URL.revokeObjectURL(url);
                resolve(null);
              };
              img.onerror = reject;
              img.src = url;
            });
            
            // Replace SVG with image
            const imgElement = document.createElement('img');
            imgElement.src = canvas.toDataURL('image/png');
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.display = 'block';
            qrCodeElement.innerHTML = '';
            qrCodeElement.appendChild(imgElement);
          }
        } catch (error) {
          console.warn('Failed to convert QR code SVG to image:', error);
        }
      }
    }
    
    tempContainer.appendChild(clonedLabel);
    
    try {
      // Wait a bit for the image to render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const imageBase64 = await elementToBase64(tempContainer, labelWidth, labelHeight);
      
      // Generate .aml file with the full label image
      const labelName = `spool-label-${productCode || spool.uid.slice(-5)}.aml`;
      const amlContent = generateAmlFile(labelName, 40, 30, imageBase64);
      downloadAmlFile(amlContent, labelName);
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <h4 className={styles.previewTitle}>Label Preview (40mm × 30mm)</h4>
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
              <div className={styles.brandIcon}>
                <span />
                <span />
              </div>
              {spool.manufacturerName}
            </div>
            <div className={styles.content}>
              <div className={styles.qrContainer}>
                <div className="qrCode">
                  <QRCodeCanvas
                    value={spoolUrl}
                    size={80}
                    level="H"
                    includeMargin={false}
                  />
                </div>
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
        <code className={styles.url}>{spoolUrl}</code>
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
