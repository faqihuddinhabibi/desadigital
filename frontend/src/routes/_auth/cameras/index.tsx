import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Camera, Plus, Search, X, Loader2, ChevronDown, Check, Wifi, WifiOff, Edit, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import type { PaginatedResponse, Camera as CameraType, RT, Desa } from '../../../types';

export const Route = createFileRoute('/_auth/cameras/')({
  component: CamerasPage,
});

function CamerasPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [desaFilter, setDesaFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cameras/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cameras'] }),
  });

  const { data: desas } = useQuery({
    queryKey: ['desas'],
    queryFn: () => api.get<PaginatedResponse<Desa>>('/desas?limit=100'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cameras', { page, search, status: statusFilter, desaId: desaFilter }],
    queryFn: () => api.get<PaginatedResponse<CameraType>>(
      `/cameras?page=${page}&limit=10${search ? `&search=${search}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${desaFilter ? `&desaId=${desaFilter}` : ''}`
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
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
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
        </select>
        {user?.role === 'superadmin' && (
          <select
            value={desaFilter}
            onChange={(e) => setDesaFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Semua Desa</option>
            {desas?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
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
              <div key={camera.id} className="card p-0 overflow-hidden group hover:shadow-lg transition-all">
                <Link
                  to="/cameras/$cameraId"
                  params={{ cameraId: camera.id }}
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
                        camera.status === 'online' ? 'badge-online' : 'badge-offline'
                      }`}>
                        {camera.status}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-3 flex items-start justify-between gap-2">
                  <Link to="/cameras/$cameraId" params={{ cameraId: camera.id }} className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{camera.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {camera.location || camera.rtName || 'Lokasi tidak tersedia'}
                    </p>
                  </Link>
                  {(user?.role === 'superadmin' || user?.role === 'admin_rt') && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingCamera(camera)}
                        className="btn btn-ghost p-1.5 h-auto"
                        title="Edit kamera"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Hapus kamera "${camera.name}"?`)) deleteMutation.mutate(camera.id); }}
                        className="btn btn-ghost p-1.5 h-auto text-destructive"
                        title="Hapus kamera"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

      {showForm && <CameraForm onClose={() => setShowForm(false)} />}
      {editingCamera && <EditCameraForm camera={editingCamera} onClose={() => setEditingCamera(null)} />}
    </div>
  );
}

function CameraForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [rtId, setRtId] = useState(user?.rtId || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const { data: rts } = useQuery({
    queryKey: ['rts', 'all'],
    queryFn: () => api.get<PaginatedResponse<RT>>('/rts?limit=100'),
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; location: string; rtspUrl: string; rtId: string }) =>
      api.post('/cameras', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      onClose();
    },
  });

  const handleConnect = async () => {
    if (!rtspUrl) {
      setConnectError('Masukkan RTSP URL terlebih dahulu');
      return;
    }
    setIsConnecting(true);
    setConnectError('');
    try {
      // Simulate connection test - in real app this would test the RTSP stream
      await new Promise(resolve => setTimeout(resolve, 1500));
      // For now, just check if URL format is valid
      if (rtspUrl.startsWith('rtsp://')) {
        setIsConnected(true);
      } else {
        setConnectError('Format URL tidak valid. Harus dimulai dengan rtsp://');
      }
    } catch {
      setConnectError('Gagal terhubung ke kamera');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    mutation.mutate({ name, location, rtspUrl, rtId });
  };

  // Reset connection when URL changes
  useEffect(() => {
    setIsConnected(false);
    setConnectError('');
  }, [rtspUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-4xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tambah Kamera</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">RTSP URL</label>
                <input 
                  type="text" 
                  value={rtspUrl} 
                  onChange={(e) => setRtspUrl(e.target.value)} 
                  className="input mt-1" 
                  placeholder="rtsp://admin:password@192.168.1.100:554/stream"
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">Format: rtsp://username:password@ip:port/path</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nama Kamera</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="input mt-1" 
                  placeholder="Kamera Pos RT 01"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lokasi</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="input mt-1" 
                  placeholder="Pos RT 01 Sukamaju"
                />
              </div>
              {user?.role === 'superadmin' && (
                <div className="relative">
                  <label className="text-sm font-medium">Area (RT)</label>
                  <SearchableRTSelect
                    options={rts?.data || []}
                    value={rtId}
                    onChange={setRtId}
                    placeholder="Pilih RT"
                    required
                  />
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Preview Kamera</label>
              <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed">
                {isConnected ? (
                  <div className="text-center">
                    <Wifi className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">Terhubung</p>
                    <p className="text-xs text-muted-foreground mt-1">Kamera siap disimpan</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum terhubung</p>
                    <p className="text-xs text-muted-foreground mt-1">Klik tombol Connect untuk menghubungkan</p>
                  </div>
                )}
              </div>
              {connectError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
                  {connectError}
                </div>
              )}
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting || !rtspUrl}
                className={`btn w-full ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Menghubungkan...</>
                ) : isConnected ? (
                  <><Wifi className="h-4 w-4" /> Terhubung</>
                ) : (
                  <><Wifi className="h-4 w-4" /> Connect</>
                )}
              </button>
            </div>
          </div>

          {mutation.isError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mt-4">
              Gagal menambahkan kamera. Silakan coba lagi.
            </div>
          )}
          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" disabled={mutation.isPending || !isConnected} className="btn btn-primary">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCameraForm({ camera, onClose }: { camera: CameraType; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState(camera.name);
  const [location, setLocation] = useState(camera.location || '');
  const [rtId, setRtId] = useState(camera.rtId || '');

  const { data: rts } = useQuery({
    queryKey: ['rts', 'all'],
    queryFn: () => api.get<PaginatedResponse<RT>>('/rts?limit=100'),
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; location?: string; rtId?: string }) =>
      api.patch(`/cameras/${camera.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: { name: string; location?: string; rtId?: string } = { name };
    if (location) data.location = location;
    if (rtId) data.rtId = rtId;
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Kamera</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Kamera</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium">Lokasi</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input mt-1" />
          </div>
          {user?.role === 'superadmin' && (
            <div>
              <label className="text-sm font-medium">Area (RT)</label>
              <SearchableRTSelect
                options={rts?.data || []}
                value={rtId}
                onChange={setRtId}
                placeholder="Pilih RT"
                required
              />
            </div>
          )}
          {mutation.isError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
              {mutation.error?.message || 'Gagal menyimpan. Silakan coba lagi.'}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SearchableRTSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  required 
}: { 
  options: RT[]; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const filteredOptions = options.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.desaName?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  return (
    <div className="mt-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input w-full text-left flex items-center justify-between"
      >
        <span className={selectedOption ? '' : 'text-muted-foreground'}>
          {selectedOption ? `${selectedOption.name} - ${selectedOption.desaName}` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {required && !value && <input type="text" required className="sr-only" tabIndex={-1} />}
      
      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle} className="bg-card border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-card">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari RT atau Desa..."
                className="input pl-8 py-1.5 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan</div>
            ) : (
              filteredOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onChange(r.id); setIsOpen(false); setSearch(''); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between ${
                    value === r.id ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span>{r.name} - {r.desaName}</span>
                  {value === r.id && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
