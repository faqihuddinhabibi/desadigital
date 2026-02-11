import * as jose from 'jose';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  username: string;
  role: 'superadmin' | 'admin_rt' | 'warga';
  rtId?: string;
}

const secret = new TextEncoder().encode(env.JWT_SECRET);
const alg = 'HS256';

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  const expiresIn = parseDuration(env.JWT_EXPIRES_IN);
  
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getRefreshTokenExpiry(): Date {
  const expiresIn = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN);
  return new Date(Date.now() + expiresIn * 1000);
}
