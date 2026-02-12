import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { appSettings, monitoringEndpoints } from '../../db/schema.js';
import { createError } from '../../middleware/errorHandler.js';
import type { UpdateSettingsInput, CreateEndpointInput, UpdateEndpointInput } from './settings.schema.js';

// ── App Settings ──

export async function getAllSettings() {
  const rows = await db.select().from(appSettings);
  const settings: Record<string, string | null> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function getSetting(key: string) {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const rows = await db.select().from(appSettings).where(inArray(appSettings.key, keys));
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = rows.find(r => r.key === key)?.value ?? null;
  }
  return result;
}

export async function setSetting(key: string, value: string | null) {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function updateSettings(data: UpdateSettingsInput) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const updatedKeys: string[] = [];
  for (const [key, value] of entries) {
    await setSetting(key, value === null ? null : String(value));
    updatedKeys.push(key);
  }

  // Emit socket events for real-time updates
  const { emitSettingsUpdated, emitBrandingUpdated } = await import('../../lib/socket.js');
  emitSettingsUpdated(updatedKeys);
  const brandingKeys = ['app_name', 'site_subtitle', 'logo_url', 'splash_logo_url', 'favicon_url', 'meta_title', 'meta_description', 'og_image_url'];
  if (updatedKeys.some(k => brandingKeys.includes(k))) {
    emitBrandingUpdated();
  }

  return getAllSettings();
}

// ── Monitoring Endpoints ──

export async function listEndpoints() {
  return db.select().from(monitoringEndpoints).orderBy(monitoringEndpoints.name);
}

export async function getEndpointById(id: string) {
  const [endpoint] = await db.select().from(monitoringEndpoints).where(eq(monitoringEndpoints.id, id));
  if (!endpoint) throw createError('Endpoint not found', 404);
  return endpoint;
}

export async function createEndpoint(data: CreateEndpointInput) {
  const [endpoint] = await db.insert(monitoringEndpoints).values(data).returning();
  return endpoint;
}

export async function updateEndpoint(id: string, data: UpdateEndpointInput) {
  const [existing] = await db.select().from(monitoringEndpoints).where(eq(monitoringEndpoints.id, id));
  if (!existing) throw createError('Endpoint not found', 404);
  const [endpoint] = await db.update(monitoringEndpoints).set(data).where(eq(monitoringEndpoints.id, id)).returning();
  return endpoint;
}

export async function deleteEndpoint(id: string) {
  const [endpoint] = await db.delete(monitoringEndpoints).where(eq(monitoringEndpoints.id, id)).returning({ id: monitoringEndpoints.id });
  if (!endpoint) throw createError('Endpoint not found', 404);
  return { message: 'Endpoint deleted' };
}

export async function checkEndpoint(id: string) {
  const endpoint = await getEndpointById(id);
  const start = Date.now();
  let status = 0;
  let responseMs = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(endpoint.url, {
      method: endpoint.method,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    status = res.status;
    responseMs = Date.now() - start;
  } catch {
    responseMs = Date.now() - start;
    status = 0;
  }

  const [updated] = await db.update(monitoringEndpoints).set({
    lastStatus: status,
    lastResponseMs: responseMs,
    lastCheckedAt: new Date(),
  }).where(eq(monitoringEndpoints.id, id)).returning();

  return updated;
}

export async function checkAllEndpoints() {
  const endpoints = await db.select().from(monitoringEndpoints).where(eq(monitoringEndpoints.isActive, true));
  const results = [];
  for (const ep of endpoints) {
    const result = await checkEndpoint(ep.id);
    results.push(result);
  }
  return results;
}

// ── System Health ──

export async function getSystemHealth() {
  const services = [];

  // Database
  try {
    const start = Date.now();
    await db.select().from(appSettings).limit(1);
    services.push({ name: 'PostgreSQL', status: 'online', responseMs: Date.now() - start });
  } catch {
    services.push({ name: 'PostgreSQL', status: 'offline', responseMs: 0 });
  }

  // Backend API
  services.push({ name: 'Backend API', status: 'online', responseMs: 0 });

  return {
    status: services.every(s => s.status === 'online') ? 'healthy' : 'degraded',
    services,
    timestamp: new Date().toISOString(),
  };
}
