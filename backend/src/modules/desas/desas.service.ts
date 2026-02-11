import { eq, ilike, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { desas, rts } from '../../db/schema.js';
import { createError } from '../../middleware/errorHandler.js';
import type { CreateDesaInput, UpdateDesaInput, ListDesasQuery } from './desas.schema.js';

export async function listDesas(query: ListDesasQuery) {
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;
  
  const whereClause = search
    ? ilike(desas.name, `%${search}%`)
    : undefined;
  
  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(desas)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desas.name),
    db.select({ total: count() }).from(desas).where(whereClause),
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

export async function getDesaById(id: string) {
  const [desa] = await db.select().from(desas).where(eq(desas.id, id));
  
  if (!desa) {
    throw createError('Desa not found', 404);
  }
  
  const rtList = await db.select().from(rts).where(eq(rts.desaId, id)).orderBy(rts.rtNumber);
  
  return { ...desa, rts: rtList };
}

export async function createDesa(data: CreateDesaInput) {
  const [desa] = await db.insert(desas).values(data).returning();
  
  return desa;
}

export async function updateDesa(id: string, data: UpdateDesaInput) {
  const [existing] = await db.select().from(desas).where(eq(desas.id, id));
  
  if (!existing) {
    throw createError('Desa not found', 404);
  }
  
  const [desa] = await db
    .update(desas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(desas.id, id))
    .returning();
  
  return desa;
}

export async function deleteDesa(id: string) {
  const [desa] = await db.delete(desas).where(eq(desas.id, id)).returning({ id: desas.id });
  
  if (!desa) {
    throw createError('Desa not found', 404);
  }
  
  return { message: 'Desa deleted successfully' };
}
