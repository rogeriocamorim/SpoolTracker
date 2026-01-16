import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Name must be less than 100 characters'),
  description: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(500, 'Description must be less than 500 characters').optional()
  ),
  locationType: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(50, 'Location type must be less than 50 characters').optional()
  ),
  parentId: z.number().optional(),
  capacity: z.union([
    z.number().int().positive('Capacity must be a positive integer'),
    z.string().transform((val) => {
      if (val === '') return undefined;
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }).pipe(z.number().int().positive('Capacity must be a positive integer').optional()),
    z.undefined(),
    z.null().transform(() => undefined),
  ]).optional(),
  icon: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(50).optional()
  ),
  color: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').optional()
  ),
  sortOrder: z.union([
    z.number().int().min(0),
    z.string().transform((val) => {
      if (val === '') return 0;
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    }).pipe(z.number().int().min(0)),
    z.undefined().transform(() => 0),
    z.null().transform(() => 0),
  ]).default(0),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationFormData = z.infer<typeof createLocationSchema>;
export type UpdateLocationFormData = z.infer<typeof updateLocationSchema>;

