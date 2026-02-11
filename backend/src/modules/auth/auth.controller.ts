import { Router, Request, Response } from 'express';
import { loginSchema, refreshTokenSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

router.post(
  '/login',
  rateLimit({ windowMs: 60000, max: 10, message: 'Too many login attempts' }),
  async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const result = await authService.login(
      data.username,
      data.password,
      ipAddress,
      userAgent
    );
    
    res.json(result);
  }
);

router.post('/refresh', async (req: Request, res: Response) => {
  const data = refreshTokenSchema.parse(req.body);
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const result = await authService.refresh(data.refreshToken, ipAddress, userAgent);
  
  res.json(result);
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user!.sub, refreshToken);
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.sub);
  res.json(user);
});

export const authRouter = router;
