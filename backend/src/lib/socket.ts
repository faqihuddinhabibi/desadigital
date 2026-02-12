import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer, corsOrigin: string) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    path: '/ws',
    transports: ['websocket', 'polling'],
  });

  // Auth middleware — verify JWT on connection
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }
    // Attach user info to socket
    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info({ userId: user.sub, role: user.role }, 'Socket connected');

    // Join role-based rooms
    socket.join(`role:${user.role}`);
    if (user.rtId) {
      socket.join(`rt:${user.rtId}`);
    }
    // Personal room
    socket.join(`user:${user.sub}`);

    socket.on('disconnect', () => {
      logger.debug({ userId: user.sub }, 'Socket disconnected');
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// ── Event Emitters ──

export function emitCameraStatusChange(camera: { id: string; name: string; rtId: string; status: string }) {
  if (!io) return;
  io.emit('camera:status', camera);
  io.to(`rt:${camera.rtId}`).emit('camera:status:rt', camera);
}

export function emitCameraCreated(camera: { id: string; name: string; rtId: string }) {
  if (!io) return;
  io.emit('camera:created', camera);
}

export function emitCameraUpdated(camera: { id: string; name: string; rtId: string }) {
  if (!io) return;
  io.emit('camera:updated', camera);
}

export function emitCameraDeleted(cameraId: string, rtId: string) {
  if (!io) return;
  io.emit('camera:deleted', { id: cameraId, rtId });
}

export function emitSettingsUpdated(keys: string[]) {
  if (!io) return;
  io.emit('settings:updated', { keys });
}

export function emitBrandingUpdated() {
  if (!io) return;
  io.emit('branding:updated');
}

export function emitDashboardRefresh() {
  if (!io) return;
  io.emit('dashboard:refresh');
}

export function emitUserLogin(user: { id: string; name: string; role: string }) {
  if (!io) return;
  io.to('role:superadmin').emit('user:login', { ...user, timestamp: new Date().toISOString() });
}
