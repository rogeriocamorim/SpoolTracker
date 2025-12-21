import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Weight } from 'lucide-react';
import type { Spool } from '../../types';
import { SpoolCard } from '../SpoolCard';
import { Badge } from '../ui';
import styles from './SpoolGroup.module.css';

interface SpoolGroupProps {
  spools: Spool[];
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

export function SpoolGroup({ spools, onEdit, onDelete, onUpdateLocation, onGenerateLabel }: SpoolGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get the first spool for display info (they all share same color/type/manufacturer)
  const firstSpool = spools[0];
  
  // Calculate totals
  const totalCurrentWeight = spools.reduce((sum, s) => sum + (s.currentWeightGrams || 0), 0);
  const totalInitialWeight = spools.reduce((sum, s) => sum + (s.initialWeightGrams || 0), 0);
  const averageRemaining = totalInitialWeight > 0 
    ? (totalCurrentWeight / totalInitialWeight) * 100 
    : null;

  // Count by location (handle both new and old location systems)
  const locationCounts = spools.reduce((acc, s) => {
    const locationKey = s.storageLocationName || s.location || 'Unknown';
    acc[locationKey] = (acc[locationKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getProgressColor = (percent: number) => {
    if (percent > 50) return 'var(--color-success)';
    if (percent > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className={`${styles.group} ${isExpanded ? styles.expanded : ''}`}>
      <div 
        className={styles.groupHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.colorStrip} style={{ backgroundColor: firstSpool.colorHexCode }} />
        
        <div className={styles.content}>
          <div className={styles.mainInfo}>
            <div 
              className={styles.colorSwatch} 
              style={{ backgroundColor: firstSpool.colorHexCode }}
            >
              {firstSpool.colorHexCode.toUpperCase() === '#FFFFFF' && (
                <span className={styles.whiteSwatchBorder} />
              )}
            </div>
            
            <div className={styles.details}>
              <div className={styles.titleRow}>
                <h3 className={styles.colorName}>{firstSpool.colorName}</h3>
                <Badge variant="info" size="sm">{spools.length} spools</Badge>
              </div>
              <p className={styles.materialType}>
                {firstSpool.materialName} • {firstSpool.filamentTypeName} • {firstSpool.manufacturerName}
              </p>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <Weight size={16} />
              <span className={styles.statValue}>{totalCurrentWeight.toFixed(0)}g</span>
              <span className={styles.statLabel}>total</span>
            </div>

            <div className={styles.locations}>
              {Object.entries(locationCounts).map(([loc, count]) => (
                <div key={loc} className={styles.locationBadge}>
                  <MapPin size={12} />
                  <span>{locationLabels[loc]}: {count}</span>
                </div>
              ))}
            </div>
          </div>

          {averageRemaining !== null && (
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${Math.min(averageRemaining, 100)}%`,
                    backgroundColor: getProgressColor(averageRemaining)
                  }}
                />
              </div>
              <span className={styles.progressText}>
                {averageRemaining.toFixed(0)}% avg
              </span>
            </div>
          )}

          <div className={styles.expandIcon}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.spoolsList}>
          <div className={styles.spoolsHeader}>
            <h4>Individual Spools</h4>
          </div>
          <div className={styles.spoolsGrid}>
            {spools.map((spool) => (
              <SpoolCard
                key={spool.id}
                spool={spool}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateLocation={onUpdateLocation}
                onGenerateLabel={onGenerateLabel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

