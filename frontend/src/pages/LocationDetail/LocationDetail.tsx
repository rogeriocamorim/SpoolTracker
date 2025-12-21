import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Package, Edit,
  ArrowRightLeft, QrCode, Weight
} from 'lucide-react';
import { locationsApi } from '../../api';
import { SpoolLabel } from '../../components/SpoolLabel';
import { LocationLabel } from '../../components/LocationLabel';
import { Button, Badge, Modal, Select } from '../../components/ui';
import type { Spool } from '../../types';
import styles from './LocationDetail.module.css';

export function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locationId = Number(id);

  // Modal states
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isLocationLabelModalOpen, setIsLocationLabelModalOpen] = useState(false);
  const [selectedSpool, setSelectedSpool] = useState<Spool | null>(null);
  const [targetLocationId, setTargetLocationId] = useState<number | null>(null);

  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: ['locations', locationId],
    queryFn: () => locationsApi.getById(locationId),
    enabled: !!locationId,
  });

  const { data: spools = [], isLoading: spoolsLoading } = useQuery({
    queryKey: ['locations', locationId, 'spools'],
    queryFn: () => locationsApi.getSpools(locationId),
    enabled: !!locationId,
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll({ activeOnly: true }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ targetId, spoolId }: { targetId: number; spoolId: number }) =>
      locationsApi.moveSpool(targetId, spoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsMoveModalOpen(false);
      setSelectedSpool(null);
      setTargetLocationId(null);
    },
  });

  const handleMove = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsMoveModalOpen(true);
  };

  const handleLabel = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsLabelModalOpen(true);
  };

  const handleSubmitMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSpool && targetLocationId) {
      moveMutation.mutate({ targetId: targetLocationId, spoolId: selectedSpool.id });
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent > 50) return 'var(--color-success)';
    if (percent > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const isLoading = locationLoading || spoolsLoading;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <MapPin size={64} className={styles.notFoundIcon} />
          <h2>Location Not Found</h2>
          <p>The location you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/locations')}>
            <ArrowLeft size={18} />
            Back to Locations
          </Button>
        </div>
      </div>
    );
  }

  const totalWeight = spools.reduce((sum, s) => sum + (s.currentWeightGrams ?? 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/locations')}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <MapPin size={24} style={{ color: location.color || 'var(--color-text-muted)' }} />
            <h1 className={styles.title}>{location.name}</h1>
          </div>
          {location.description && (
            <p className={styles.subtitle}>{location.description}</p>
          )}
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setIsLocationLabelModalOpen(true)}
          title="Generate Location Label"
        >
          <QrCode size={18} />
          Generate Label
        </Button>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Package size={24} />
          <div>
            <span className={styles.statValue}>{spools.length}</span>
            <span className={styles.statLabel}>
              Spools{location.capacity ? ` / ${location.capacity}` : ''}
            </span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Weight size={24} />
          <div>
            <span className={styles.statValue}>{(totalWeight / 1000).toFixed(2)} kg</span>
            <span className={styles.statLabel}>Total Filament</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <MapPin size={24} />
          <div>
            <span className={styles.statValue}>{location.locationType || 'N/A'}</span>
            <span className={styles.statLabel}>Type</span>
          </div>
        </div>
      </div>

      {/* Spools List */}
      <div className={styles.spoolsSection}>
        <h2>Spools at this Location</h2>
        
        {spools.length === 0 ? (
          <div className={styles.emptySpools}>
            <Package size={32} />
            <p>No spools at this location</p>
          </div>
        ) : (
          <div className={styles.spoolsList}>
            {spools.map(spool => {
              const remaining = spool.remainingPercentage ?? 
                (spool.initialWeightGrams && spool.currentWeightGrams 
                  ? (spool.currentWeightGrams / spool.initialWeightGrams) * 100 
                  : null);

              return (
                <div key={spool.id} className={styles.spoolCard}>
                  <div 
                    className={styles.colorSwatch}
                    style={{ backgroundColor: spool.colorHexCode }}
                  />
                  <div className={styles.spoolInfo}>
                    <div className={styles.spoolHeader}>
                      <span className={styles.spoolName}>{spool.colorName}</span>
                      <Badge variant="default" size="sm">{spool.materialName}</Badge>
                    </div>
                    <span className={styles.spoolType}>
                      {spool.manufacturerName} • {spool.filamentTypeName}
                    </span>
                    {remaining !== null && (
                      <div className={styles.progressWrapper}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ 
                              width: `${Math.min(remaining, 100)}%`,
                              backgroundColor: getProgressColor(remaining)
                            }}
                          />
                        </div>
                        <span className={styles.progressText}>
                          {spool.currentWeightGrams?.toFixed(0)}g ({remaining.toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.spoolActions}>
                    <button onClick={() => handleLabel(spool)} title="Generate Label">
                      <QrCode size={16} />
                    </button>
                    <button onClick={() => handleMove(spool)} title="Move to another location">
                      <ArrowRightLeft size={16} />
                    </button>
                    <button onClick={() => navigate(`/spools/${spool.uid}`)} title="View Details">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Move Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setSelectedSpool(null); setTargetLocationId(null); }}
        title="Move Spool"
        size="sm"
      >
        <form onSubmit={handleSubmitMove} className={styles.form}>
          {selectedSpool && (
            <div className={styles.moveSpoolInfo}>
              <div 
                className={styles.moveColorSwatch}
                style={{ backgroundColor: selectedSpool.colorHexCode }}
              />
              <div>
                <strong>{selectedSpool.colorName}</strong>
                <span>{selectedSpool.materialName} • {selectedSpool.filamentTypeName}</span>
              </div>
            </div>
          )}

          <Select
            label="Move to Location"
            options={[
              { value: '', label: 'Select location...' },
              ...allLocations
                .filter(l => l.id !== locationId)
                .map(l => ({ 
                  value: l.id, 
                  label: `${l.name}${l.spoolCount !== undefined ? ` (${l.spoolCount} spools)` : ''}` 
                })),
            ]}
            value={targetLocationId || ''}
            onChange={(e) => setTargetLocationId(e.target.value ? Number(e.target.value) : null)}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsMoveModalOpen(false); setSelectedSpool(null); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={moveMutation.isPending} disabled={!targetLocationId}>
              Move Spool
            </Button>
          </div>
        </form>
      </Modal>

      {/* Label Modal */}
      <Modal
        isOpen={isLabelModalOpen}
        onClose={() => { setIsLabelModalOpen(false); setSelectedSpool(null); }}
        title="Generate Spool Label"
        size="md"
      >
        {selectedSpool && (
          <SpoolLabel spool={selectedSpool} />
        )}
      </Modal>

      {/* Location Label Modal */}
      <Modal
        isOpen={isLocationLabelModalOpen}
        onClose={() => setIsLocationLabelModalOpen(false)}
        title="Generate Location Label"
        size="md"
      >
        <LocationLabel location={location} />
      </Modal>
    </div>
  );
}

