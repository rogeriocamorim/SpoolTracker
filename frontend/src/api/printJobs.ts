import { apiClient } from './client';

export interface FilamentUsage {
  id: number;
  type: string;
  colorHex: string;
  usedMeters: number;
  usedGrams: number;
  nozzleDiameter: string;
}

export interface SpoolMatch {
  id: number;
  uid: string;
  manufacturerName: string;
  filamentTypeName: string;
  materialName: string;
  colorName: string;
  colorHexCode: string;
  currentWeightGrams: number | null;
  remainingPercentage: number | null;
  storageLocationName: string;
  matchScore: number;
}

export interface FilamentMatch {
  usage: FilamentUsage;
  matchingSpools: SpoolMatch[];
  selectedSpoolId: number | null;
}

export interface PrintJobParseResult {
  fileName: string;
  printerModel: string;
  estimatedTimeSeconds: number;
  totalWeightGrams: number;
  usesSupport: boolean;
  filaments: FilamentMatch[];
}

export interface FilamentDeductionRequest {
  spoolId: number;
  gramsUsed: number;
  colorHex: string;
  type: string;
}

export const printJobsApi = {
  /**
   * Upload and parse a 3MF file
   */
  parse3mf: async (file: File): Promise<PrintJobParseResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await apiClient.post('/print-jobs/parse-3mf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Confirm print job and deduct filament from selected spools
   */
  confirmPrintJob: async (deductions: FilamentDeductionRequest[]): Promise<void> => {
    await apiClient.post('/print-jobs/confirm', deductions);
  },
};

