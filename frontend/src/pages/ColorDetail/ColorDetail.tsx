import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Weight, Package, QrCode, Edit, Trash2,
  Thermometer, ExternalLink, Circle, Plus, Search
} from 'lucide-react';
import { spoolsApi, filamentTypesApi } from '../../api';
import { SpoolLabel } from '../../components/SpoolLabel';
import { Button, Badge, Modal, Select, Input } from '../../components/ui';
import type { Spool, SpoolLocation, CreateSpoolDTO, PagedResponse } from '../../types';
import styles from './ColorDetail.module.css';

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

const spoolTypeLabels: Record<string, string> = {
  PLASTIC: 'Plastic Spool',
  REFILL: 'Refill',
  CARDBOARD: 'Cardboard',
};

const locationOptions = [
  { value: 'AMS', label: 'AMS' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'RACK', label: 'Rack' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'EMPTY', label: 'Empty' },
];

const spoolTypeOptions = [
  { value: 'PLASTIC', label: 'Plastic Spool' },
  { value: 'REFILL', label: 'Refill' },
  { value: 'CARDBOARD', label: 'Cardboard' },
];

export function ColorDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get params from URL query string
  const manufacturerId = searchParams.get('manufacturer');
  const typeId = searchParams.get('type');
  const colorId = searchParams.get('color');

  // Modal states
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSpool, setSelectedSpool] = useState<Spool | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSpoolDTO>>({});
  const [colorNumberSearch, setColorNumberSearch] = useState('');

  const { data: allSpoolsData, isLoading } = useQuery({
    queryKey: ['spools'],
    queryFn: () => spoolsApi.getAll(),
  });

  // Handle both paginated and non-paginated responses
  const allSpools: Spool[] = Array.isArray(allSpoolsData)
    ? allSpoolsData
    : (allSpoolsData as PagedResponse<Spool>)?.data || [];

  const { data: filamentType } = useQuery({
    queryKey: ['filament-types', typeId],
    queryFn: () => filamentTypesApi.getById(Number(typeId)),
    enabled: !!typeId,
  });

  // Filter spools by manufacturer, type, and color
  const filteredSpools = useMemo(() => {
    return allSpools.filter((s: Spool) => 
      s.manufacturerId === Number(manufacturerId) &&
      s.filamentTypeId === Number(typeId) &&
      s.colorId === Number(colorId)
    );
  }, [allSpools, manufacturerId, typeId, colorId]);

  // Filter by color number search
  const spools = useMemo(() => {
    if (!colorNumberSearch.trim()) {
      return filteredSpools;
    }
    const searchLower = colorNumberSearch.toLowerCase().trim();
    return filteredSpools.filter((s: Spool) => 
      s.colorNumber?.toLowerCase().includes(searchLower)
    );
  }, [filteredSpools, colorNumberSearch]);

  // Get representative spool for color info
  const representativeSpool = spools[0];

  // Get color info from filament type
  const colorInfo = useMemo(() => {
    if (!filamentType || !colorId) return null;
    return filamentType.colors?.find(c => c.id === Number(colorId));
  }, [filamentType, colorId]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalWeight = spools.reduce((sum: number, s: Spool) => sum + (s.currentWeightGrams ?? 0), 0);
    const totalInitialWeight = spools.reduce((sum: number, s: Spool) => sum + (s.initialWeightGrams ?? 0), 0);
    const avgRemaining = totalInitialWeight > 0 ? (totalWeight / totalInitialWeight) * 100 : 0;
    
    const locationCounts = spools.reduce((acc: Record<string, number>, s: Spool) => {
      const locKey = s.storageLocationName || s.location || 'Unknown';
      acc[locKey] = (acc[locKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalWeight, avgRemaining, locationCounts, spoolCount: spools.length };
  }, [spools]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSpoolDTO> }) =>
      spoolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsEditModalOpen(false);
      setSelectedSpool(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: spoolsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsDeleteModalOpen(false);
      setSelectedSpool(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: spoolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsAddModalOpen(false);
      setFormData({});
    },
  });

  const handleEdit = (spool: Spool) => {
    setSelectedSpool(spool);
    setFormData({
      location: spool.location,
      locationDetails: spool.locationDetails,
      spoolType: spool.spoolType,
      initialWeightGrams: spool.initialWeightGrams,
      currentWeightGrams: spool.currentWeightGrams,
      purchasePrice: spool.purchasePrice,
      purchaseCurrency: spool.purchaseCurrency,
      notes: spool.notes,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsDeleteModalOpen(true);
  };

  const handleLabel = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsLabelModalOpen(true);
  };

  const handleAddSpool = () => {
    setFormData({
      filamentTypeId: Number(typeId),
      colorId: Number(colorId),
      manufacturerId: Number(manufacturerId),
      location: 'STORAGE',
      spoolType: 'PLASTIC',
      initialWeightGrams: filamentType?.spoolWeightGrams ?? 1000,
      currentWeightGrams: filamentType?.spoolWeightGrams ?? 1000,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSpool) {
      updateMutation.mutate({ id: selectedSpool.id, data: formData });
    }
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.filamentTypeId && formData.colorId && formData.manufacturerId) {
      createMutation.mutate(formData as CreateSpoolDTO);
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent > 50) return 'var(--color-success)';
    if (percent > 20) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

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

  if (!representativeSpool || !colorInfo) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <QrCode size={64} className={styles.notFoundIcon} />
          <h2>Color Not Found</h2>
          <p>The specified color could not be found.</p>
          <Button onClick={() => navigate('/spools')}>
            <ArrowLeft size={18} />
            Back to Spools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/spools')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={styles.title}>{colorInfo.name}</h1>
          <p className={styles.subtitle}>
            {representativeSpool.manufacturerName} • {representativeSpool.materialName} {representativeSpool.filamentTypeName.replace(representativeSpool.materialName, '').trim()}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleAddSpool}>
            <Plus size={18} />
            Add Spool
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Color Card */}
        <div className={styles.colorCard}>
          <div 
            className={styles.colorSwatch}
            style={{ backgroundColor: colorInfo.hexCode }}
          >
            {(colorInfo.hexCode.toUpperCase() === '#FFFFFF') && (
              <span className={styles.whiteColorBorder} />
            )}
          </div>
          <div className={styles.colorInfo}>
            <div className={styles.colorHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2>{colorInfo.name}</h2>
                {representativeSpool.colorNumber && (
                  <Badge variant="info">#{representativeSpool.colorNumber}</Badge>
                )}
              </div>
              <div className={styles.colorMeta}>
                <span className={styles.hexCode}>{colorInfo.hexCode.toUpperCase()}</span>
                {colorInfo.productCode && (
                  <span className={styles.productCode}>({colorInfo.productCode})</span>
                )}
              </div>
            </div>
            <div className={styles.colorTags}>
              <Badge variant="default">{representativeSpool.materialName}</Badge>
              <Badge variant="info">{representativeSpool.filamentTypeName.replace(representativeSpool.materialName, '').trim() || 'Standard'}</Badge>
              <Badge variant="success">{stats.spoolCount} spool{stats.spoolCount !== 1 ? 's' : ''}</Badge>
            </div>
            {colorInfo.productCode && (
              <a 
                href={`https://store.bambulab.com/products/${colorInfo.productCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeLink}
              >
                View on Bambu Lab Store <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Package size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.spoolCount}</span>
              <span className={styles.statLabel}>Total Spools</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Weight size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{(stats.totalWeight / 1000).toFixed(2)} kg</span>
              <span className={styles.statLabel}>Total Weight</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Circle size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.avgRemaining.toFixed(0)}%</span>
              <span className={styles.statLabel}>Avg. Remaining</span>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        {filamentType && (
          <div className={styles.technicalCard}>
            <h3>Technical Details</h3>
            <div className={styles.technicalGrid}>
              <div className={styles.technicalItem}>
                <Thermometer size={16} />
                <span className={styles.technicalLabel}>Nozzle Temp</span>
                <span className={styles.technicalValue}>
                  {filamentType.minNozzleTemp && filamentType.maxNozzleTemp 
                    ? `${filamentType.minNozzleTemp}°C - ${filamentType.maxNozzleTemp}°C`
                    : 'Not specified'}
                </span>
              </div>
              <div className={styles.technicalItem}>
                <Thermometer size={16} />
                <span className={styles.technicalLabel}>Bed Temp</span>
                <span className={styles.technicalValue}>
                  {filamentType.minBedTemp && filamentType.maxBedTemp 
                    ? `${filamentType.minBedTemp}°C - ${filamentType.maxBedTemp}°C`
                    : 'Not specified'}
                </span>
              </div>
              <div className={styles.technicalItem}>
                <Circle size={16} />
                <span className={styles.technicalLabel}>Diameter</span>
                <span className={styles.technicalValue}>
                  {filamentType.diameterMm ? `${filamentType.diameterMm}mm` : '1.75mm'}
                </span>
              </div>
              <div className={styles.technicalItem}>
                <Weight size={16} />
                <span className={styles.technicalLabel}>Density</span>
                <span className={styles.technicalValue}>
                  {filamentType.densityGPerCm3 ? `${filamentType.densityGPerCm3} g/cm³` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Spools List */}
        <div className={styles.spoolsSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3>Individual Spools ({spools.length}{colorNumberSearch ? ` of ${filteredSpools.length}` : ''})</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1', maxWidth: '300px', minWidth: '200px' }}>
              <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
              <Input
                placeholder="Search by color number..."
                value={colorNumberSearch}
                onChange={(e) => setColorNumberSearch(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className={styles.spoolsList}>
            {spools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                {colorNumberSearch ? (
                  <>
                    <p>No spools found with color number "{colorNumberSearch}"</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setColorNumberSearch('')}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <p>No spools found for this color</p>
                )}
              </div>
            ) : (
              spools.map((spool: Spool) => {
              const remaining = spool.remainingPercentage ?? 
                (spool.initialWeightGrams && spool.currentWeightGrams 
                  ? (spool.currentWeightGrams / spool.initialWeightGrams) * 100 
                  : null);

              return (
                <div key={spool.id} className={styles.spoolItem}>
                  <div className={styles.spoolMeta}>
                    <div className={styles.spoolLocation}>
                      {spool.storageLocationId ? (
                        <Badge variant="default" size="sm">
                          <MapPin size={12} />
                          {spool.storageLocationName || 'Unknown'}
                        </Badge>
                      ) : spool.location ? (
                        <Badge variant={locationVariants[spool.location] || 'default'} size="sm">
                          <MapPin size={12} />
                          {locationLabels[spool.location] || spool.location}
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <MapPin size={12} />
                          No location
                        </Badge>
                      )}
                      {spool.locationDetails && (
                        <span className={styles.locationDetails}>{spool.locationDetails}</span>
                      )}
                    </div>
                    {spool.spoolType && (
                      <span className={styles.spoolType}>{spoolTypeLabels[spool.spoolType]}</span>
                    )}
                  </div>
                  
                  {remaining !== null && (
                    <div className={styles.spoolProgress}>
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
                        {spool.currentWeightGrams?.toFixed(0)}g / {spool.initialWeightGrams?.toFixed(0)}g ({remaining.toFixed(0)}%)
                      </span>
                    </div>
                  )}

                  <div className={styles.spoolDetails}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={styles.spoolId}>{spool.uid.slice(0, 8)}...</span>
                      {spool.colorNumber && (
                        <Badge variant="info" size="sm">#{spool.colorNumber}</Badge>
                      )}
                    </div>
                    {spool.notes && <span className={styles.spoolNotes}>{spool.notes}</span>}
                  </div>

                  <div className={styles.spoolActions}>
                    <button onClick={() => handleLabel(spool)} title="Print Label">
                      <QrCode size={16} />
                    </button>
                    <button onClick={() => handleEdit(spool)} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(spool)} title="Delete" className={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedSpool(null); }}
        title="Edit Spool"
        size="md"
      >
        <form onSubmit={handleSubmitEdit} className={styles.form}>
          <div className={styles.formRow}>
            <Select
              label="Spool Type"
              options={spoolTypeOptions}
              value={formData.spoolType || 'PLASTIC'}
              onChange={(e) => setFormData({ ...formData, spoolType: e.target.value as any })}
            />
            <Select
              label="Location"
              options={locationOptions}
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as SpoolLocation })}
            />
          </div>

          <Input
            label="Location Details"
            placeholder="e.g., Slot 1, Rack A-3"
            value={formData.locationDetails || ''}
            onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
          />

          <div className={styles.formRow}>
            <Input
              label="Initial Weight (g)"
              type="number"
              value={formData.initialWeightGrams || ''}
              onChange={(e) => setFormData({ ...formData, initialWeightGrams: Number(e.target.value) })}
            />
            <Input
              label="Current Weight (g)"
              type="number"
              value={formData.currentWeightGrams || ''}
              onChange={(e) => setFormData({ ...formData, currentWeightGrams: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              value={formData.purchasePrice || ''}
              onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
            />
            <Input
              label="Currency"
              placeholder="USD"
              value={formData.purchaseCurrency || ''}
              onChange={(e) => setFormData({ ...formData, purchaseCurrency: e.target.value })}
            />
          </div>

          <Input
            label="Color Number"
            placeholder="e.g., 5 (for customer ordering)"
            value={formData.colorNumber || ''}
            onChange={(e) => setFormData({ ...formData, colorNumber: e.target.value })}
            helperText="Number from your color board for easy customer ordering"
          />

          <Input
            label="Notes"
            placeholder="Any notes about this spool..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedSpool(null); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Spool Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setFormData({}); }}
        title="Add New Spool"
        size="md"
      >
        <form onSubmit={handleSubmitAdd} className={styles.form}>
          <div className={styles.colorPreview}>
            <div 
              className={styles.previewSwatch}
              style={{ backgroundColor: colorInfo.hexCode }}
            />
            <div>
              <strong>{colorInfo.name}</strong>
              <span>{representativeSpool.materialName} {representativeSpool.filamentTypeName.replace(representativeSpool.materialName, '').trim()}</span>
            </div>
          </div>

          <div className={styles.formRow}>
            <Select
              label="Spool Type"
              options={spoolTypeOptions}
              value={formData.spoolType || 'PLASTIC'}
              onChange={(e) => setFormData({ ...formData, spoolType: e.target.value as any })}
            />
            <Select
              label="Location"
              options={locationOptions}
              value={formData.location || 'STORAGE'}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as SpoolLocation })}
            />
          </div>

          <Input
            label="Location Details"
            placeholder="e.g., Slot 1, Rack A-3"
            value={formData.locationDetails || ''}
            onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
          />

          <div className={styles.formRow}>
            <Input
              label="Initial Weight (g)"
              type="number"
              value={formData.initialWeightGrams || ''}
              onChange={(e) => setFormData({ ...formData, initialWeightGrams: Number(e.target.value) })}
            />
            <Input
              label="Current Weight (g)"
              type="number"
              value={formData.currentWeightGrams || ''}
              onChange={(e) => setFormData({ ...formData, currentWeightGrams: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              value={formData.purchasePrice || ''}
              onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
            />
            <Input
              label="Currency"
              placeholder="USD"
              value={formData.purchaseCurrency || ''}
              onChange={(e) => setFormData({ ...formData, purchaseCurrency: e.target.value })}
            />
          </div>

          <Input
            label="Color Number"
            placeholder="e.g., 5 (for customer ordering)"
            value={formData.colorNumber || ''}
            onChange={(e) => setFormData({ ...formData, colorNumber: e.target.value })}
            helperText="Number from your color board for easy customer ordering"
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsAddModalOpen(false); setFormData({}); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Spool
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedSpool(null); }}
        title="Delete Spool"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete this spool?</p>
          {selectedSpool && (
            <div className={styles.deleteSpoolInfo}>
              {selectedSpool.storageLocationId ? (
                <Badge variant="default">
                  {selectedSpool.storageLocationName || 'Unknown'}
                </Badge>
              ) : selectedSpool.location ? (
                <Badge variant={locationVariants[selectedSpool.location] || 'default'}>
                  {locationLabels[selectedSpool.location] || selectedSpool.location}
                </Badge>
              ) : (
                <Badge variant="default">No location</Badge>
              )}
              <span>{selectedSpool.currentWeightGrams?.toFixed(0)}g remaining</span>
            </div>
          )}
          <p className={styles.deleteWarning}>This action cannot be undone.</p>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedSpool(null); }}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="danger" 
              isLoading={deleteMutation.isPending}
              onClick={() => selectedSpool && deleteMutation.mutate(selectedSpool.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Label Modal */}
      <Modal
        isOpen={isLabelModalOpen}
        onClose={() => { setIsLabelModalOpen(false); setSelectedSpool(null); }}
        title="Generate Label"
        size="md"
      >
        {selectedSpool && (
          <SpoolLabel spool={selectedSpool} />
        )}
      </Modal>
    </div>
  );
}

