import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from '../../hooks/useDebounce';
import { createSpoolSchema, updateSpoolSchema, type CreateSpoolFormData, type UpdateSpoolFormData } from '../../schemas/spool';
import { 
  Plus, Search, Grid, List, Package, ScanLine, 
  ChevronUp, ChevronDown, ExternalLink, QrCode, Edit, Trash2,
  TableProperties, ArrowUpDown, Columns, Eye, CheckSquare, Square, Move
} from 'lucide-react';
import { spoolsApi, materialsApi, manufacturersApi, filamentTypesApi, locationsApi, settingsApi } from '../../api';
import { SpoolCard } from '../../components/SpoolCard';
import { SpoolLabel } from '../../components/SpoolLabel';
import { QRScanner } from '../../components/QRScanner';
import { Button, Input, Select, Modal, Badge, Pagination } from '../../components/ui';
import type { Spool, SpoolLocation, SpoolType, CreateSpoolDTO, PagedResponse } from '../../types';
import styles from './Spools.module.css';

const locationOptions = [
  { value: '', label: 'All Locations' },
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

type SortField = 'brand' | 'material' | 'type' | 'color' | 'spools' | 'weight' | 'rgb';
type SortDirection = 'asc' | 'desc';

interface SpoolGroupData {
  key: string;
  brand: string;
  brandId: number;
  material: string;
  type: string;
  typeId: number;
  color: string;
  colorId: number;
  hexCode: string;
  productCode?: string;
  spoolCount: number;
  totalWeight: number;
  spools: Spool[];
}

export function Spools() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [colorNumberSearch, setColorNumberSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [materialFilter, setMaterialFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [sortField, setSortField] = useState<SortField>('brand');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedSpoolIds, setSelectedSpoolIds] = useState<Set<number>>(new Set());
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);

  // Debounce search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedColorNumberSearch = useDebounce(colorNumberSearch, 300);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [locationFilter, debouncedColorNumberSearch, debouncedSearchTerm, materialFilter]);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isMultiSpoolLabelModalOpen, setIsMultiSpoolLabelModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedSpool, setSelectedSpool] = useState<Spool | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SpoolGroupData | null>(null);

  // Form state with react-hook-form
  const createForm = useForm<CreateSpoolFormData>({
    resolver: zodResolver(createSpoolSchema) as any,
    defaultValues: {
      location: 'STORAGE',
      spoolType: 'PLASTIC',
    },
  });

  const editForm = useForm<UpdateSpoolFormData>({
    resolver: zodResolver(updateSpoolSchema) as any,
  });

  const [selectedFilamentType, setSelectedFilamentType] = useState<number | null>(null);

  const { data: spoolsData, isLoading } = useQuery({
    queryKey: ['spools', { 
      location: locationFilter || undefined, 
      colorNumber: debouncedColorNumberSearch || undefined,
      search: debouncedSearchTerm || undefined,
      page,
      pageSize
    }],
    queryFn: () => spoolsApi.getAll({ 
      location: locationFilter as SpoolLocation || undefined,
      colorNumber: debouncedColorNumberSearch || undefined,
      search: debouncedSearchTerm || undefined,
      page,
      pageSize
    }),
  });

  // Handle both paginated and non-paginated responses
  const spools: Spool[] = Array.isArray(spoolsData) 
    ? spoolsData 
    : (spoolsData as PagedResponse<Spool>)?.data || [];
  
  const pagination = !Array.isArray(spoolsData) && (spoolsData as PagedResponse<Spool>)
    ? (spoolsData as PagedResponse<Spool>)
    : null;

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
  });

  useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.getAll(),
  });

  const { data: filamentTypes = [] } = useQuery({
    queryKey: ['filament-types'],
    queryFn: () => filamentTypesApi.getAll(),
  });

  const { data: selectedTypeColors = [] } = useQuery({
    queryKey: ['filament-types', selectedFilamentType, 'colors'],
    queryFn: () => filamentTypesApi.getColors(selectedFilamentType!),
    enabled: !!selectedFilamentType,
  });

  // Fetch all locations for the new location system
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll({ activeOnly: true }),
  });

  // Fetch settings for default values
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  const createMutation = useMutation({
    mutationFn: spoolsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSpoolDTO> }) => 
      spoolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsEditModalOpen(false);
      setSelectedSpool(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: spoolsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsDeleteModalOpen(false);
      setSelectedSpool(null);
      setSelectedSpoolIds(new Set());
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => spoolsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setSelectedSpoolIds(new Set());
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ ids, location, storageLocationId, details }: { 
      ids: number[]; 
      location?: SpoolLocation; 
      storageLocationId?: number; 
      details?: string;
    }) => {
      await Promise.all(ids.map(id => 
        spoolsApi.updateLocation(id, location, storageLocationId, details)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setSelectedSpoolIds(new Set());
      setIsBulkMoveModalOpen(false);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, location, storageLocationId, details }: { id: number; location?: SpoolLocation; storageLocationId?: number; details?: string }) =>
      spoolsApi.updateLocation(id, location, storageLocationId, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
      setIsMoveModalOpen(false);
      setSelectedSpool(null);
    },
  });

  const resetForm = () => {
    createForm.reset({ 
      location: 'STORAGE', 
      spoolType: 'PLASTIC',
      initialWeightGrams: settings?.defaultWeightGrams,
      purchaseCurrency: settings?.defaultCurrency,
    });
    setSelectedFilamentType(null);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    // Pre-fill form with settings defaults
    if (settings) {
      createForm.reset({
        location: 'STORAGE',
        spoolType: 'PLASTIC',
        initialWeightGrams: settings.defaultWeightGrams,
        purchaseCurrency: settings.defaultCurrency,
      });
    } else {
      resetForm();
    }
  };

  const handleEdit = (spool: Spool) => {
    setSelectedSpool(spool);
    editForm.reset({
      filamentTypeId: spool.filamentTypeId,
      colorId: spool.colorId,
      manufacturerId: spool.manufacturerId,
      location: spool.location,
      locationDetails: spool.locationDetails,
      initialWeightGrams: spool.initialWeightGrams,
      currentWeightGrams: spool.currentWeightGrams,
      purchasePrice: spool.purchasePrice,
      purchaseCurrency: spool.purchaseCurrency,
      notes: spool.notes,
      colorNumber: spool.colorNumber,
    });
    setSelectedFilamentType(spool.filamentTypeId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsDeleteModalOpen(true);
  };

  // Move form state (simple form, keeping manual state)
  const [moveFormData, setMoveFormData] = useState<{ location?: SpoolLocation; locationDetails?: string }>({});

  const handleMove = (spool: Spool) => {
    setSelectedSpool(spool);
    setMoveFormData({ location: spool.location, locationDetails: spool.locationDetails });
    setIsMoveModalOpen(true);
  };

  const handleGenerateLabel = (spool: Spool) => {
    setSelectedSpool(spool);
    setIsLabelModalOpen(true);
  };

  const handleGenerateGroupLabel = (group: SpoolGroupData) => {
    if (group.spoolCount === 1) {
      // Only one spool, generate label directly
      setSelectedSpool(group.spools[0]);
      setIsLabelModalOpen(true);
    } else {
      // Multiple spools, show info modal
      setSelectedGroup(group);
      setIsMultiSpoolLabelModalOpen(true);
    }
  };

  const toggleSpoolSelection = (spoolId: number) => {
    setSelectedSpoolIds(prev => {
      const next = new Set(prev);
      if (next.has(spoolId)) {
        next.delete(spoolId);
      } else {
        next.add(spoolId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSpoolIds.size === filteredSpools.length) {
      setSelectedSpoolIds(new Set());
    } else {
      setSelectedSpoolIds(new Set(filteredSpools.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedSpoolIds.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedSpoolIds));
    }
  };

  const handleBulkMove = (location?: SpoolLocation, storageLocationId?: number, details?: string) => {
    if (selectedSpoolIds.size > 0) {
      bulkMoveMutation.mutate({ 
        ids: Array.from(selectedSpoolIds), 
        location, 
        storageLocationId, 
        details 
      });
    }
  };

  const handleSubmitCreate = (data: CreateSpoolFormData) => {
    // Get manufacturerId from filament type if not set
    const filamentType = filamentTypes.find(ft => ft.id === data.filamentTypeId);
    const manufacturerId = data.manufacturerId || filamentType?.manufacturerId;
    
    if (!manufacturerId) {
      createForm.setError('manufacturerId', { message: 'Manufacturer is required' });
      return;
    }

    // Convert form data to API DTO format
    const dto: CreateSpoolDTO = {
      filamentTypeId: data.filamentTypeId,
      colorId: data.colorId,
      manufacturerId: manufacturerId,
      spoolType: data.spoolType,
      storageLocationId: data.storageLocationId,
      location: data.location,
      locationDetails: data.locationDetails,
      initialWeightGrams: data.initialWeightGrams,
      currentWeightGrams: data.currentWeightGrams,
      purchaseDate: data.purchaseDate,
      openedDate: data.openedDate,
      purchasePrice: data.purchasePrice,
      purchaseCurrency: data.purchaseCurrency,
      colorNumber: data.colorNumber,
      notes: data.notes,
    };
    createMutation.mutate(dto);
  };

  const handleSubmitEdit = (data: UpdateSpoolFormData) => {
    if (selectedSpool) {
      updateMutation.mutate({ id: selectedSpool.id, data });
    }
  };

  const handleSubmitMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSpool && moveFormData.location) {
      updateLocationMutation.mutate({
        id: selectedSpool.id,
        location: moveFormData.location,
        details: moveFormData.locationDetails,
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleGroupExpansion = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredSpools = spools.filter(spool => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      spool.colorName.toLowerCase().includes(searchLower) ||
      spool.materialName.toLowerCase().includes(searchLower) ||
      spool.filamentTypeName.toLowerCase().includes(searchLower) ||
      spool.manufacturerName.toLowerCase().includes(searchLower) ||
      spool.uid.toLowerCase().includes(searchLower) ||
      (spool.colorNumber && spool.colorNumber.toLowerCase().includes(searchLower)) ||
      (searchTerm.startsWith('#') && spool.colorHexCode.toLowerCase().includes(searchLower));
    
    const matchesMaterial = materialFilter === '' || 
      spool.materialName === materialFilter;

    return matchesSearch && matchesMaterial;
  });

  // Group spools by manufacturer + filament type + color
  const groupedData: SpoolGroupData[] = useMemo(() => {
    const groups: Record<string, SpoolGroupData> = {};
    
    filteredSpools.forEach(spool => {
      const key = `${spool.manufacturerId}-${spool.filamentTypeId}-${spool.colorId}`;
      if (!groups[key]) {
        // Parse type from filamentTypeName (e.g., "PLA Basic" -> "Basic")
        const typeParts = spool.filamentTypeName.split(' ');
        const typeShort = typeParts.length > 1 ? typeParts.slice(1).join(' ') : typeParts[0];
        
        groups[key] = {
          key,
          brand: spool.manufacturerName,
          brandId: spool.manufacturerId,
          material: spool.materialName,
          type: typeShort,
          typeId: spool.filamentTypeId,
          color: spool.colorName,
          colorId: spool.colorId,
          hexCode: spool.colorHexCode,
          productCode: spool.colorProductCode,
          spoolCount: 0,
          totalWeight: 0,
          spools: [],
        };
      }
      groups[key].spoolCount += 1;
      groups[key].totalWeight += spool.currentWeightGrams ?? spool.initialWeightGrams ?? 0;
      groups[key].spools.push(spool);
    });
    
    return Object.values(groups);
  }, [filteredSpools]);

  // Sort the grouped data
  const sortedGroups = useMemo(() => {
    return [...groupedData].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'brand':
          comparison = a.brand.localeCompare(b.brand);
          break;
        case 'material':
          comparison = a.material.localeCompare(b.material);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'color':
          comparison = a.color.localeCompare(b.color);
          break;
        case 'spools':
          comparison = a.spoolCount - b.spoolCount;
          break;
        case 'weight':
          comparison = a.totalWeight - b.totalWeight;
          break;
        case 'rgb':
          comparison = a.hexCode.localeCompare(b.hexCode);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [groupedData, sortField, sortDirection]);

  const getFilamentTypeOptions = () => {
    return filamentTypes.map(ft => ({
      value: ft.id,
      label: `${ft.name} (${ft.materialName} - ${ft.manufacturerName})`,
    }));
  };

  const getColorOptions = () => {
    return selectedTypeColors.map(c => ({
      value: c.id,
      label: c.name,
    }));
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th onClick={() => handleSort(field)} className={styles.sortableHeader}>
      <span className={styles.headerContent}>
        {children}
        <span className={styles.sortIcon}>
          {sortField === field ? (
            sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          ) : (
            <ArrowUpDown size={14} className={styles.sortInactive} />
          )}
        </span>
      </span>
    </th>
  );

  const totalSpools = filteredSpools.length;
  const totalWeight = filteredSpools.reduce((sum, s) => sum + (s.currentWeightGrams ?? 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Spools</h1>
          <p className={styles.subtitle}>
            This is the place for you to keep a list of spools that you own and/or want to track.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setIsScannerOpen(true)}>
            <ScanLine size={18} />
            Scan
          </Button>
          <Button onClick={handleOpenCreateModal}>
            <Plus size={18} />
            Add Spool
          </Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search... (use #hex for color matching)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

          <div className={styles.toolbarRight}>
          <Input
            placeholder="Search by color number..."
            value={colorNumberSearch}
            onChange={(e) => setColorNumberSearch(e.target.value)}
            style={{ width: '180px' }}
          />
          
          <Select
            options={[
              { value: '', label: 'All Materials' },
              ...materials.map(m => ({ value: m.name, label: m.name })),
            ]}
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
          />
          
          <Select
            options={locationOptions}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
            >
              <TableProperties size={18} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <List size={18} />
            </button>
          </div>

          <Button variant="secondary" size="sm">
            <Columns size={16} />
            Columns
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading spools...</p>
        </div>
      ) : filteredSpools.length === 0 ? (
        <div className={styles.empty}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No spools found</h3>
          <p>
            {searchTerm || locationFilter || materialFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first spool'}
          </p>
          {!searchTerm && !locationFilter && !materialFilter && (
            <Button onClick={handleOpenCreateModal}>
              <Plus size={18} />
              Add Spool
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className={styles.tableWrapper}>
          {selectedSpoolIds.size > 0 && (
            <div className={styles.bulkActionsBar}>
              <span className={styles.bulkActionsText}>
                {selectedSpoolIds.size} spool{selectedSpoolIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className={styles.bulkActionsButtons}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsBulkMoveModalOpen(true)}
                >
                  <Move size={16} />
                  Move ({selectedSpoolIds.size})
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleBulkDelete}
                  isLoading={bulkDeleteMutation.isPending}
                >
                  <Trash2 size={16} />
                  Delete ({selectedSpoolIds.size})
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedSpoolIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <button
                    className={styles.checkboxButton}
                    onClick={toggleSelectAll}
                    title={selectedSpoolIds.size === filteredSpools.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedSpoolIds.size === filteredSpools.length && filteredSpools.length > 0 ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <SortHeader field="brand">BRAND</SortHeader>
                <SortHeader field="material">MATERIAL</SortHeader>
                <SortHeader field="type">TYPE</SortHeader>
                <SortHeader field="color">COLOR</SortHeader>
                <th>RGB</th>
                <SortHeader field="rgb">RGB #</SortHeader>
                <SortHeader field="spools"># SPOOLS</SortHeader>
                <SortHeader field="weight">TOTAL (G)</SortHeader>
                <th>WEBSITE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => {
                const allGroupSpoolsSelected = group.spools.every(s => selectedSpoolIds.has(s.id));
                const someGroupSpoolsSelected = group.spools.some(s => selectedSpoolIds.has(s.id));
                
                return (
                <>
                  <tr key={group.key} className={styles.groupRow}>
                    <td>
                      <button
                        className={styles.checkboxButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allGroupSpoolsSelected) {
                            // Deselect all in group
                            setSelectedSpoolIds(prev => {
                              const next = new Set(prev);
                              group.spools.forEach(s => next.delete(s.id));
                              return next;
                            });
                          } else {
                            // Select all in group
                            setSelectedSpoolIds(prev => {
                              const next = new Set(prev);
                              group.spools.forEach(s => next.add(s.id));
                              return next;
                            });
                          }
                        }}
                        title={allGroupSpoolsSelected ? 'Deselect group' : 'Select group'}
                      >
                        {allGroupSpoolsSelected ? (
                          <CheckSquare size={18} />
                        ) : someGroupSpoolsSelected ? (
                          <CheckSquare size={18} style={{ opacity: 0.5 }} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td>{group.brand}</td>
                    <td>{group.material}</td>
                    <td>{group.type}</td>
                    <td>
                      <button 
                        className={styles.colorLink}
                        onClick={() => navigate(`/spools/color?manufacturer=${group.brandId}&type=${group.typeId}&color=${group.colorId}`)}
                      >
                        {group.color}
                        {group.productCode && (
                          <span className={styles.productCode}> ({group.productCode})</span>
                        )}
                        {group.spools[0]?.colorNumber && (
                          <Badge variant="info" size="sm" style={{ marginLeft: '8px' }}>
                            #{group.spools[0].colorNumber}
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td>
                      <div 
                        className={styles.colorSwatch} 
                        style={{ backgroundColor: group.hexCode }}
                        title={group.hexCode}
                      />
                    </td>
                    <td className={styles.hexCode}>{group.hexCode}</td>
                    <td className={styles.spoolCount}>{group.spoolCount}</td>
                    <td className={styles.weight}>{group.totalWeight.toFixed(0)}</td>
                    <td>
                      {group.productCode && (
                        <a 
                          href={`https://store.bambulab.com/products/${group.productCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.websiteLink}
                        >
                          Link <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsColumn}>
                        <div className={styles.actions}>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => { e.stopPropagation(); handleGenerateGroupLabel(group); }}
                            title="Generate spool label"
                          >
                            <QrCode size={16} />
                          </button>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => { e.stopPropagation(); navigate(`/spools/color?manufacturer=${group.brandId}&type=${group.typeId}&color=${group.colorId}`); }}
                            title="View color details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={(e) => { e.stopPropagation(); handleDelete(group.spools[0]); }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <button 
                          className={styles.expandTextButton}
                          onClick={() => toggleGroupExpansion(group.key)}
                        >
                          {expandedGroups.has(group.key) ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedGroups.has(group.key) && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={11}>
                        <div className={styles.expandedContent}>
                          <div className={styles.spoolsList}>
                            <h4>Individual Spools ({group.spoolCount})</h4>
                            <table className={styles.nestedTable}>
                              <thead>
                                <tr>
                                  <th style={{ width: '40px' }}></th>
                                  <th>LOCATION</th>
                                  <th>REMAINING (G)</th>
                                  <th>SPOOL ID</th>
                                  <th>LAST UPDATED</th>
                                  <th>NOTES</th>
                                  <th>ACTIONS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.spools.map(spool => (
                                  <tr key={spool.id}>
                                    <td>
                                      <button
                                        className={styles.checkboxButton}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSpoolSelection(spool.id);
                                        }}
                                        title={selectedSpoolIds.has(spool.id) ? 'Deselect' : 'Select'}
                                      >
                                        {selectedSpoolIds.has(spool.id) ? (
                                          <CheckSquare size={16} />
                                        ) : (
                                          <Square size={16} />
                                        )}
                                      </button>
                                    </td>
                                    <td>{spool.location}{spool.locationDetails ? `: ${spool.locationDetails}` : ''}</td>
                                    <td>{spool.currentWeightGrams?.toFixed(0) ?? '-'}g</td>
                                    <td className={styles.spoolId}>{spool.uid}</td>
                                    <td>{spool.updatedAt ? new Date(spool.updatedAt).toLocaleDateString() : '-'}</td>
                                    <td>{spool.notes || '-'}</td>
                                    <td>
                                      <div className={styles.actions}>
                                        <button 
                                          className={styles.actionButton}
                                          onClick={() => handleGenerateLabel(spool)}
                                          title="Generate QR Label"
                                        >
                                          <QrCode size={16} />
                                        </button>
                                        <button 
                                          className={styles.actionButton}
                                          onClick={() => handleEdit(spool)}
                                          title="Edit"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button 
                                          className={styles.actionButton}
                                          onClick={() => handleDelete(spool)}
                                          title="Delete"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
                );
              })}
            </tbody>
          </table>
          
          <div className={styles.tableFooter}>
            <span>{sortedGroups.length} color{sortedGroups.length !== 1 ? 's' : ''}</span>
            <span>{totalSpools} spool{totalSpools !== 1 ? 's' : ''}</span>
            <span>{(totalWeight / 1000).toFixed(2)} kg total</span>
          </div>
        </div>
      ) : (
        <div className={`${styles.grid} ${viewMode === 'list' ? styles.listView : ''}`}>
          {filteredSpools.map((spool) => (
            <SpoolCard
              key={spool.id}
              spool={spool}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateLocation={handleMove}
              onGenerateLabel={handleGenerateLabel}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0); // Reset to first page when changing page size
          }}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title="Add New Spool"
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(handleSubmitCreate)} className={styles.form}>
          <Controller
            name="filamentTypeId"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <div>
                <Select
                  label="Filament Type"
                  options={getFilamentTypeOptions()}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => {
                    const typeId = Number(e.target.value);
                    setSelectedFilamentType(typeId);
                    const type = filamentTypes.find(ft => ft.id === typeId);
                    field.onChange(typeId);
                    createForm.setValue('manufacturerId', type?.manufacturerId ?? undefined);
                    createForm.setValue('colorId', undefined as any);
                  }}
                  placeholder="Select filament type"
                />
                {fieldState.error && (
                  <span className={styles.errorText}>{fieldState.error.message}</span>
                )}
              </div>
            )}
          />

          {selectedFilamentType && (
            <Controller
              name="colorId"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div>
                  <Select
                    label="Color"
                    options={getColorOptions()}
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="Select color"
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          )}

          <Controller
            name="spoolType"
            control={createForm.control}
            render={({ field }) => (
              <Select
                label="Spool Type"
                options={spoolTypeOptions}
                value={field.value || 'PLASTIC'}
                onChange={(e) => field.onChange(e.target.value as SpoolType)}
              />
            )}
          />

          <Controller
            name="storageLocationId"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <div>
                <Select
                  label="Storage Location"
                  options={[
                    { value: '', label: 'Select a location...' },
                    ...locations.map(loc => ({ value: loc.id, label: loc.fullPath || loc.name })),
                  ]}
                  value={field.value ? String(field.value) : ''}
                  onChange={(e) => {
                    field.onChange(e.target.value ? Number(e.target.value) : undefined);
                    createForm.setValue('location', undefined);
                  }}
                />
                {fieldState.error && (
                  <span className={styles.errorText}>{fieldState.error.message}</span>
                )}
              </div>
            )}
          />

          <Controller
            name="location"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <div>
                <Select
                  label="Legacy Location (if not using Storage Location)"
                  options={locationOptions.slice(1)}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value as SpoolLocation);
                    createForm.setValue('storageLocationId', undefined);
                  }}
                />
                {fieldState.error && (
                  <span className={styles.errorText}>{fieldState.error.message}</span>
                )}
              </div>
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="initialWeightGrams"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Initial Weight (g)"
                    type="number"
                    placeholder="1000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="currentWeightGrams"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Current Weight (g)"
                    type="number"
                    placeholder="1000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          </div>

          <div className={styles.formRow}>
            <Controller
              name="purchasePrice"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Purchase Price"
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="purchaseCurrency"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Currency"
                    placeholder="USD"
                    {...field}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          </div>

          <Controller
            name="colorNumber"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Color Number"
                placeholder="e.g., 5 (for customer ordering)"
                {...field}
                helperText="Number from your color board for easy customer ordering"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="notes"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Notes"
                placeholder="Any notes about this spool..."
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Spool
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedSpool(null); editForm.reset(); }}
        title="Edit Spool"
        size="md"
      >
        <form onSubmit={editForm.handleSubmit(handleSubmitEdit)} className={styles.form}>
          <div className={styles.formRow}>
            <Controller
              name="initialWeightGrams"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Initial Weight (g)"
                    type="number"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="currentWeightGrams"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Current Weight (g)"
                    type="number"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          </div>

          <Controller
            name="location"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <div>
                <Select
                  label="Location"
                  options={locationOptions.slice(1)}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value as SpoolLocation)}
                />
                {fieldState.error && (
                  <span className={styles.errorText}>{fieldState.error.message}</span>
                )}
              </div>
            )}
          />

          <Controller
            name="locationDetails"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Location Details"
                placeholder="e.g., Slot 1, Rack A-3"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="colorNumber"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Color Number"
                placeholder="e.g., 5 (for customer ordering)"
                {...field}
                helperText="Number from your color board for easy customer ordering"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="notes"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Notes"
                placeholder="Any notes about this spool..."
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedSpool(null); editForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
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
              <div 
                className={styles.deleteSpoolColor}
                style={{ backgroundColor: selectedSpool.colorHexCode }}
              />
              <div>
                <strong>{selectedSpool.colorName}</strong>
                <span>{selectedSpool.materialName} • {selectedSpool.filamentTypeName}</span>
              </div>
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

      {/* Move Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setSelectedSpool(null); }}
        title="Move Spool"
        size="sm"
      >
        <form onSubmit={handleSubmitMove} className={styles.form}>
          <Select
            label="New Location"
            options={locationOptions.slice(1)}
            value={moveFormData.location || ''}
            onChange={(e) => setMoveFormData({ ...moveFormData, location: e.target.value as SpoolLocation })}
          />

          <Input
            label="Location Details"
            placeholder="e.g., Slot 1, Rack A-3"
            value={moveFormData.locationDetails || ''}
            onChange={(e) => setMoveFormData({ ...moveFormData, locationDetails: e.target.value })}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsMoveModalOpen(false); setSelectedSpool(null); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateLocationMutation.isPending}>
              Move Spool
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Move Modal */}
      <Modal
        isOpen={isBulkMoveModalOpen}
        onClose={() => { setIsBulkMoveModalOpen(false); }}
        title={`Move ${selectedSpoolIds.size} Spool${selectedSpoolIds.size !== 1 ? 's' : ''}`}
        size="sm"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleBulkMove(moveFormData.location, undefined, moveFormData.locationDetails);
        }} className={styles.form}>
          <Select
            label="New Location"
            options={locationOptions.slice(1)}
            value={moveFormData.location || ''}
            onChange={(e) => setMoveFormData({ ...moveFormData, location: e.target.value as SpoolLocation })}
          />

          <Input
            label="Location Details"
            placeholder="e.g., Slot 1, Rack A-3"
            value={moveFormData.locationDetails || ''}
            onChange={(e) => setMoveFormData({ ...moveFormData, locationDetails: e.target.value })}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsBulkMoveModalOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={bulkMoveMutation.isPending}>
              Move {selectedSpoolIds.size} Spool{selectedSpoolIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
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

      {/* Multi-Spool Label Info Modal */}
      <Modal
        isOpen={isMultiSpoolLabelModalOpen}
        onClose={() => { setIsMultiSpoolLabelModalOpen(false); setSelectedGroup(null); }}
        title="Spool Barcode"
        size="sm"
      >
        <div className={styles.multiSpoolInfo}>
          <p>
            You have more than one spool of this type. Go to the details page to find the label for each spool.
          </p>
          <div className={styles.formActions}>
            <Button
              onClick={() => {
                setIsMultiSpoolLabelModalOpen(false);
                if (selectedGroup) {
                  navigate(`/spools/color?manufacturer=${selectedGroup.brandId}&type=${selectedGroup.typeId}&color=${selectedGroup.colorId}`);
                }
              }}
            >
              Go to Details
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setIsMultiSpoolLabelModalOpen(false); setSelectedGroup(null); }}
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Scanner */}
      {isScannerOpen && (
        <QRScanner
          onScan={(url) => {
            setIsScannerOpen(false);
            const match = url.match(/\/spools\/([^/]+)$/);
            if (match) {
              navigate(`/spools/${match[1]}`);
            }
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}
