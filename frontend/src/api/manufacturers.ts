import { apiClient } from './client';
import type { Manufacturer } from '../types';

export const manufacturersApi = {
  getAll: async (): Promise<Manufacturer[]> => {
    const { data } = await apiClient.get('/api/manufacturers');
    return data;
  },

  getById: async (id: number): Promise<Manufacturer> => {
    const { data } = await apiClient.get(`/api/manufacturers/${id}`);
    return data;
  },

  create: async (manufacturer: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    const { data } = await apiClient.post('/api/manufacturers', manufacturer);
    return data;
  },

  update: async (id: number, manufacturer: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    const { data } = await apiClient.put(`/api/manufacturers/${id}`, manufacturer);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/manufacturers/${id}`);
  },
};

