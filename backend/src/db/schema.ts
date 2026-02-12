import { pgTable, pgEnum, uuid, varchar, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin_rt', 'warga']);
export const cameraStatusEnum = pgEnum('camera_status', ['online', 'offline']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  rtId: uuid('rt_id').references(() => rts.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  rt: one(rts, {
    fields: [users.rtId],
    references: [rts.id],
  }),
}));

export const desas = pgTable('desas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const desasRelations = relations(desas, ({ many }) => ({
  rts: many(rts),
}));

export const rts = pgTable('rts', {
  id: uuid('id').defaultRandom().primaryKey(),
  desaId: uuid('desa_id').notNull().references(() => desas.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  rtNumber: integer('rt_number').notNull(),
  rwNumber: integer('rw_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rtsRelations = relations(rts, ({ one, many }) => ({
  desa: one(desas, {
    fields: [rts.desaId],
    references: [desas.id],
  }),
  users: many(users),
  cameras: many(cameras),
}));

export const cameras = pgTable('cameras', {
  id: uuid('id').defaultRandom().primaryKey(),
  rtId: uuid('rt_id').notNull().references(() => rts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  rtspUrl: varchar('rtsp_url', { length: 500 }).notNull(),
  hlsUrl: varchar('hls_url', { length: 500 }),
  location: varchar('location', { length: 255 }),
  status: cameraStatusEnum('status').default('offline').notNull(),
  lastOnlineAt: timestamp('last_online_at', { withTimezone: true }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const camerasRelations = relations(cameras, ({ one }) => ({
  rt: one(rts, {
    fields: [cameras.rtId],
    references: [rts.id],
  }),
  createdBy: one(users, {
    fields: [cameras.createdById],
    references: [users.id],
  }),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull().unique(),
  userAgent: varchar('user_agent', { length: 500 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_refresh_tokens_user_id').on(table.userId),
  index('idx_refresh_tokens_expires').on(table.expiresAt),
]);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  success: boolean('success').notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_login_attempts_username_created').on(table.username, table.createdAt),
  index('idx_login_attempts_ip_created').on(table.ipAddress, table.createdAt),
]);

export const appSettings = pgTable('app_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const monitoringEndpoints = pgTable('monitoring_endpoints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).default('GET').notNull(),
  expectedStatus: integer('expected_status').default(200).notNull(),
  intervalSeconds: integer('interval_seconds').default(60).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastStatus: integer('last_status'),
  lastResponseMs: integer('last_response_ms'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Desa = typeof desas.$inferSelect;
export type NewDesa = typeof desas.$inferInsert;
export type RT = typeof rts.$inferSelect;
export type NewRT = typeof rts.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type NewCamera = typeof cameras.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type MonitoringEndpoint = typeof monitoringEndpoints.$inferSelect;
