import { apiClient } from './client';
import type { Material } from '../types';

export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const { data } = await apiClient.get('/materials');
    return data;
  },

  getById: async (id: number): Promise<Material> => {
    const { data } = await apiClient.get(`/materials/${id}`);
    return data;
  },

  create: async (material: Omit<Material, 'id'>): Promise<Material> => {
    const { data } = await apiClient.post('/materials', material);
    return data;
  },

  update: async (id: number, material: Omit<Material, 'id'>): Promise<Material> => {
    const { data } = await apiClient.put(`/materials/${id}`, material);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },
};

