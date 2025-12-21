import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ExternalLink, Factory } from 'lucide-react';
import { manufacturersApi } from '../../api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal } from '../../components/ui';
import type { Manufacturer } from '../../types';
import styles from './Manufacturers.module.css';

export function Manufacturers() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [formData, setFormData] = useState<Partial<Manufacturer>>({});

  const { data: manufacturers = [], isLoading } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: manufacturersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setIsCreateModalOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Manufacturer, 'id'> }) =>
      manufacturersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setIsEditModalOpen(false);
      setSelectedManufacturer(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: manufacturersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      setIsDeleteModalOpen(false);
      setSelectedManufacturer(null);
    },
  });

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setFormData(manufacturer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      createMutation.mutate(formData as Omit<Manufacturer, 'id'>);
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedManufacturer && formData.name) {
      updateMutation.mutate({
        id: selectedManufacturer.id,
        data: formData as Omit<Manufacturer, 'id'>,
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Manufacturers</h1>
          <p className={styles.subtitle}>
            {manufacturers.length} manufacturer{manufacturers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Add Manufacturer
        </Button>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading manufacturers...</p>
        </div>
      ) : manufacturers.length === 0 ? (
        <div className={styles.empty}>
          <Factory size={48} className={styles.emptyIcon} />
          <h3>No manufacturers found</h3>
          <p>Get started by adding your first manufacturer</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            Add Manufacturer
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {manufacturers.map((manufacturer) => (
            <Card key={manufacturer.id} className={styles.manufacturerCard}>
              <CardHeader>
                <CardTitle>{manufacturer.name}</CardTitle>
                <div className={styles.cardActions}>
                  <button onClick={() => handleEdit(manufacturer)} aria-label="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(manufacturer)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {manufacturer.description && (
                  <p className={styles.description}>{manufacturer.description}</p>
                )}
                {manufacturer.website && (
                  <a
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.website}
                  >
                    <ExternalLink size={14} />
                    {manufacturer.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setFormData({}); }}
        title="Add New Manufacturer"
        size="md"
      >
        <form onSubmit={handleSubmitCreate} className={styles.form}>
          <Input
            label="Name"
            placeholder="e.g., Bambu Lab, Polymaker"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            placeholder="Brief description of the manufacturer"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Website"
            type="url"
            placeholder="https://example.com"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />

          <Input
            label="Logo URL"
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logoUrl || ''}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsCreateModalOpen(false); setFormData({}); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Manufacturer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedManufacturer(null); setFormData({}); }}
        title="Edit Manufacturer"
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

          <Input
            label="Website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />

          <Input
            label="Logo URL"
            type="url"
            value={formData.logoUrl || ''}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedManufacturer(null); setFormData({}); }}>
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
        onClose={() => { setIsDeleteModalOpen(false); setSelectedManufacturer(null); }}
        title="Delete Manufacturer"
        size="sm"
      >
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete <strong>{selectedManufacturer?.name}</strong>?</p>
          <p className={styles.deleteWarning}>
            This will also affect all filament types and spools associated with this manufacturer.
          </p>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedManufacturer(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => selectedManufacturer && deleteMutation.mutate(selectedManufacturer.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

