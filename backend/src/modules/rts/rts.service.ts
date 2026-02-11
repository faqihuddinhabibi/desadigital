import { eq, and, ilike, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { rts, desas, cameras, users } from '../../db/schema.js';
import { createError } from '../../middleware/errorHandler.js';
import type { CreateRtInput, UpdateRtInput, ListRtsQuery } from './rts.schema.js';

export async function listRts(query: ListRtsQuery) {
  const { page, limit, desaId, search } = query;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  
  if (desaId) {
    conditions.push(eq(rts.desaId, desaId));
  }
  
  if (search) {
    conditions.push(ilike(rts.name, `%${search}%`));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: rts.id,
        desaId: rts.desaId,
        desaName: desas.name,
        name: rts.name,
        rtNumber: rts.rtNumber,
        rwNumber: rts.rwNumber,
        createdAt: rts.createdAt,
        updatedAt: rts.updatedAt,
      })
      .from(rts)
      .leftJoin(desas, eq(rts.desaId, desas.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(rts.rtNumber),
    db.select({ total: count() }).from(rts).where(whereClause),
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

export async function getRtById(id: string) {
  const [rt] = await db
    .select({
      id: rts.id,
      desaId: rts.desaId,
      desaName: desas.name,
      name: rts.name,
      rtNumber: rts.rtNumber,
      rwNumber: rts.rwNumber,
      createdAt: rts.createdAt,
      updatedAt: rts.updatedAt,
    })
    .from(rts)
    .leftJoin(desas, eq(rts.desaId, desas.id))
    .where(eq(rts.id, id));
  
  if (!rt) {
    throw createError('RT not found', 404);
  }
  
  const cameraList = await db.select().from(cameras).where(eq(cameras.rtId, id));
  const userList = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.rtId, id));
  
  return { ...rt, cameras: cameraList, users: userList };
}

export async function createRt(data: CreateRtInput) {
  const [desa] = await db.select().from(desas).where(eq(desas.id, data.desaId));
  
  if (!desa) {
    throw createError('Desa not found', 404);
  }
  
  const [rt] = await db.insert(rts).values(data).returning();
  
  return rt;
}

export async function updateRt(id: string, data: UpdateRtInput) {
  const [existing] = await db.select().from(rts).where(eq(rts.id, id));
  
  if (!existing) {
    throw createError('RT not found', 404);
  }
  
  if (data.desaId) {
    const [desa] = await db.select().from(desas).where(eq(desas.id, data.desaId));
    if (!desa) {
      throw createError('Desa not found', 404);
    }
  }
  
  const [rt] = await db
    .update(rts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(rts.id, id))
    .returning();
  
  return rt;
}

export async function deleteRt(id: string) {
  const [rt] = await db.delete(rts).where(eq(rts.id, id)).returning({ id: rts.id });
  
  if (!rt) {
    throw createError('RT not found', 404);
  }
  
  return { message: 'RT deleted successfully' };
}
