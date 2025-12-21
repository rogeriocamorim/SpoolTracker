// API Types
export interface Material {
  id: number;
  name: string;
  description?: string;
  minNozzleTemp?: number;
  maxNozzleTemp?: number;
  minBedTemp?: number;
  maxBedTemp?: number;
  requiresEnclosure?: boolean;
  requiresDryBox?: boolean;
}

export interface Manufacturer {
  id: number;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export interface FilamentColor {
  id: number;
  name: string;
  hexCode: string;
  productCode?: string;
  filamentTypeId: number;
}

export interface FilamentType {
  id: number;
  name: string;
  description?: string;
  materialId: number;
  materialName: string;
  manufacturerId: number;
  manufacturerName: string;
  minNozzleTemp?: number;
  maxNozzleTemp?: number;
  minBedTemp?: number;
  maxBedTemp?: number;
  diameterMm?: number;
  densityGPerCm3?: number;
  spoolWeightGrams?: number;
  colors: FilamentColor[];
}

export type SpoolLocation = 'AMS' | 'PRINTER' | 'RACK' | 'STORAGE' | 'IN_USE' | 'EMPTY';
export type SpoolType = 'PLASTIC' | 'REFILL' | 'CARDBOARD';

export interface Location {
  id: number;
  name: string;
  description?: string;
  locationType?: string;
  parentId?: number;
  parentName?: string;
  capacity?: number;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  spoolCount?: number;
  fullPath?: string;
  children?: Location[];
}

export interface Spool {
  id: number;
  uid: string;
  filamentTypeId: number;
  filamentTypeName: string;
  colorId: number;
  colorName: string;
  colorHexCode: string;
  colorProductCode?: string;
  manufacturerId: number;
  manufacturerName: string;
  manufacturerLogoUrl?: string;
  materialName: string;
  // Legacy location (enum)
  location?: SpoolLocation;
  locationDetails?: string;
  // New location system
  storageLocationId?: number;
  storageLocationName?: string;
  storageLocationType?: string;
  storageLocationFullPath?: string;
  spoolType?: SpoolType;
  initialWeightGrams?: number;
  currentWeightGrams?: number;
  remainingPercentage?: number;
  purchaseDate?: string;
  openedDate?: string;
  lastUsedDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  notes?: string;
  colorNumber?: string;
  isEmpty: boolean;
  createdAt: string;
  updatedAt: string;
  // Technical details
  diameterMm?: number;
  densityGPerCm3?: number;
  minNozzleTemp?: number;
  maxNozzleTemp?: number;
  minBedTemp?: number;
  maxBedTemp?: number;
}

export interface CreateSpoolDTO {
  filamentTypeId: number;
  colorId: number;
  manufacturerId: number;
  // Legacy location (enum) - optional if storageLocationId is provided
  location?: SpoolLocation;
  // New location system - preferred
  storageLocationId?: number;
  locationDetails?: string;
  spoolType?: SpoolType;
  initialWeightGrams?: number;
  currentWeightGrams?: number;
  purchaseDate?: string;
  openedDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  notes?: string;
  colorNumber?: string;
}

export interface UpdateSpoolDTO extends Partial<CreateSpoolDTO> {
  lastUsedDate?: string;
  isEmpty?: boolean;
}

export interface LocationStats {
  location: SpoolLocation;
  count: number;
}

export interface MaterialStats {
  material: string;
  count: number;
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

