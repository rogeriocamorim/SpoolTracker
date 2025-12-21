import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Thermometer, Box } from 'lucide-react';
import { materialsApi } from '../../api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal, Badge } from '../../components/ui';
import { createMaterialSchema, updateMaterialSchema, type CreateMaterialFormData, type UpdateMaterialFormData } from '../../schemas/material';
import type { Material } from '../../types';
import styles from './Materials.module.css';

export function Materials() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Form state with react-hook-form
  const createForm = useForm<CreateMaterialFormData>({
    resolver: zodResolver(createMaterialSchema) as any,
    defaultValues: {
      requiresEnclosure: false,
      requiresDryBox: false,
    },
  });

  const editForm = useForm<UpdateMaterialFormData>({
    resolver: zodResolver(updateMaterialSchema) as any,
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsCreateModalOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Material, 'id'> }) =>
      materialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsEditModalOpen(false);
      setSelectedMaterial(null);
      editForm.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: materialsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
    },
  });

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    editForm.reset(material);
    setIsEditModalOpen(true);
  };

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = (data: CreateMaterialFormData) => {
    createMutation.mutate(data as Omit<Material, 'id'>);
  };

  const handleSubmitEdit = (data: UpdateMaterialFormData) => {
    if (selectedMaterial) {
      updateMutation.mutate({
        id: selectedMaterial.id,
        data: data as Omit<Material, 'id'>,
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Materials</h1>
          <p className={styles.subtitle}>
            {materials.length} material{materials.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Add Material
        </Button>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className={styles.empty}>
          <Box size={48} className={styles.emptyIcon} />
          <h3>No materials found</h3>
          <p>Get started by adding your first material</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            Add Material
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {materials.map((material) => (
            <Card key={material.id} className={styles.materialCard}>
              <CardHeader>
                <CardTitle>{material.name}</CardTitle>
                <div className={styles.cardActions}>
                  <button onClick={() => handleEdit(material)} aria-label="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(material)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {material.description && (
                  <p className={styles.description}>{material.description}</p>
                )}
                <div className={styles.specs}>
                  {(material.minNozzleTemp || material.maxNozzleTemp) && (
                    <div className={styles.spec}>
                      <Thermometer size={14} />
                      <span>Nozzle: {material.minNozzleTemp}°C - {material.maxNozzleTemp}°C</span>
                    </div>
                  )}
                  {(material.minBedTemp || material.maxBedTemp) && (
                    <div className={styles.spec}>
                      <Thermometer size={14} />
                      <span>Bed: {material.minBedTemp}°C - {material.maxBedTemp}°C</span>
                    </div>
                  )}
                </div>
                <div className={styles.tags}>
                  {material.requiresEnclosure && (
                    <Badge variant="warning" size="sm">Enclosure Required</Badge>
                  )}
                  {material.requiresDryBox && (
                    <Badge variant="info" size="sm">Dry Box Required</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); createForm.reset(); }}
        title="Add New Material"
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(handleSubmitCreate)} className={styles.form}>
          <Controller
            name="name"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Name"
                placeholder="e.g., PLA, PETG, ABS"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="description"
            control={createForm.control}
            render={({ field, fieldState }) => (
              <Input
                label="Description"
                placeholder="Brief description of the material"
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <div className={styles.formRow}>
            <Controller
              name="minNozzleTemp"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Min Nozzle Temp (°C)"
                    type="number"
                    placeholder="190"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="maxNozzleTemp"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Max Nozzle Temp (°C)"
                    type="number"
                    placeholder="230"
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
              name="minBedTemp"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Min Bed Temp (°C)"
                    type="number"
                    placeholder="45"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="maxBedTemp"
              control={createForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Max Bed Temp (°C)"
                    type="number"
                    placeholder="60"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <Controller
              name="requiresEnclosure"
              control={createForm.control}
              render={({ field }) => (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={field.onChange}
                  />
                  <span>Requires Enclosure</span>
                </label>
              )}
            />
            <Controller
              name="requiresDryBox"
              control={createForm.control}
              render={({ field }) => (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={field.onChange}
                  />
                  <span>Requires Dry Box</span>
                </label>
              )}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); createForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedMaterial(null); editForm.reset(); }}
        title="Edit Material"
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
              name="minNozzleTemp"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Min Nozzle Temp (°C)"
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
              name="maxNozzleTemp"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Max Nozzle Temp (°C)"
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

          <div className={styles.formRow}>
            <Controller
              name="minBedTemp"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Min Bed Temp (°C)"
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
              name="maxBedTemp"
              control={editForm.control}
              render={({ field, fieldState }) => (
                <div style={{ flex: 1 }}>
                  <Input
                    label="Max Bed Temp (°C)"
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

          <div className={styles.checkboxGroup}>
            <Controller
              name="requiresEnclosure"
              control={editForm.control}
              render={({ field }) => (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={field.onChange}
                  />
                  <span>Requires Enclosure</span>
                </label>
              )}
            />
            <Controller
              name="requiresDryBox"
              control={editForm.control}
              render={({ field }) => (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={field.onChange}
                  />
                  <span>Requires Dry Box</span>
                </label>
              )}
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedMaterial(null); editForm.reset(); }}>
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
        onClose={() => { setIsDeleteModalOpen(false); setSelectedMaterial(null); }}
        title="Delete Material"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete <strong>{selectedMaterial?.name}</strong>?</p>
          <p className={styles.deleteWarning}>
            This will also affect all filament types associated with this material.
          </p>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedMaterial(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => selectedMaterial && deleteMutation.mutate(selectedMaterial.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

