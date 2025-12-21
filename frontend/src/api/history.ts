import { apiClient } from './client';

export interface SpoolHistoryEntry {
  id: number;
  action: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export const historyApi = {
  getSpoolHistory: async (spoolId: number): Promise<SpoolHistoryEntry[]> => {
    const response = await apiClient.get<SpoolHistoryEntry[]>(`/spools/${spoolId}/history`);
    return response.data;
  },
};

