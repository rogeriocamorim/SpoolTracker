import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  locationType: z.string().max(50, 'Location type must be less than 50 characters').optional(),
  parentId: z.number().optional(),
  capacity: z.preprocess(
    (val: unknown): number | undefined => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    z.number().int().positive('Capacity must be a positive integer').optional()
  ),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').optional(),
  sortOrder: z.preprocess(
    (val: unknown): number => {
      if (val === '' || val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    },
    z.number().int().min(0).default(0)
  ),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationFormData = z.infer<typeof createLocationSchema>;
export type UpdateLocationFormData = z.infer<typeof updateLocationSchema>;

