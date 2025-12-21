import { apiClient } from './client';
import type { Spool, CreateSpoolDTO, UpdateSpoolDTO, SpoolLocation, LocationStats, MaterialStats } from '../types';

export const spoolsApi = {
  getAll: async (filters?: {
    location?: SpoolLocation;
    storageLocationId?: number;
    manufacturerId?: number;
    filamentTypeId?: number;
    colorId?: number;
    isEmpty?: boolean;
    colorNumber?: string;
  }): Promise<Spool[]> => {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.storageLocationId) params.append('storageLocationId', String(filters.storageLocationId));
    if (filters?.manufacturerId) params.append('manufacturerId', String(filters.manufacturerId));
    if (filters?.filamentTypeId) params.append('filamentTypeId', String(filters.filamentTypeId));
    if (filters?.colorId) params.append('colorId', String(filters.colorId));
    if (filters?.isEmpty !== undefined) params.append('isEmpty', String(filters.isEmpty));
    if (filters?.colorNumber) params.append('colorNumber', filters.colorNumber);
    
    const { data } = await apiClient.get(`/api/spools?${params.toString()}`);
    return data;
  },

  getById: async (id: number): Promise<Spool> => {
    const { data } = await apiClient.get(`/api/spools/${id}`);
    return data;
  },

  getByUid: async (uid: string): Promise<Spool> => {
    const { data } = await apiClient.get(`/api/spools/uid/${uid}`);
    return data;
  },

  create: async (spool: CreateSpoolDTO): Promise<Spool> => {
    const { data } = await apiClient.post('/api/spools', spool);
    return data;
  },

  update: async (id: number, spool: UpdateSpoolDTO): Promise<Spool> => {
    const { data } = await apiClient.put(`/api/spools/${id}`, spool);
    return data;
  },

  updateLocation: async (id: number, location?: SpoolLocation, storageLocationId?: number, details?: string): Promise<Spool> => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (storageLocationId) params.append('storageLocationId', String(storageLocationId));
    if (details) params.append('details', details);
    const { data } = await apiClient.patch(`/api/spools/${id}/location?${params.toString()}`);
    return data;
  },

  moveToLocation: async (id: number, storageLocationId: number): Promise<Spool> => {
    const { data } = await apiClient.patch(`/api/spools/${id}/location?storageLocationId=${storageLocationId}`);
    return data;
  },

  updateWeight: async (id: number, weight: number): Promise<Spool> => {
    const { data } = await apiClient.patch(`/api/spools/${id}/weight?weight=${weight}`);
    return data;
  },

  markEmpty: async (id: number): Promise<Spool> => {
    const { data } = await apiClient.patch(`/api/spools/${id}/empty`);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/spools/${id}`);
  },

  getStatsByLocation: async (): Promise<LocationStats[]> => {
    const { data } = await apiClient.get('/api/spools/stats/by-location');
    return data;
  },

  getStatsByMaterial: async (): Promise<MaterialStats[]> => {
    const { data } = await apiClient.get('/api/spools/stats/by-material');
    return data;
  },
};

