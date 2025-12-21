import { apiClient } from './client';
import type { FilamentType, FilamentColor } from '../types';

export const filamentTypesApi = {
  getAll: async (filters?: {
    materialId?: number;
    manufacturerId?: number;
  }): Promise<FilamentType[]> => {
    const params = new URLSearchParams();
    if (filters?.materialId) params.append('materialId', String(filters.materialId));
    if (filters?.manufacturerId) params.append('manufacturerId', String(filters.manufacturerId));
    
    const { data } = await apiClient.get(`/filament-types?${params.toString()}`);
    return data;
  },

  getById: async (id: number): Promise<FilamentType> => {
    const { data } = await apiClient.get(`/filament-types/${id}`);
    return data;
  },

  create: async (filamentType: Omit<FilamentType, 'id' | 'colors' | 'materialName' | 'manufacturerName'>): Promise<FilamentType> => {
    const { data } = await apiClient.post('/filament-types', filamentType);
    return data;
  },

  update: async (id: number, filamentType: Omit<FilamentType, 'id' | 'colors' | 'materialName' | 'manufacturerName'>): Promise<FilamentType> => {
    const { data } = await apiClient.put(`/filament-types/${id}`, filamentType);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/filament-types/${id}`);
  },

  // Colors
  getColors: async (typeId: number): Promise<FilamentColor[]> => {
    const { data } = await apiClient.get(`/filament-types/${typeId}/colors`);
    return data;
  },

  addColor: async (typeId: number, color: Omit<FilamentColor, 'id' | 'filamentTypeId'>): Promise<FilamentColor> => {
    const { data } = await apiClient.post(`/filament-types/${typeId}/colors`, color);
    return data;
  },

  updateColor: async (typeId: number, colorId: number, color: Omit<FilamentColor, 'id' | 'filamentTypeId'>): Promise<FilamentColor> => {
    const { data } = await apiClient.put(`/filament-types/${typeId}/colors/${colorId}`, color);
    return data;
  },

  deleteColor: async (typeId: number, colorId: number): Promise<void> => {
    await apiClient.delete(`/filament-types/${typeId}/colors/${colorId}`);
  },
};

