import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [tokenVersion, setTokenVersion] = useState(0);

  // Listen for same-tab auth changes (login/logout)
  useEffect(() => {
    const handler = () => setTokenVersion((v) => v + 1);
    window.addEventListener('auth:token-changed', handler);
    return () => window.removeEventListener('auth:token-changed', handler);
  }, []);

  // Reconnect when token changes (cross-tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        setTokenVersion((v) => v + 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = io(window.location.origin, {
      path: '/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      console.log('[WS] Connected');
    });

    s.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    // ── Global event handlers that auto-invalidate React Query caches ──

    s.on('camera:created', () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('camera:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('camera:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('camera:status', () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('dashboard:refresh', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    s.on('settings:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    });

    s.on('branding:updated', () => {
      // Re-fetch branding from public endpoint and update BrandingProvider
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      // Also trigger a page-level branding refresh
      window.dispatchEvent(new CustomEvent('branding:updated'));
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, tokenVersion]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Subscribe to a specific socket event. Automatically cleans up on unmount.
 */
export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler as any);
    return () => {
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
}
