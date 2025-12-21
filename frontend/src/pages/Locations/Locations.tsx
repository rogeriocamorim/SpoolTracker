import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, MapPin, Package, Edit, Trash2, 
  ChevronRight, ChevronDown, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import { locationsApi } from '../../api';
import { Button, Input, Select, Modal } from '../../components/ui';
import { createLocationSchema, updateLocationSchema, type CreateLocationFormData, type UpdateLocationFormData } from '../../schemas/location';
import type { Location } from '../../types';
import styles from './Locations.module.css';

const locationTypeOptions = [
  { value: '', label: 'Select type...' },
  { value: 'AMS', label: 'AMS' },
  { value: 'AMS_2_PRO', label: 'AMS 2 Pro' },
  { value: 'AMS_LITTLE', label: 'AMS Little' },
  { value: 'PRINTER_SPOOL', label: 'Printer Spool' },
  { value: 'AMS_HT', label: 'AMS HT' },
  { value: 'RACK', label: 'Rack' },
  { value: 'STORAGE', label: 'Storage Box' },
  { value: 'SHELF', label: 'Shelf' },
  { value: 'DRAWER', label: 'Drawer' },
  { value: 'OTHER', label: 'Other' },
];

// Get capacity based on location type
const getCapacityForType = (locationType: string | undefined): number | undefined => {
  if (!locationType) return undefined;
  
  // AMS types: 4 spots
  if (locationType === 'AMS' || locationType === 'AMS_2_PRO' || locationType === 'AMS_LITTLE') {
    return 4;
  }
  
  // Single spot types
  if (locationType === 'PRINTER_SPOOL' || locationType === 'AMS_HT') {
    return 1;
  }
  
  // Other types: unlimited (undefined)
  return undefined;
};

// Check if capacity should be auto-managed (read-only)
const isCapacityAutoManaged = (locationType: string | undefined): boolean => {
  if (!locationType) return false;
  return locationType === 'AMS' || 
         locationType === 'AMS_2_PRO' || 
         locationType === 'AMS_LITTLE' || 
         locationType === 'PRINTER_SPOOL' || 
         locationType === 'AMS_HT';
};

const colorOptions = [
  { value: '', label: 'No color' },
  { value: '#00AE42', label: 'Green' },
  { value: '#0056B8', label: 'Blue' },
  { value: '#FF6A13', label: 'Orange' },
  { value: '#9D2235', label: 'Red' },
  { value: '#5E43B7', label: 'Purple' },
  { value: '#FEC600', label: 'Yellow' },
  { value: '#545454', label: 'Gray' },
];

