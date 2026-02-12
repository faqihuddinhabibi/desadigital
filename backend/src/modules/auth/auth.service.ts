import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, refreshTokens, loginAttempts, activityLogs } from '../../db/schema.js';
import { verifyPassword } from '../../utils/password.js';
import { signAccessToken, generateRefreshToken, getRefreshTokenExpiry, JwtPayload } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { createError } from '../../middleware/errorHandler.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: 'superadmin' | 'admin_rt' | 'warga';
    rtId: string | null;
  };
}

async function checkLoginAttempts(username: string, _ipAddress: string): Promise<void> {
  const lockoutTime = new Date(Date.now() - env.LOGIN_LOCKOUT_MINUTES * 60 * 1000);
  
  const attempts = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.username, username),
        gt(loginAttempts.createdAt, lockoutTime),
        eq(loginAttempts.success, false)
      )
    );
  
  if (attempts.length >= env.LOGIN_MAX_ATTEMPTS) {
    throw createError('Akun terkunci karena terlalu banyak percobaan login', 429);
  }
}

async function recordLoginAttempt(
  username: string,
  ipAddress: string,
  success: boolean,
  userAgent: string
): Promise<void> {
  await db.insert(loginAttempts).values({
    username,
    ipAddress,
    success,
    userAgent,
  });
}

export async function login(
  username: string,
  password: string,
  ipAddress: string,
  userAgent: string
): Promise<LoginResult> {
  await checkLoginAttempts(username, ipAddress);
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()));
  
  if (!user || !user.isActive) {
    await recordLoginAttempt(username, ipAddress, false, userAgent);
    throw createError('Username atau password salah', 401);
  }
  
  const isValidPassword = await verifyPassword(user.passwordHash, password);
  
  if (!isValidPassword) {
    await recordLoginAttempt(username, ipAddress, false, userAgent);
    throw createError('Username atau password salah', 401);
  }
  
  await recordLoginAttempt(username, ipAddress, true, userAgent);
  
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    rtId: user.rtId || undefined,
  };
  
  const accessToken = await signAccessToken(payload);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();
  
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });
  
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  
  await db.insert(activityLogs).values({
    userId: user.id,
    action: 'login',
    resource: 'auth',
    ipAddress,
    metadata: { userAgent },
  });

  // Real-time + Telegram notification
  const { emitUserLogin } = await import('../../lib/socket.js');
  const { sendTelegramNotification } = await import('../settings/telegram.service.js');
  emitUserLogin({ id: user.id, name: user.name, role: user.role });
  sendTelegramNotification('user_login', `👤 <b>User Login</b>\n\n🧑 <b>${user.name}</b> (@${user.username})\n🔑 Role: ${user.role}\n🌐 IP: ${ipAddress}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      rtId: user.rtId,
    },
  };
}

export async function refresh(
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const [existingToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        gt(refreshTokens.expiresAt, new Date())
      )
    );
  
  if (!existingToken) {
    throw createError('Invalid or expired refresh token', 401);
  }
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, existingToken.userId));
  
  if (!user || !user.isActive) {
    throw createError('User not found or inactive', 401);
  }
  
  await db.delete(refreshTokens).where(eq(refreshTokens.id, existingToken.id));
  
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    rtId: user.rtId || undefined,
  };
  
  const accessToken = await signAccessToken(payload);
  const newRefreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();
  
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: newRefreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });
  
  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, token?: string): Promise<void> {
  if (token) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  } else {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}

export async function updateProfile(userId: string, data: { name?: string; password?: string }) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name) updateData.name = data.name;
  if (data.password) {
    const { hashPassword } = await import('../../utils/password.js');
    updateData.passwordHash = await hashPassword(data.password);
  }

  if (Object.keys(updateData).length <= 1) {
    throw createError('Tidak ada perubahan', 400);
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      rtId: users.rtId,
    });

  if (!user) throw createError('User not found', 404);
  return user;
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      rtId: users.rtId,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    throw createError('User not found', 404);
  }
  
  return user;
}
