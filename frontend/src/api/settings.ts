import { apiClient } from './client';

export interface Settings {
  defaultWeightGrams: number;
  defaultCurrency: string;
  lowStockThreshold: number;
}

export interface UpdateSettingsDTO {
  defaultWeightGrams?: number;
  defaultCurrency?: string;
  lowStockThreshold?: number;
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const { data } = await apiClient.get<Settings>('/settings');
    return data;
  },
  update: async (settings: UpdateSettingsDTO): Promise<Settings> => {
    const { data } = await apiClient.put<Settings>('/settings', settings);
    return data;
  },
};

