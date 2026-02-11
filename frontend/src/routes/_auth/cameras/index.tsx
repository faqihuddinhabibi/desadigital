import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Camera, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import type { PaginatedResponse, Camera as CameraType } from '../../../types';

export const Route = createFileRoute('/_auth/cameras/')({
  component: CamerasPage,
});

function CamerasPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cameras', { page, search, status: statusFilter }],
    queryFn: () => api.get<PaginatedResponse<CameraType>>(
      `/cameras?page=${page}&limit=20${search ? `&search=${search}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`
    ),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kamera CCTV</h1>
          <p className="text-muted-foreground">Kelola dan pantau kamera CCTV</p>
        </div>
        
        {(user?.role === 'superadmin' || user?.role === 'admin_rt') && (
          <button className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Tambah Kamera
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kamera..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">Semua Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="card p-12 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Tidak ada kamera ditemukan</h3>
          <p className="text-muted-foreground">
            {search || statusFilter ? 'Coba ubah filter pencarian Anda.' : 'Belum ada kamera yang ditambahkan.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.data.map((camera) => (
              <Link
                key={camera.id}
                to="/cameras/$cameraId"
                params={{ cameraId: camera.id }}
                className="card p-0 overflow-hidden group hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                  {camera.status === 'offline' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Camera Offline</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`badge ${
                      camera.status === 'online' ? 'badge-online' :
                      camera.status === 'offline' ? 'badge-offline' :
                      'badge-maintenance'
                    }`}>
                      {camera.status}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{camera.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {camera.location || camera.rtName || 'Lokasi tidak tersedia'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="btn btn-secondary"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