export function Locations() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set());
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Form state with react-hook-form
  const createForm = useForm<CreateLocationFormData>({
    resolver: zodResolver(createLocationSchema) as any,
    defaultValues: {
      isActive: true,
      sortOrder: 0,
    },
  });

  const editForm = useForm<UpdateLocationFormData>({
    resolver: zodResolver(updateLocationSchema) as any,
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll({ activeOnly: false }),
  });

  const { data: locationTree = [] } = useQuery({
    queryKey: ['locations', 'tree'],
    queryFn: () => locationsApi.getTree(),
  });

  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Location> }) =>
      locationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsEditModalOpen(false);
      setSelectedLocation(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsDeleteModalOpen(false);
      setSelectedLocation(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? locationsApi.activate(id) : locationsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const resetForm = () => {
    createForm.reset({ isActive: true, sortOrder: 0 });
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    editForm.reset({
      name: location.name,
      description: location.description,
      locationType: location.locationType,
      parentId: location.parentId,
      capacity: location.capacity,
      icon: location.icon,
      color: location.color,
      sortOrder: location.sortOrder,
      isActive: location.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = (data: CreateLocationFormData) => {
    createMutation.mutate(data as Location);
  };

  const handleSubmitEdit = (data: UpdateLocationFormData) => {
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderLocationRow = (location: Location, level: number = 0): React.ReactNode => {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedLocations.has(location.id);

    return (
      <React.Fragment key={location.id}>
        <tr className={`${styles.locationRow} ${!location.isActive ? styles.inactive : ''}`}>
          <td style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <div className={styles.nameCell}>
              {hasChildren && (
                <button 
                  className={styles.expandButton}
                  onClick={() => toggleExpand(location.id)}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              {!hasChildren && <span className={styles.expandPlaceholder} />}
              <MapPin size={16} style={{ color: location.color || 'var(--color-text-muted)' }} />
              <span className={styles.locationName}>{location.name}</span>
            </div>
          </td>
          <td>{location.locationType || '-'}</td>
          <td>{location.parentName || '-'}</td>
          <td className={styles.spoolCount}>
            <Package size={14} />
            {location.spoolCount || 0}
            {location.capacity && ` / ${location.capacity}`}
          </td>
          <td>
            <button
              className={styles.toggleButton}
              onClick={() => toggleActiveMutation.mutate({ id: location.id, active: !location.isActive })}
              title={location.isActive ? 'Deactivate' : 'Activate'}
            >
              {location.isActive ? <ToggleRight size={20} className={styles.activeToggle} /> : <ToggleLeft size={20} />}
            </button>
          </td>
          <td>
            <div className={styles.actions}>
              <button 
                className={styles.actionButton}
                onClick={() => navigate(`/locations/${location.id}`)}
                title="View spools"
              >
                <Eye size={16} />
              </button>
              <button 
                className={styles.actionButton}
                onClick={() => handleEdit(location)}
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => handleDelete(location)}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && location.children!.map(child => renderLocationRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // Build flat list with hierarchy for display
  const rootLocations = locations.filter(l => !l.parentId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Locations</h1>
          <p className={styles.subtitle}>
            Manage storage locations for your spools (AMS slots, racks, shelves, etc.)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Add Location
        </Button>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className={styles.empty}>
          <MapPin size={48} className={styles.emptyIcon} />
          <h3>No locations yet</h3>
          <p>Create locations to organize where your spools are stored</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            Add Location
          </Button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NAME</th>
                <th>TYPE</th>
                <th>PARENT</th>
                <th>SPOOLS</th>
                <th>ACTIVE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {locationTree.map(location => renderLocationRow(location))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title="Add New Location"
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(handleSubmitCreate as any)} className={styles.form}>
          <Controller
            name="name"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Name"
                placeholder="e.g., AMS Slot 1, Rack A, Storage Box 1"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="locationType"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Location Type"
                    options={locationTypeOptions}
                    value={field.value || ''}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const autoCapacity = getCapacityForType(newType);
                      field.onChange(newType);
                      createForm.setValue('capacity', autoCapacity);
                    }}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
            <Controller
              name="parentId"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Parent Location"
                    options={[
                      { value: '', label: 'None (Root)' },
                      ...rootLocations.map(l => ({ value: l.id, label: l.name })),
                    ]}
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            name="description"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Description"
                placeholder="Optional description"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="capacity"
              control={createForm.control}
              render={({ field, fieldState }) => {
                const locationType = createForm.watch('locationType');
                const isAutoManaged = isCapacityAutoManaged(locationType);
                return (
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Capacity (spools)"
                      type="number"
                      placeholder={isAutoManaged ? "Auto-set based on type" : "Leave empty for unlimited"}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        if (!isAutoManaged) {
                          field.onChange(e.target.value ? Number(e.target.value) : undefined);
                        }
                      }}
                      disabled={isAutoManaged}
                      helperText={isAutoManaged 
                        ? `${locationType === 'AMS' || locationType === 'AMS_2_PRO' || locationType === 'AMS_LITTLE' ? '4 spots' : '1 spot'} (auto-set based on type)`
                        : undefined
                      }
                      error={fieldState.error?.message}
                    />
                  </div>
                );
              }}
            />
            <Controller
              name="color"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Color"
                    options={colorOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Location
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedLocation(null); editForm.reset(); }}
        title="Edit Location"
        size="md"
      >
        <form onSubmit={editForm.handleSubmit(handleSubmitEdit)} className={styles.form}>
          <Controller
            name="name"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Name"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="locationType"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Location Type"
                    options={locationTypeOptions}
                    value={field.value || ''}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const autoCapacity = getCapacityForType(newType);
                      field.onChange(newType);
                      editForm.setValue('capacity', autoCapacity);
                    }}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
            <Controller
              name="parentId"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Parent Location"
                    options={[
                      { value: '', label: 'None (Root)' },
                      ...rootLocations
                        .filter(l => l.id !== selectedLocation?.id)
                        .map(l => ({ value: l.id, label: l.name })),
                    ]}
                    value={field.value ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            name="description"
            control={editForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Description"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="capacity"
              control={editForm.control}
              render={({ field, fieldState }) => {
                const locationType = editForm.watch('locationType');
                const isAutoManaged = isCapacityAutoManaged(locationType);
                return (
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Capacity (spools)"
                      type="number"
                      placeholder={isAutoManaged ? "Auto-set based on type" : "Leave empty for unlimited"}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        if (!isAutoManaged) {
                          field.onChange(e.target.value ? Number(e.target.value) : undefined);
                        }
                      }}
                      disabled={isAutoManaged}
                      helperText={isAutoManaged 
                        ? `${locationType === 'AMS' || locationType === 'AMS_2_PRO' || locationType === 'AMS_LITTLE' ? '4 spots' : '1 spot'} (auto-set based on type)`
                        : undefined
                      }
                      error={fieldState.error?.message}
                    />
                  </div>
                );
              }}
            />
            <Controller
              name="color"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Select
                    label="Color"
                    options={colorOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                  {fieldState.error && (
                    <span className={styles.errorText}>{fieldState.error.message}</span>
                  )}
                </div>
              )}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedLocation(null); editForm.reset(); }}>
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
        onClose={() => { setIsDeleteModalOpen(false); setSelectedLocation(null); }}
        title="Delete Location"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete this location?</p>
          {selectedLocation && (
            <div className={styles.deleteLocationInfo}>
              <MapPin size={20} style={{ color: selectedLocation.color || 'var(--color-text-muted)' }} />
              <div>
                <strong>{selectedLocation.name}</strong>
                <span>{selectedLocation.spoolCount || 0} spools</span>
              </div>
            </div>
          )}
          {selectedLocation?.spoolCount && selectedLocation.spoolCount > 0 && (
            <p className={styles.deleteWarning}>
              This location has spools. Move them first before deleting.
            </p>
          )}
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedLocation(null); }}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="danger" 
              isLoading={deleteMutation.isPending}
              onClick={() => selectedLocation && deleteMutation.mutate(selectedLocation.id)}
              disabled={selectedLocation?.spoolCount !== undefined && selectedLocation.spoolCount > 0}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

