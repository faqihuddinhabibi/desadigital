import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { updateSettingsSchema, createEndpointSchema, updateEndpointSchema } from './settings.schema.js';
import * as settingsService from './settings.service.js';
import { testTelegramConnection } from './telegram.service.js';

export const settingsRouter = Router();

// ── Public Branding (no auth needed — used by login page & splash) ──

settingsRouter.get('/branding', async (_req, res, next) => {
  try {
    const keys = ['app_name', 'logo_url', 'splash_logo_url'];
    const branding: Record<string, string | null> = {};
    for (const key of keys) {
      branding[key] = await settingsService.getSetting(key);
    }
    res.json(branding);
  } catch (error) {
    next(error);
  }
});

// ── App Settings ──

settingsRouter.get('/', authMiddleware, requireRole('superadmin'), async (_req, res, next) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch('/', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const data = updateSettingsSchema.parse(req.body);
    const settings = await settingsService.updateSettings(data);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// ── Telegram ──

settingsRouter.post('/telegram/test', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken || !chatId) {
      res.status(400).json({ error: 'botToken and chatId are required' });
      return;
    }
    const result = await testTelegramConnection(botToken, chatId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── System Health ──

settingsRouter.get('/health', authMiddleware, requireRole('superadmin'), async (_req, res, next) => {
  try {
    const health = await settingsService.getSystemHealth();
    res.json(health);
  } catch (error) {
    next(error);
  }
});

// ── Monitoring Endpoints ──

settingsRouter.get('/monitoring', authMiddleware, requireRole('superadmin'), async (_req, res, next) => {
  try {
    const endpoints = await settingsService.listEndpoints();
    res.json(endpoints);
  } catch (error) {
    next(error);
  }
});

settingsRouter.post('/monitoring', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const data = createEndpointSchema.parse(req.body);
    const endpoint = await settingsService.createEndpoint(data);
    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch('/monitoring/:id', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const data = updateEndpointSchema.parse(req.body);
    const endpoint = await settingsService.updateEndpoint(req.params.id as string, data);
    res.json(endpoint);
  } catch (error) {
    next(error);
  }
});

settingsRouter.delete('/monitoring/:id', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const result = await settingsService.deleteEndpoint(req.params.id as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

settingsRouter.post('/monitoring/:id/check', authMiddleware, requireRole('superadmin'), async (req, res, next) => {
  try {
    const result = await settingsService.checkEndpoint(req.params.id as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

settingsRouter.post('/monitoring/check-all', authMiddleware, requireRole('superadmin'), async (_req, res, next) => {
  try {
    const results = await settingsService.checkAllEndpoints();
    res.json(results);
  } catch (error) {
    next(error);
  }
});
