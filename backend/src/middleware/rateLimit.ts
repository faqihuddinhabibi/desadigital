import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Too many requests' } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    
    const entry = requestCounts.get(clientIp);
    
    if (!entry || entry.resetAt < now) {
      requestCounts.set(clientIp, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    
    if (entry.count >= max) {
      res.status(429).json({ error: message });
      return;
    }
    
    entry.count++;
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.resetAt < now) {
      requestCounts.delete(key);
    }
  }
}, 60000);
