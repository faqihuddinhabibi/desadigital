import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Camera, Users, MapPin, Building, Wifi, WifiOff } from 'lucide-react';
import type { DashboardStats, PaginatedResponse, Camera as CameraType } from '../../types';

export const Route = createFileRoute('/_auth/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const { data: cameras } = useQuery({
    queryKey: ['cameras', { limit: 12 }],
    queryFn: () => api.get<PaginatedResponse<CameraType>>('/cameras?limit=12'),
  });

  const statCards = [
    ...(user?.role === 'superadmin' ? [
      { label: 'Total Desa', value: stats?.desas ?? 0, icon: MapPin, color: 'text-blue-500' },
      { label: 'Total RT', value: stats?.rts ?? 0, icon: Building, color: 'text-purple-500' },
      { label: 'Total User', value: stats?.users ?? 0, icon: Users, color: 'text-orange-500' },
    ] : []),
    { label: 'Total Kamera', value: stats?.cameras ?? 0, icon: Camera, color: 'text-green-500' },
    { label: 'Kamera Online', value: stats?.onlineCameras ?? 0, icon: Wifi, color: 'text-accent' },
    { label: 'Kamera Offline', value: (stats?.cameras ?? 0) - (stats?.onlineCameras ?? 0), icon: WifiOff, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Kamera CCTV</h2>
          <Link to="/cameras" className="text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>

        {cameras?.data.length === 0 ? (
          <div className="card p-12 text-center">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada kamera</h3>
            <p className="text-muted-foreground mb-4">Tidak ada kamera yang tersedia untuk ditampilkan.</p>
            {(user?.role === 'superadmin' || user?.role === 'admin_rt') && (
              <Link to="/cameras" className="btn btn-primary">
                Tambah Kamera
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cameras?.data.map((camera) => (
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
        )}
      </div>
    </div>
  );
}
