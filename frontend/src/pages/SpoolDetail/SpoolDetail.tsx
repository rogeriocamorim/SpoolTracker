import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Weight, Package, QrCode, Thermometer, Circle, ExternalLink, Box } from 'lucide-react';
import { spoolsApi } from '../../api';
import { Button, Badge } from '../../components/ui';
import styles from './SpoolDetail.module.css';

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

export function SpoolDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  const { data: spools = [], isLoading, error } = useQuery({
    queryKey: ['spools'],
    queryFn: () => spoolsApi.getAll(),
  });

  // Find spool by UID
  const spool = spools.find(s => s.uid === uid);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading spool...</p>
        </div>
      </div>
    );
  }

  if (error || !spool) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <QrCode size={64} className={styles.notFoundIcon} />
          <h2>Spool Not Found</h2>
          <p>The spool with ID <code>{uid}</code> could not be found.</p>
          <Button onClick={() => navigate('/spools')}>
            <ArrowLeft size={18} />
            Back to Spools
          </Button>
        </div>
      </div>
    );
  }

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
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/spools')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={styles.title}>{spool.colorName}</h1>
          <p className={styles.subtitle}>
            {spool.materialName} • {spool.filamentTypeName}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.heroCard}>
          <div 
            className={styles.colorDisplay}
            style={{ backgroundColor: spool.colorHexCode }}
          >
            {(spool.colorHexCode === '#FFFFFF' || spool.colorHexCode === '#ffffff') && (
              <span className={styles.whiteColorBorder} />
            )}
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroHeader}>
              <h2>{spool.colorName}</h2>
              <span className={styles.hexCode}>{spool.colorHexCode.toUpperCase()}</span>
            </div>
            <div className={styles.heroMeta}>
              <span className={styles.manufacturer}>
                <Package size={16} />
                {spool.manufacturerName}
              </span>
              {spool.storageLocationId ? (
                <Badge variant="default" size="md">
                  <MapPin size={14} />
                  {spool.storageLocationFullPath || spool.storageLocationName || 'Unknown'}
                </Badge>
              ) : spool.location ? (
                <Badge variant={locationVariants[spool.location] || 'default'} size="md">
                  <MapPin size={14} />
                  {locationLabels[spool.location] || spool.location}
                </Badge>
              ) : (
                <Badge variant="default" size="md">
                  <MapPin size={14} />
                  No location
                </Badge>
              )}
            </div>
            {spool.locationDetails && (
              <p className={styles.locationDetails}>{spool.locationDetails}</p>
            )}
          </div>
        </div>

        {remainingPercent !== null && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Remaining Filament</span>
              <span className={styles.progressValue}>{remainingPercent.toFixed(0)}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${Math.min(remainingPercent, 100)}%`,
                  backgroundColor: getProgressColor(remainingPercent)
                }}
              />
            </div>
            <div className={styles.weightInfo}>
              <Weight size={16} />
              <span>{spool.currentWeightGrams}g</span>
              <span className={styles.muted}>/ {spool.initialWeightGrams}g</span>
            </div>
          </div>
        )}

        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <h3>Material Info</h3>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Material</span>
                <span className={styles.detailValue}>{spool.materialName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type</span>
                <span className={styles.detailValue}>{spool.filamentTypeName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Manufacturer</span>
                <span className={styles.detailValue}>{spool.manufacturerName}</span>
              </div>
              {spool.colorProductCode && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Product Code</span>
                  <a 
                    href={`https://store.bambulab.com/products/${spool.colorProductCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.productLink}
                  >
                    {spool.colorProductCode} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>Technical Details</h3>
            <div className={styles.detailList}>
              {spool.diameterMm && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}><Circle size={14} /> Diameter</span>
                  <span className={styles.detailValue}>{spool.diameterMm}mm</span>
                </div>
              )}
              {spool.densityGPerCm3 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}><Weight size={14} /> Density</span>
                  <span className={styles.detailValue}>{spool.densityGPerCm3} g/cm³</span>
                </div>
              )}
              {(spool.minNozzleTemp || spool.maxNozzleTemp) && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}><Thermometer size={14} /> Nozzle Temp</span>
                  <span className={styles.detailValue}>
                    {spool.minNozzleTemp}°C - {spool.maxNozzleTemp}°C
                  </span>
                </div>
              )}
              {(spool.minBedTemp || spool.maxBedTemp) && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}><Thermometer size={14} /> Bed Temp</span>
                  <span className={styles.detailValue}>
                    {spool.minBedTemp}°C - {spool.maxBedTemp}°C
                  </span>
                </div>
              )}
              {spool.spoolType && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}><Box size={14} /> Spool Type</span>
                  <span className={styles.detailValue}>
                    {spool.spoolType === 'PLASTIC' ? 'Plastic Spool' : 
                     spool.spoolType === 'REFILL' ? 'Refill' : 'Cardboard'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>Spool Details</h3>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>UID</span>
                <code className={styles.detailValue}>{spool.uid}</code>
              </div>
              {spool.purchaseDate && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Purchased</span>
                  <span className={styles.detailValue}>
                    {new Date(spool.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {spool.purchasePrice && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Price</span>
                  <span className={styles.detailValue}>
                    {spool.purchaseCurrency || '$'}{spool.purchasePrice.toFixed(2)}
                  </span>
                </div>
              )}
              {spool.lastUsedDate && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last Used</span>
                  <span className={styles.detailValue}>
                    {new Date(spool.lastUsedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {spool.notes && (
          <div className={styles.notesCard}>
            <h3>Notes</h3>
            <p>{spool.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

