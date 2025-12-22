import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Palette, Thermometer, ChevronDown, ChevronUp } from 'lucide-react';
import { filamentTypesApi, materialsApi, manufacturersApi } from '../../api';
import { Button, Card, Input, Select, Modal, Badge } from '../../components/ui';
import type { FilamentType, FilamentColor } from '../../types';
import styles from './FilamentTypes.module.css';

export function FilamentTypes() {
  const queryClient = useQueryClient();
  const [expandedType, setExpandedType] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FilamentType | null>(null);
  const [formData, setFormData] = useState<Partial<FilamentType>>({});
  const [colorFormData, setColorFormData] = useState<Partial<FilamentColor>>({ hexCode: '#000000' });

  const { data: filamentTypes = [], isLoading } = useQuery({
    queryKey: ['filament-types'],
    queryFn: () => filamentTypesApi.getAll(),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
  });

  const { data: manufacturers = [] } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: filamentTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      setIsCreateModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<FilamentType, 'id' | 'colors' | 'materialName' | 'manufacturerName'>> }) =>
      filamentTypesApi.update(id, data as Omit<FilamentType, 'id' | 'colors' | 'materialName' | 'manufacturerName'>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      setIsEditModalOpen(false);
      setSelectedType(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: filamentTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      setIsDeleteModalOpen(false);
      setSelectedType(null);
    },
  });

  const addColorMutation = useMutation({
    mutationFn: ({ typeId, color }: { typeId: number; color: Omit<FilamentColor, 'id' | 'filamentTypeId'> }) =>
      filamentTypesApi.addColor(typeId, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
      setIsAddColorModalOpen(false);
      setColorFormData({ hexCode: '#000000' });
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: ({ typeId, colorId }: { typeId: number; colorId: number }) =>
      filamentTypesApi.deleteColor(typeId, colorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filament-types'] });
    },
  });

  const handleEdit = (type: FilamentType) => {
    setSelectedType(type);
    setFormData(type);
    setIsEditModalOpen(true);
  };

  const handleDelete = (type: FilamentType) => {
    setSelectedType(type);
    setIsDeleteModalOpen(true);
  };

  const handleAddColor = (type: FilamentType) => {
    setSelectedType(type);
    setIsAddColorModalOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.materialId && formData.manufacturerId) {
      createMutation.mutate(formData as Omit<FilamentType, 'id' | 'colors' | 'materialName' | 'manufacturerName'>);
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && formData.name) {
      updateMutation.mutate({
        id: selectedType.id,
        data: formData,
      });
    }
  };

  const handleSubmitAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && colorFormData.name && colorFormData.hexCode) {
      addColorMutation.mutate({
        typeId: selectedType.id,
        color: colorFormData as Omit<FilamentColor, 'id' | 'filamentTypeId'>,
      });
    }
  };

  const toggleExpanded = (typeId: number) => {
    setExpandedType(expandedType === typeId ? null : typeId);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Filament Types</h1>
          <p className={styles.subtitle}>
            {filamentTypes.length} type{filamentTypes.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Add Filament Type
        </Button>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading filament types...</p>
        </div>
      ) : filamentTypes.length === 0 ? (
        <div className={styles.empty}>
          <Palette size={48} className={styles.emptyIcon} />
          <h3>No filament types found</h3>
          <p>Get started by adding your first filament type</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            Add Filament Type
          </Button>
        </div>
      ) : (
        <div className={styles.list}>
          {filamentTypes.map((type) => (
            <Card key={type.id} className={styles.typeCard}>
              <div className={styles.typeHeader} onClick={() => toggleExpanded(type.id)}>
                <div className={styles.typeInfo}>
                  <h3 className={styles.typeName}>{type.name}</h3>
                  <div className={styles.typeMeta}>
                    <Badge variant="info" size="sm">{type.materialName}</Badge>
                    <span className={styles.separator}>•</span>
                    <span className={styles.manufacturer}>{type.manufacturerName}</span>
                  </div>
                </div>
                
                <div className={styles.typeActions}>
                  <Badge variant="default" size="sm">
                    {type.colors?.length || 0} colors
                  </Badge>
                  <button onClick={(e) => { e.stopPropagation(); handleAddColor(type); }} aria-label="Add color">
                    <Plus size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(type); }} aria-label="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(type); }} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                  {expandedType === type.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedType === type.id && (
                <div className={styles.typeContent}>
                  {type.description && (
                    <p className={styles.description}>{type.description}</p>
                  )}
                  
                  {(type.minNozzleTemp || type.maxNozzleTemp || type.minBedTemp || type.maxBedTemp) && (
                    <div className={styles.temps}>
                      {(type.minNozzleTemp || type.maxNozzleTemp) && (
                        <div className={styles.temp}>
                          <Thermometer size={14} />
                          <span>Nozzle: {type.minNozzleTemp}°C - {type.maxNozzleTemp}°C</span>
                        </div>
                      )}
                      {(type.minBedTemp || type.maxBedTemp) && (
                        <div className={styles.temp}>
                          <Thermometer size={14} />
                          <span>Bed: {type.minBedTemp}°C - {type.maxBedTemp}°C</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.colorsSection}>
                    <h4>Colors</h4>
                    {type.colors && type.colors.length > 0 ? (
                      <div className={styles.colorGrid}>
                        {type.colors.map((color) => (
                          <div key={color.id} className={styles.colorItem}>
                            <div 
                              className={styles.colorSwatch}
                              style={{ backgroundColor: color.hexCode }}
                            >
                              {color.hexCode.toUpperCase() === '#FFFFFF' && (
                                <span className={styles.whiteSwatchBorder} />
                              )}
                            </div>
                            <div className={styles.colorInfo}>
                              <span className={styles.colorName}>{color.name}</span>
                              <span className={styles.colorHex}>{color.hexCode}</span>
                            </div>
                            <button
                              className={styles.colorDelete}
                              onClick={() => deleteColorMutation.mutate({ typeId: type.id, colorId: color.id })}
                              aria-label="Delete color"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noColors}>No colors added yet</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setFormData({}); }}
        title="Add New Filament Type"
        size="md"
      >
        <form onSubmit={handleSubmitCreate} className={styles.form}>
          <Input
            label="Name"
            placeholder="e.g., PLA Basic, PETG High Flow"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Material"
            options={materials.map(m => ({ value: m.id, label: m.name }))}
            value={formData.materialId || ''}
            onChange={(e) => setFormData({ ...formData, materialId: Number(e.target.value) })}
            placeholder="Select material"
          />

          <Select
            label="Manufacturer"
            options={manufacturers.map(m => ({ value: m.id, label: m.name }))}
            value={formData.manufacturerId || ''}
            onChange={(e) => setFormData({ ...formData, manufacturerId: Number(e.target.value) })}
            placeholder="Select manufacturer"
          />

          <Input
            label="Description"
            placeholder="Brief description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className={styles.formRow}>
            <Input
              label="Min Nozzle Temp (°C)"
              type="number"
              value={formData.minNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, minNozzleTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Nozzle Temp (°C)"
              type="number"
              value={formData.maxNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxNozzleTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label="Min Bed Temp (°C)"
              type="number"
              value={formData.minBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, minBedTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Bed Temp (°C)"
              type="number"
              value={formData.maxBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxBedTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setFormData({}); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Filament Type
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedType(null); setFormData({}); }}
        title="Edit Filament Type"
        size="md"
      >
        <form onSubmit={handleSubmitEdit} className={styles.form}>
          <Input
            label="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className={styles.formRow}>
            <Input
              label="Min Nozzle Temp (°C)"
              type="number"
              value={formData.minNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, minNozzleTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Nozzle Temp (°C)"
              type="number"
              value={formData.maxNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxNozzleTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label="Min Bed Temp (°C)"
              type="number"
              value={formData.minBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, minBedTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Bed Temp (°C)"
              type="number"
              value={formData.maxBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxBedTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedType(null); setFormData({}); }}>
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
        onClose={() => { setIsDeleteModalOpen(false); setSelectedType(null); }}
        title="Delete Filament Type"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete <strong>{selectedType?.name}</strong>?</p>
          <p className={styles.deleteWarning}>
            This will also delete all colors and affect any spools of this type.
          </p>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedType(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => selectedType && deleteMutation.mutate(selectedType.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Color Modal */}
      <Modal
        isOpen={isAddColorModalOpen}
        onClose={() => { setIsAddColorModalOpen(false); setColorFormData({ hexCode: '#000000' }); }}
        title={`Add Color to ${selectedType?.name}`}
        size="sm"
      >
        <form onSubmit={handleSubmitAddColor} className={styles.form}>
          <Input
            label="Color Name"
            placeholder="e.g., Jade White, Cobalt Blue"
            value={colorFormData.name || ''}
            onChange={(e) => setColorFormData({ ...colorFormData, name: e.target.value })}
            required
          />

          <div className={styles.colorPickerRow}>
            <Input
              label="Hex Code"
              placeholder="#000000"
              value={colorFormData.hexCode || ''}
              onChange={(e) => setColorFormData({ ...colorFormData, hexCode: e.target.value })}
              required
            />
            <div className={styles.colorPickerWrapper}>
              <label className={styles.colorPickerLabel}>Preview</label>
              <input
                type="color"
                value={colorFormData.hexCode || '#000000'}
                onChange={(e) => setColorFormData({ ...colorFormData, hexCode: e.target.value.toUpperCase() })}
                className={styles.colorPicker}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsAddColorModalOpen(false); setColorFormData({ hexCode: '#000000' }); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addColorMutation.isPending}>
              Add Color
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

