import { apiClient } from './client';
import type { Location, Spool } from '../types';

export const locationsApi = {
  getAll: async (filters?: {
    type?: string;
    parentId?: number;
    activeOnly?: boolean;
  }): Promise<Location[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.parentId) params.append('parentId', String(filters.parentId));
    if (filters?.activeOnly !== undefined) params.append('activeOnly', String(filters.activeOnly));
    
    const { data } = await apiClient.get(`/api/locations?${params.toString()}`);
    return data;
  },

  getTree: async (): Promise<Location[]> => {
    const { data } = await apiClient.get('/api/locations/tree');
    return data;
  },

  getTypes: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/api/locations/types');
    return data;
  },

  getById: async (id: number): Promise<Location> => {
    const { data } = await apiClient.get(`/api/locations/${id}`);
    return data;
  },

  getSpools: async (id: number): Promise<Spool[]> => {
    const { data } = await apiClient.get(`/api/locations/${id}/spools`);
    return data;
  },

  create: async (location: Omit<Location, 'id' | 'spoolCount' | 'fullPath' | 'children'>): Promise<Location> => {
    const { data } = await apiClient.post('/api/locations', location);
    return data;
  },

  update: async (id: number, location: Partial<Location>): Promise<Location> => {
    const { data } = await apiClient.put(`/api/locations/${id}`, location);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/locations/${id}`);
  },

  activate: async (id: number): Promise<Location> => {
    const { data } = await apiClient.patch(`/api/locations/${id}/activate`);
    return data;
  },

  deactivate: async (id: number): Promise<Location> => {
    const { data } = await apiClient.patch(`/api/locations/${id}/deactivate`);
    return data;
  },

  moveSpool: async (locationId: number, spoolId: number): Promise<Spool> => {
    const { data } = await apiClient.post(`/api/locations/${locationId}/spools/${spoolId}`);
    return data;
  },
};

