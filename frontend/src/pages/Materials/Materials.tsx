import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Thermometer, Box } from 'lucide-react';
import { materialsApi } from '../../api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal, Badge } from '../../components/ui';
import type { Material } from '../../types';
import styles from './Materials.module.css';

export function Materials() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({});

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsCreateModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Material, 'id'> }) =>
      materialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsEditModalOpen(false);
      setSelectedMaterial(null);
      setFormData({});
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
    setFormData(material);
    setIsEditModalOpen(true);
  };

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      createMutation.mutate(formData as Omit<Material, 'id'>);
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaterial && formData.name) {
      updateMutation.mutate({
        id: selectedMaterial.id,
        data: formData as Omit<Material, 'id'>,
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
        onClose={() => { setIsCreateModalOpen(false); setFormData({}); }}
        title="Add New Material"
        size="md"
      >
        <form onSubmit={handleSubmitCreate} className={styles.form}>
          <Input
            label="Name"
            placeholder="e.g., PLA, PETG, ABS"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            placeholder="Brief description of the material"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className={styles.formRow}>
            <Input
              label="Min Nozzle Temp (°C)"
              type="number"
              placeholder="190"
              value={formData.minNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, minNozzleTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Nozzle Temp (°C)"
              type="number"
              placeholder="230"
              value={formData.maxNozzleTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxNozzleTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label="Min Bed Temp (°C)"
              type="number"
              placeholder="45"
              value={formData.minBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, minBedTemp: Number(e.target.value) })}
            />
            <Input
              label="Max Bed Temp (°C)"
              type="number"
              placeholder="60"
              value={formData.maxBedTemp || ''}
              onChange={(e) => setFormData({ ...formData, maxBedTemp: Number(e.target.value) })}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.requiresEnclosure || false}
                onChange={(e) => setFormData({ ...formData, requiresEnclosure: e.target.checked })}
              />
              <span>Requires Enclosure</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.requiresDryBox || false}
                onChange={(e) => setFormData({ ...formData, requiresDryBox: e.target.checked })}
              />
              <span>Requires Dry Box</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setFormData({}); }}>
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
        onClose={() => { setIsEditModalOpen(false); setSelectedMaterial(null); setFormData({}); }}
        title="Edit Material"
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

          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.requiresEnclosure || false}
                onChange={(e) => setFormData({ ...formData, requiresEnclosure: e.target.checked })}
              />
              <span>Requires Enclosure</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.requiresDryBox || false}
                onChange={(e) => setFormData({ ...formData, requiresDryBox: e.target.checked })}
              />
              <span>Requires Dry Box</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedMaterial(null); setFormData({}); }}>
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

