import { useState } from 'react';
import { MapPin, Weight, Calendar, MoreVertical, Trash2, Edit, Package, QrCode } from 'lucide-react';
import type { Spool } from '../../types';
import { Badge } from '../ui';
import styles from './SpoolCard.module.css';

interface SpoolCardProps {
  spool: Spool;
  onEdit: (spool: Spool) => void;
  onDelete: (spool: Spool) => void;
  onUpdateLocation: (spool: Spool) => void;
  onGenerateLabel?: (spool: Spool) => void;
}

const locationLabels: Record<string, string> = {
  AMS: 'AMS',
  PRINTER: 'Printer',
  RACK: 'Rack',
  STORAGE: 'Storage',
  IN_USE: 'In Use',
  EMPTY: 'Empty',
};

const locationVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  AMS: 'success',
  PRINTER: 'info',
  RACK: 'default',
  STORAGE: 'default',
  IN_USE: 'warning',
  EMPTY: 'danger',
};

export function SpoolCard({ spool, onEdit, onDelete, onUpdateLocation, onGenerateLabel }: SpoolCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const remainingPercent = spool.remainingPercentage ?? 
    (spool.initialWeightGrams && spool.currentWeightGrams 
      ? (spool.currentWeightGrams / spool.initialWeightGrams) * 100 
      : null);

  const getProgressColor = (percent: number) => {
    if (percent > 50) return 'var(--color-success)';
    if (percent > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className={styles.card}>
      <div className={styles.colorStrip} style={{ backgroundColor: spool.colorHexCode }} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.colorSwatch} style={{ backgroundColor: spool.colorHexCode }}>
            {spool.colorHexCode === '#FFFFFF' || spool.colorHexCode === '#ffffff' ? (
              <span className={styles.whiteSwatchBorder} />
            ) : null}
          </div>
          
          <div className={styles.headerInfo}>
            <div className={styles.colorNameRow}>
              <h3 className={styles.colorName}>{spool.colorName}</h3>
              {spool.colorNumber && (
                <Badge variant="info" size="sm" style={{ marginLeft: '8px' }}>
                  #{spool.colorNumber}
                </Badge>
              )}
            </div>
            <p className={styles.materialType}>
              {spool.materialName} • {spool.filamentTypeName}
            </p>
          </div>

          <div className={styles.menuWrapper}>
            <button 
              className={styles.menuButton}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>
            
            {showMenu && (
              <>
                <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
                <div className={styles.menu}>
                  <button onClick={() => { onEdit(spool); setShowMenu(false); }}>
                    <Edit size={16} />
                    Edit
                  </button>
                  <button onClick={() => { onUpdateLocation(spool); setShowMenu(false); }}>
                    <MapPin size={16} />
                    Move
                  </button>
                  {onGenerateLabel && (
                    <button onClick={() => { onGenerateLabel(spool); setShowMenu(false); }}>
                      <QrCode size={16} />
                      Print Label
                    </button>
                  )}
                  <button 
                    className={styles.deleteButton} 
                    onClick={() => { onDelete(spool); setShowMenu(false); }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <Package size={14} />
            <span>{spool.manufacturerName}</span>
          </div>
          
          <div className={styles.detailRow}>
            <MapPin size={14} />
            {spool.storageLocationId ? (
              <Badge variant="default" size="sm">
                {spool.storageLocationName || 'Unknown'}
              </Badge>
            ) : spool.location ? (
              <Badge variant={locationVariants[spool.location] || 'default'} size="sm">
                {locationLabels[spool.location] || spool.location}
              </Badge>
            ) : (
              <Badge variant="default" size="sm">No location</Badge>
            )}
            {spool.locationDetails && (
              <span className={styles.locationDetails}>{spool.locationDetails}</span>
            )}
          </div>

          {spool.currentWeightGrams !== undefined && spool.currentWeightGrams !== null && (
            <div className={styles.detailRow}>
              <Weight size={14} />
              <span>{spool.currentWeightGrams}g</span>
              {spool.initialWeightGrams && (
                <span className={styles.muted}>/ {spool.initialWeightGrams}g</span>
              )}
            </div>
          )}

          {spool.lastUsedDate && (
            <div className={styles.detailRow}>
              <Calendar size={14} />
              <span className={styles.muted}>
                Last used: {new Date(spool.lastUsedDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {remainingPercent !== null && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${Math.min(remainingPercent, 100)}%`,
                  backgroundColor: getProgressColor(remainingPercent)
                }}
              />
            </div>
            <span className={styles.progressText}>
              {remainingPercent.toFixed(0)}%
            </span>
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.uid} title={spool.uid}>
            #{spool.uid.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
  );
}

