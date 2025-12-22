import { z } from 'zod';

export const createSpoolSchema = z.object({
  filamentTypeId: z.number({ message: 'Filament type is required' }).min(1, 'Filament type is required'),
  colorId: z.number({ message: 'Color is required' }).min(1, 'Color is required'),
  manufacturerId: z.number().min(1, 'Manufacturer is required').optional(),
  spoolType: z.enum(['PLASTIC', 'REFILL', 'CARDBOARD']).optional(),
  storageLocationId: z.number().optional(),
  location: z.enum(['AMS', 'PRINTER', 'RACK', 'STORAGE', 'IN_USE', 'EMPTY']).optional(),
  locationDetails: z.string().max(500, 'Location details must be less than 500 characters').optional(),
  initialWeightGrams: z.union([
    z.number().positive('Initial weight must be positive'),
    z.string().transform((val) => {
      if (val === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }).pipe(z.number().positive('Initial weight must be positive').optional()),
    z.undefined(),
    z.null().transform(() => undefined),
  ]).optional(),
  currentWeightGrams: z.union([
    z.number().positive('Current weight must be positive'),
    z.string().transform((val) => {
      if (val === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }).pipe(z.number().positive('Current weight must be positive').optional()),
    z.undefined(),
    z.null().transform(() => undefined),
  ]).optional(),
  purchaseDate: z.string().optional(),
  openedDate: z.string().optional(),
  lastUsedDate: z.string().optional(),
  purchasePrice: z.union([
    z.number().min(0, 'Price cannot be negative'),
    z.string().transform((val) => {
      if (val === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }).pipe(z.number().min(0, 'Price cannot be negative').optional()),
    z.undefined(),
    z.null().transform(() => undefined),
  ]).optional(),
  purchaseCurrency: z.string()
    .max(10, 'Currency code must be 10 characters or less')
    .refine(
      (val) => !val || /^[A-Z]{3}$/.test(val),
      { message: 'Currency code must be a 3-letter ISO 4217 code (e.g., USD, EUR, BRL)' }
    )
    .optional(),
  colorNumber: z.string().max(50, 'Color number must be 50 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine(
  (data) => {
    // At least one location must be provided
    return data.storageLocationId || data.location;
  },
  {
    message: 'Either storage location or legacy location must be provided',
    path: ['location'],
  }
).refine(
  (data) => {
    // If currentWeightGrams is provided, it should not exceed initialWeightGrams
    if (data.currentWeightGrams && data.initialWeightGrams) {
      return data.currentWeightGrams <= data.initialWeightGrams;
    }
    return true;
  },
  {
    message: 'Current weight cannot exceed initial weight',
    path: ['currentWeightGrams'],
  }
);

export const updateSpoolSchema = createSpoolSchema.partial();

export type CreateSpoolFormData = z.infer<typeof createSpoolSchema>;
export type UpdateSpoolFormData = z.infer<typeof updateSpoolSchema>;

