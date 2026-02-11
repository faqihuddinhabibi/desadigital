import { z } from 'zod';

export const createDesaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().optional().nullable(),
});

export const updateDesaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  address: z.string().optional().nullable(),
});

export const listDesasQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateDesaInput = z.infer<typeof createDesaSchema>;
export type UpdateDesaInput = z.infer<typeof updateDesaSchema>;
export type ListDesasQuery = z.infer<typeof listDesasQuerySchema>;
