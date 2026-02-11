import { Router, Request, Response } from 'express';
import { createUserSchema, updateUserSchema, listUsersQuerySchema } from './users.schema.js';
import * as usersService from './users.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireSuperadmin } from '../../middleware/roleGuard.js';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperadmin);

router.get('/', async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await usersService.listUsers(query);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id as string);
  res.json(user);
});

router.post('/', async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await usersService.createUser(data);
  res.status(201).json(user);
});

router.patch('/:id', async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(req.params.id as string, data);
  res.json(user);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const result = await usersService.deleteUser(req.params.id as string);
  res.json(result);
});

export const usersRouter = router;
