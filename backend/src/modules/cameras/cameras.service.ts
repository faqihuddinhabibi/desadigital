import { eq, and, ilike, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { cameras, rts, desas, users } from '../../db/schema.js';
import { createError } from '../../middleware/errorHandler.js';
import { encrypt } from '../../utils/encryption.js';
import { emitCameraCreated, emitCameraUpdated, emitCameraDeleted, emitCameraStatusChange, emitDashboardRefresh } from '../../lib/socket.js';
import { sendTelegramNotification } from '../settings/telegram.service.js';
import type { CreateCameraInput, UpdateCameraInput, ListCamerasQuery } from './cameras.schema.js';
import type { JwtPayload } from '../../utils/jwt.js';

export async function listCameras(query: ListCamerasQuery, user: JwtPayload) {
  const { page, limit, rtId, desaId, status, search } = query;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  
  if (user.role === 'admin_rt' || user.role === 'warga') {
    if (user.rtId) {
      conditions.push(eq(cameras.rtId, user.rtId));
    } else {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  } else {
    if (rtId) {
      conditions.push(eq(cameras.rtId, rtId));
    }
    if (desaId) {
      conditions.push(eq(rts.desaId, desaId));
    }
  }
  
  if (status) {
    conditions.push(eq(cameras.status, status));
  }
  
  if (search) {
    conditions.push(ilike(cameras.name, `%${search}%`));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: cameras.id,
        rtId: cameras.rtId,
        rtName: rts.name,
        desaId: rts.desaId,
        desaName: desas.name,
        name: cameras.name,
        location: cameras.location,
        status: cameras.status,
        lastOnlineAt: cameras.lastOnlineAt,
        createdAt: cameras.createdAt,
        updatedAt: cameras.updatedAt,
      })
      .from(cameras)
      .leftJoin(rts, eq(cameras.rtId, rts.id))
      .leftJoin(desas, eq(rts.desaId, desas.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(cameras.name),
    db
      .select({ total: count() })
      .from(cameras)
      .leftJoin(rts, eq(cameras.rtId, rts.id))
      .where(whereClause),
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCameraById(id: string, user: JwtPayload) {
  const [camera] = await db
    .select({
      id: cameras.id,
      rtId: cameras.rtId,
      rtName: rts.name,
      desaId: rts.desaId,
      desaName: desas.name,
      name: cameras.name,
      location: cameras.location,
      status: cameras.status,
      hlsUrl: cameras.hlsUrl,
      lastOnlineAt: cameras.lastOnlineAt,
      createdById: cameras.createdById,
      createdByName: users.name,
      createdAt: cameras.createdAt,
      updatedAt: cameras.updatedAt,
    })
    .from(cameras)
    .leftJoin(rts, eq(cameras.rtId, rts.id))
    .leftJoin(desas, eq(rts.desaId, desas.id))
    .leftJoin(users, eq(cameras.createdById, users.id))
    .where(eq(cameras.id, id));
  
  if (!camera) {
    throw createError('Camera not found', 404);
  }
  
  if (user.role !== 'superadmin' && camera.rtId !== user.rtId) {
    throw createError('Access denied', 403);
  }
  
  return camera;
}

export async function createCamera(data: CreateCameraInput, userId: string) {
  const [rt] = await db.select().from(rts).where(eq(rts.id, data.rtId));
  
  if (!rt) {
    throw createError('RT not found', 404);
  }
  
  const encryptedRtspUrl = encrypt(data.rtspUrl);
  
  const [camera] = await db
    .insert(cameras)
    .values({
      ...data,
      rtspUrl: encryptedRtspUrl,
      createdById: userId,
    })
    .returning({
      id: cameras.id,
      rtId: cameras.rtId,
      name: cameras.name,
      location: cameras.location,
      status: cameras.status,
      createdAt: cameras.createdAt,
    });
  
  emitCameraCreated({ id: camera.id, name: camera.name, rtId: camera.rtId });
  emitDashboardRefresh();
  sendTelegramNotification('camera_added', `📷 <b>Kamera Baru Ditambahkan</b>\n\n📷 <b>${camera.name}</b>\n📍 ${camera.location || '-'}`);

  return camera;
}

export async function updateCamera(id: string, data: UpdateCameraInput, user: JwtPayload) {
  const [existing] = await db.select().from(cameras).where(eq(cameras.id, id));
  
  if (!existing) {
    throw createError('Camera not found', 404);
  }
  
  if (user.role !== 'superadmin' && existing.rtId !== user.rtId) {
    throw createError('Access denied', 403);
  }
  
  if (data.rtId) {
    const [rt] = await db.select().from(rts).where(eq(rts.id, data.rtId));
    if (!rt) {
      throw createError('RT not found', 404);
    }
  }
  
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };
  
  if (data.rtspUrl) {
    updateData.rtspUrl = encrypt(data.rtspUrl);
  }
  
  const [camera] = await db
    .update(cameras)
    .set(updateData)
    .where(eq(cameras.id, id))
    .returning({
      id: cameras.id,
      rtId: cameras.rtId,
      name: cameras.name,
      location: cameras.location,
      status: cameras.status,
      updatedAt: cameras.updatedAt,
    });
  
  emitCameraUpdated({ id: camera.id, name: camera.name, rtId: camera.rtId });
  if (data.status && data.status !== existing.status) {
    emitCameraStatusChange({ id: camera.id, name: camera.name, rtId: camera.rtId, status: camera.status });
    emitDashboardRefresh();
    const eventType = data.status === 'online' ? 'camera_online' : 'camera_offline';
    const icon = data.status === 'online' ? '🟢' : '🔴';
    const label = data.status === 'online' ? 'Kamera Online' : 'Kamera Offline';
    sendTelegramNotification(eventType, `${icon} <b>${label}</b>\n\n📷 <b>${camera.name}</b>\n📍 ${camera.location || '-'}`);
  }

  return camera;
}

export async function deleteCamera(id: string, user: JwtPayload) {
  const [existing] = await db.select().from(cameras).where(eq(cameras.id, id));
  
  if (!existing) {
    throw createError('Camera not found', 404);
  }
  
  if (user.role !== 'superadmin' && existing.rtId !== user.rtId) {
    throw createError('Access denied', 403);
  }
  
  await db.delete(cameras).where(eq(cameras.id, id));
  
  emitCameraDeleted(id, existing.rtId);
  emitDashboardRefresh();
  sendTelegramNotification('camera_deleted', `🗑 <b>Kamera Dihapus</b>\n\n📷 <b>${existing.name}</b>`);

  return { message: 'Camera deleted successfully' };
}

export async function getStreamUrl(id: string, user: JwtPayload) {
  const [camera] = await db
    .select({
      id: cameras.id,
      rtId: cameras.rtId,
      hlsUrl: cameras.hlsUrl,
      status: cameras.status,
    })
    .from(cameras)
    .where(eq(cameras.id, id));
  
  if (!camera) {
    throw createError('Camera not found', 404);
  }
  
  if (user.role !== 'superadmin' && camera.rtId !== user.rtId) {
    throw createError('Access denied', 403);
  }
  
  if (camera.status === 'offline') {
    throw createError('Camera is offline', 503);
  }
  
  return {
    streamUrl: camera.hlsUrl || `/streams/${camera.id}/index.m3u8`,
  };
}
