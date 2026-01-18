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

export interface SeedStatus {
  manufacturersSeeded: boolean;
  materialsSeeded: boolean;
  filamentTypesSeeded: boolean;
  colorsSeeded: boolean;
  manufacturerCount: number;
  materialCount: number;
  filamentTypeCount: number;
  colorCount: number;
}

export interface SeedResult {
  manufacturersSeeded: boolean;
  materialsSeeded: boolean;
  filamentTypesSeeded: boolean;
  colorsSeeded: boolean;
  message: string;
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
  getSeedStatus: async (): Promise<SeedStatus> => {
    const { data } = await apiClient.get<SeedStatus>('/settings/seed-status');
    return data;
  },
  seedData: async (): Promise<SeedResult> => {
    const { data } = await apiClient.post<SeedResult>('/settings/seed-data');
    return data;
  },
};

