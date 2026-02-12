import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  role: z.enum(['superadmin', 'admin_rt', 'warga']),
  rtId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore').optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  role: z.enum(['superadmin', 'admin_rt', 'warga']).optional(),
  rtId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['superadmin', 'admin_rt', 'warga']).optional(),
  rtId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
