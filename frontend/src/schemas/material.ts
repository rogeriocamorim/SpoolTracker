import { z } from 'zod';

export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Material name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  minNozzleTemp: z.preprocess(
    (val: unknown): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    z.number().int().min(0, 'Temperature must be 0 or greater').max(500, 'Temperature must be less than 500°C').optional()
  ),
  maxNozzleTemp: z.preprocess(
    (val: unknown): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    z.number().int().min(0, 'Temperature must be 0 or greater').max(500, 'Temperature must be less than 500°C').optional()
  ),
  minBedTemp: z.preprocess(
    (val: unknown): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    z.number().int().min(0, 'Temperature must be 0 or greater').max(200, 'Temperature must be less than 200°C').optional()
  ),
  maxBedTemp: z.preprocess(
    (val: unknown): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    z.number().int().min(0, 'Temperature must be 0 or greater').max(200, 'Temperature must be less than 200°C').optional()
  ),
  requiresEnclosure: z.boolean().default(false),
  requiresDryBox: z.boolean().default(false),
}).refine(
  (data) => {
    // If both min and max are provided, max should be >= min
    if (data.minNozzleTemp && data.maxNozzleTemp) {
      return data.maxNozzleTemp >= data.minNozzleTemp;
    }
    return true;
  },
  {
    message: 'Max nozzle temperature must be greater than or equal to min temperature',
    path: ['maxNozzleTemp'],
  }
).refine(
  (data) => {
    // If both min and max are provided, max should be >= min
    if (data.minBedTemp && data.maxBedTemp) {
      return data.maxBedTemp >= data.minBedTemp;
    }
    return true;
  },
  {
    message: 'Max bed temperature must be greater than or equal to min temperature',
    path: ['maxBedTemp'],
  }
);

export const updateMaterialSchema = createMaterialSchema.partial();

export type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialFormData = z.infer<typeof updateMaterialSchema>;

