import { z } from 'zod';

export const updateSettingsSchema = z.object({
  domain: z.string().optional().nullable(),
  sslMethod: z.enum(['none', 'letsencrypt', 'cloudflare_tunnel']).optional(),
  cloudflare_tunnel_token: z.string().optional().nullable(),
  telegram_bot_token: z.string().optional().nullable(),
  telegram_chat_id: z.string().optional().nullable(),
  telegram_enabled: z.boolean().optional(),
  app_name: z.string().optional(),
  logo_url: z.string().optional().nullable(),
  splash_logo_url: z.string().optional().nullable(),
});

export const updateEndpointSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'HEAD']).optional(),
  expectedStatus: z.coerce.number().min(100).max(599).optional(),
  intervalSeconds: z.coerce.number().min(10).max(3600).optional(),
  isActive: z.boolean().optional(),
});

export const createEndpointSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  expectedStatus: z.coerce.number().min(100).max(599).default(200),
  intervalSeconds: z.coerce.number().min(10).max(3600).default(60),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
