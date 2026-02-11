import { z } from 'zod';

export const createRtSchema = z.object({
  desaId: z.string().uuid('Invalid desa ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rtNumber: z.number().int().min(1, 'RT number must be positive'),
  rwNumber: z.number().int().min(1).optional().nullable(),
});

export const updateRtSchema = z.object({
  desaId: z.string().uuid('Invalid desa ID').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  rtNumber: z.number().int().min(1, 'RT number must be positive').optional(),
  rwNumber: z.number().int().min(1).optional().nullable(),
});

export const listRtsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  desaId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateRtInput = z.infer<typeof createRtSchema>;
export type UpdateRtInput = z.infer<typeof updateRtSchema>;
export type ListRtsQuery = z.infer<typeof listRtsQuerySchema>;
