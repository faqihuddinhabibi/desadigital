import { Router, Request, Response } from 'express';
import { createCameraSchema, updateCameraSchema, listCamerasQuerySchema } from './cameras.schema.js';
import * as camerasService from './cameras.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const query = listCamerasQuerySchema.parse(req.query);
  const result = await camerasService.listCameras(query, req.user!);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const camera = await camerasService.getCameraById(req.params.id as string, req.user!);
  res.json(camera);
});

router.get('/:id/stream', async (req: Request, res: Response) => {
  const result = await camerasService.getStreamUrl(req.params.id as string, req.user!);
  res.json(result);
});

router.post(
  '/',
  requireRole('superadmin', 'admin_rt'),
  async (req: Request, res: Response) => {
    const data = createCameraSchema.parse(req.body);
    
    if (req.user!.role === 'admin_rt' && data.rtId !== req.user!.rtId) {
      res.status(403).json({ error: 'Cannot add camera to other RT' });
      return;
    }
    
    const camera = await camerasService.createCamera(data, req.user!.sub);
    res.status(201).json(camera);
  }
);

router.patch(
  '/:id',
  requireRole('superadmin', 'admin_rt'),
  async (req: Request, res: Response) => {
    const data = updateCameraSchema.parse(req.body);
    const camera = await camerasService.updateCamera(req.params.id as string, data, req.user!);
    res.json(camera);
  }
);

router.delete(
  '/:id',
  requireRole('superadmin', 'admin_rt'),
  async (req: Request, res: Response) => {
    const result = await camerasService.deleteCamera(req.params.id as string, req.user!);
    res.json(result);
  }
);

export const camerasRouter = router;
