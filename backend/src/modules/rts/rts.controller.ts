import { Router, Request, Response } from 'express';
import { createRtSchema, updateRtSchema, listRtsQuerySchema } from './rts.schema.js';
import * as rtsService from './rts.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireSuperadmin } from '../../middleware/roleGuard.js';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperadmin);

router.get('/', async (req: Request, res: Response) => {
  const query = listRtsQuerySchema.parse(req.query);
  const result = await rtsService.listRts(query);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const rt = await rtsService.getRtById(req.params.id as string);
  res.json(rt);
});

router.post('/', async (req: Request, res: Response) => {
  const data = createRtSchema.parse(req.body);
  const rt = await rtsService.createRt(data);
  res.status(201).json(rt);
});

router.patch('/:id', async (req: Request, res: Response) => {
  const data = updateRtSchema.parse(req.body);
  const rt = await rtsService.updateRt(req.params.id as string, data);
  res.json(rt);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const result = await rtsService.deleteRt(req.params.id as string);
  res.json(result);
});

export const rtsRouter = router;
