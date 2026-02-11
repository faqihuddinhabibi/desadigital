export type UserRole = 'superadmin' | 'admin_rt' | 'warga';
export type CameraStatus = 'online' | 'offline';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  rtId: string | null;
  rtName?: string;
  desaName?: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Desa {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  rts?: RT[];
}

export interface RT {
  id: string;
  desaId: string;
  desaName?: string;
  name: string;
  rtNumber: number;
  rwNumber: number | null;
  createdAt: string;
  updatedAt: string;
  cameras?: Camera[];
  users?: User[];
}

export interface Camera {
  id: string;
  rtId: string;
  rtName?: string;
  desaId?: string;
  desaName?: string;
  name: string;
  location: string | null;
  status: CameraStatus;
  hlsUrl?: string;
  lastOnlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  rtId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  desas?: number;
  rts?: number;
  cameras: number;
  users?: number;
  onlineCameras: number;
}
