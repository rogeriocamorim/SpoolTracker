import { apiClient } from './client';
import type { Manufacturer } from '../types';

export const manufacturersApi = {
  getAll: async (): Promise<Manufacturer[]> => {
    const { data } = await apiClient.get('/manufacturers');
    return data;
  },

  getById: async (id: number): Promise<Manufacturer> => {
    const { data } = await apiClient.get(`/manufacturers/${id}`);
    return data;
  },

  create: async (manufacturer: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    const { data } = await apiClient.post('/manufacturers', manufacturer);
    return data;
  },

  update: async (id: number, manufacturer: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    const { data } = await apiClient.put(`/manufacturers/${id}`, manufacturer);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/manufacturers/${id}`);
  },
};

