import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

import { authRouter } from './modules/auth/auth.controller.js';
import { usersRouter } from './modules/users/users.controller.js';
import { desasRouter } from './modules/desas/desas.controller.js';
import { rtsRouter } from './modules/rts/rts.controller.js';
import { camerasRouter } from './modules/cameras/cameras.controller.js';
import { dashboardRouter } from './modules/dashboard/dashboard.controller.js';
import { settingsRouter } from './modules/settings/settings.controller.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

app.use(pinoHttp({ logger }) as any);

app.use(rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests',
}));

app.use('/streams', express.static(env.STREAMS_DIR));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/desas', desasRouter);
app.use('/api/rts', rtsRouter);
app.use('/api/cameras', camerasRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📚 Environment: ${env.NODE_ENV}`);
});

export default app;
