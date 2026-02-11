import { Router, Request, Response } from 'express';
import { createDesaSchema, updateDesaSchema, listDesasQuerySchema } from './desas.schema.js';
import * as desasService from './desas.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireSuperadmin } from '../../middleware/roleGuard.js';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperadmin);

router.get('/', async (req: Request, res: Response) => {
  const query = listDesasQuerySchema.parse(req.query);
  const result = await desasService.listDesas(query);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const desa = await desasService.getDesaById(req.params.id as string);
  res.json(desa);
});

router.post('/', async (req: Request, res: Response) => {
  const data = createDesaSchema.parse(req.body);
  const desa = await desasService.createDesa(data);
  res.status(201).json(desa);
});

router.patch('/:id', async (req: Request, res: Response) => {
  const data = updateDesaSchema.parse(req.body);
  const desa = await desasService.updateDesa(req.params.id as string, data);
  res.json(desa);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const result = await desasService.deleteDesa(req.params.id as string);
  res.json(result);
});

export const desasRouter = router;
