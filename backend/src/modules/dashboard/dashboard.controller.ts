import { Router, Request, Response } from 'express';
import { count, eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { desas, rts, cameras, users } from '../../db/schema.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', async (req: Request, res: Response) => {
  const user = req.user!;
  
  if (user.role === 'superadmin') {
    const [desaCount] = await db.select({ count: count() }).from(desas);
    const [rtCount] = await db.select({ count: count() }).from(rts);
    const [cameraCount] = await db.select({ count: count() }).from(cameras);
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [onlineCameraCount] = await db.select({ count: count() }).from(cameras).where(eq(cameras.status, 'online'));
    
    res.json({
      desas: desaCount.count,
      rts: rtCount.count,
      cameras: cameraCount.count,
      users: userCount.count,
      onlineCameras: onlineCameraCount.count,
    });
  } else if (user.role === 'admin_rt' && user.rtId) {
    const [cameraCount] = await db.select({ count: count() }).from(cameras).where(eq(cameras.rtId, user.rtId));
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.rtId, user.rtId));
    const [onlineCameraCount] = await db
      .select({ count: count() })
      .from(cameras)
      .where(and(eq(cameras.rtId, user.rtId), eq(cameras.status, 'online')));
    
    res.json({
      cameras: cameraCount.count,
      users: userCount.count,
      onlineCameras: onlineCameraCount.count,
    });
  } else if (user.role === 'warga' && user.rtId) {
    const [cameraCount] = await db.select({ count: count() }).from(cameras).where(eq(cameras.rtId, user.rtId));
    const [onlineCameraCount] = await db
      .select({ count: count() })
      .from(cameras)
      .where(and(eq(cameras.rtId, user.rtId), eq(cameras.status, 'online')));
    
    res.json({
      cameras: cameraCount.count,
      onlineCameras: onlineCameraCount.count,
    });
  } else {
    res.json({});
  }
});

export const dashboardRouter = router;
