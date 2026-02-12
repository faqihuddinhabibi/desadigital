import { eq, and, ilike, or, count, ne } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, rts, desas } from '../../db/schema.js';
import { hashPassword } from '../../utils/password.js';
import { createError } from '../../middleware/errorHandler.js';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema.js';

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, role, rtId, search } = query;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  
  if (role) {
    conditions.push(eq(users.role, role));
  }
  
  if (rtId) {
    conditions.push(eq(users.rtId, rtId));
  }
  
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.username, `%${search}%`)
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        rtId: users.rtId,
        rtName: rts.name,
        desaName: desas.name,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(rts, eq(users.rtId, rts.id))
      .leftJoin(desas, eq(rts.desaId, desas.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt),
    db.select({ total: count() }).from(users).where(whereClause),
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

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      rtId: users.rtId,
      rtName: rts.name,
      desaId: rts.desaId,
      desaName: desas.name,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(rts, eq(users.rtId, rts.id))
    .leftJoin(desas, eq(rts.desaId, desas.id))
    .where(eq(users.id, id));
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  return user;
}

export async function createUser(data: CreateUserInput) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, data.username.toLowerCase()));
  
  if (existing) {
    throw createError('Username sudah digunakan', 409);
  }
  
  if (data.rtId) {
    const [rt] = await db.select().from(rts).where(eq(rts.id, data.rtId));
    if (!rt) {
      throw createError('RT not found', 404);
    }
  }
  
  const passwordHash = await hashPassword(data.password);
  
  const [user] = await db
    .insert(users)
    .values({
      username: data.username.toLowerCase(),
      passwordHash,
      name: data.name,
      role: data.role,
      rtId: data.rtId || null,
    })
    .returning({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      rtId: users.rtId,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  
  return user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  
  if (!existing) {
    throw createError('User not found', 404);
  }
  
  if (data.username && data.username.toLowerCase() !== existing.username) {
    const [usernameExists] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, data.username.toLowerCase()), ne(users.id, id)));
    
    if (usernameExists) {
      throw createError('Username sudah digunakan', 409);
    }
  }
  
  if (data.rtId) {
    const [rt] = await db.select().from(rts).where(eq(rts.id, data.rtId));
    if (!rt) {
      throw createError('RT not found', 404);
    }
  }
  
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  
  if (data.username) updateData.username = data.username.toLowerCase();
  if (data.name) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (data.rtId !== undefined) updateData.rtId = data.rtId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  
  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      rtId: users.rtId,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    });
  
  return user;
}

export async function deleteUser(id: string) {
  const [user] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  return { message: 'User deactivated successfully' };
}
