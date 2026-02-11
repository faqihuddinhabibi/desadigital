import { z } from 'zod';

export const createCameraSchema = z.object({
  rtId: z.string().uuid('Invalid RT ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rtspUrl: z.string().min(1, 'RTSP URL is required'),
  location: z.string().optional().nullable(),
});

export const updateCameraSchema = z.object({
  rtId: z.string().uuid('Invalid RT ID').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  rtspUrl: z.string().min(1, 'RTSP URL is required').optional(),
  location: z.string().optional().nullable(),
  status: z.enum(['online', 'offline']).optional(),
});

export const listCamerasQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  rtId: z.string().uuid().optional(),
  desaId: z.string().uuid().optional(),
  status: z.enum(['online', 'offline']).optional(),
  search: z.string().optional(),
});

export type CreateCameraInput = z.infer<typeof createCameraSchema>;
export type UpdateCameraInput = z.infer<typeof updateCameraSchema>;
export type ListCamerasQuery = z.infer<typeof listCamerasQuerySchema>;
