import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ArrowLeft, Maximize, Volume2, VolumeX, ChevronLeft, ChevronRight, Shield, Camera as CameraIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useBranding } from '../../../hooks/useBranding';
import Hls from 'hls.js';
import type { Camera, PaginatedResponse } from '../../../types';

export const Route = createFileRoute('/_auth/cameras/$cameraId')({
  component: CameraDetailPage,
});

function CameraDetailPage() {
  const { user } = useAuth();
  const isRtOrWarga = user?.role === 'admin_rt' || user?.role === 'warga';

  if (isRtOrWarga) {
    return <RTWargaCameraDetail />;
  }
  return <SuperadminCameraDetail />;
}

// ── RT/Warga: Fullscreen immersive camera view ──
function RTWargaCameraDetail() {
  const { cameraId } = Route.useParams();
  const navigate = useNavigate();
  const branding = useBranding();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const { data: camera, isLoading } = useQuery({
    queryKey: ['camera', cameraId],
    queryFn: () => api.get<Camera>(`/cameras/${cameraId}`),
  });

  const { data: streamData } = useQuery({
    queryKey: ['camera', cameraId, 'stream'],
    queryFn: () => api.get<{ streamUrl: string }>(`/cameras/${cameraId}/stream`),
    enabled: camera?.status === 'online',
  });

  const { data: allCameras } = useQuery({
    queryKey: ['cameras', 'rt-grid'],
    queryFn: () => api.get<PaginatedResponse<Camera>>('/cameras?limit=100'),
  });

  useEffect(() => {
    if (!videoRef.current || !streamData?.streamUrl) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 30 });
      hls.loadSource(streamData.streamUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;
      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamData.streamUrl;
    }
  }, [streamData?.streamUrl]);

  const cameras = allCameras?.data || [];
  const currentIdx = cameras.findIndex((c) => c.id === cameraId);
  const prevCamera = currentIdx > 0 ? cameras[currentIdx - 1] : null;
  const nextCamera = currentIdx < cameras.length - 1 ? cameras[currentIdx + 1] : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-black">
        <div className="animate-pulse w-full h-full bg-zinc-900" />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)] text-center">
        <h2 className="text-xl font-semibold mb-2">Kamera tidak ditemukan</h2>
        <Link to="/cameras" className="text-primary hover:underline">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-57px)] bg-black flex items-center justify-center overflow-hidden">
      {/* Video / Offline placeholder */}
      {camera.status === 'online' ? (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay muted={isMuted} playsInline />
      ) : (
        <div className="flex flex-col items-center justify-center text-white">
          <CameraIcon className="h-16 w-16 text-zinc-600 mb-4" />
          <p className="text-xl font-medium">Kamera Offline</p>
          <p className="text-sm text-zinc-500 mt-1">Stream tidak tersedia saat ini</p>
        </div>
      )}

      {/* Branding Watermark (top-left) */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 opacity-60 pointer-events-none">
        {branding.logo_url ? (
          <img src={branding.logo_url} alt="" className="h-7 w-7 object-contain rounded" />
        ) : (
          <div className="bg-primary/80 p-1 rounded">
            <Shield className="h-4 w-4 text-white" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">{branding.app_name || 'Desa Digital'}</p>
          <p className="text-[8px] tracking-wider text-white/70">{branding.site_subtitle || 'by Fibernode Internet'}</p>
        </div>
      </div>

      {/* Top-right controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
          {camera.status === 'online' && (
            <button onClick={() => setIsMuted(!isMuted)} className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 text-white transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          )}
          {prevCamera && (
            <button onClick={() => navigate({ to: '/cameras/$cameraId', params: { cameraId: prevCamera.id } })} className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 text-white transition-colors" title="Kamera Sebelumnya">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {nextCamera && (
            <button onClick={() => navigate({ to: '/cameras/$cameraId', params: { cameraId: nextCamera.id } })} className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 text-white transition-colors" title="Kamera Selanjutnya">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
        <button onClick={toggleFullscreen} className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white transition-colors">
          <Maximize className="h-5 w-5" />
        </button>
        <Link to="/cameras" className="flex items-center gap-2 px-4 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>

      {/* Recording indicator */}
      {camera.status === 'online' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">REC</span>
        </div>
      )}

      {/* Bottom floating info bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Kamera</span>
              <h2 className="text-lg font-bold text-white leading-none">{camera.name}</h2>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-bold uppercase ${camera.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>{camera.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Lokasi</span>
              <span className="text-sm font-medium text-white/90 leading-none">{camera.location || camera.rtName || '-'}</span>
            </div>
            {camera.lastOnlineAt && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold mb-0.5">Terakhir Online</span>
                  <span className="text-sm font-mono text-white/90 leading-none tracking-tight">{new Date(camera.lastOnlineAt).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Side navigation arrows (hover) */}
      {prevCamera && (
        <div className="absolute inset-y-0 left-0 flex items-center px-3 group/nav">
          <button onClick={() => navigate({ to: '/cameras/$cameraId', params: { cameraId: prevCamera.id } })} className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover/nav:opacity-100 hover:scale-110 transition-all text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
      )}
      {nextCamera && (
        <div className="absolute inset-y-0 right-0 flex items-center px-3 group/nav">
          <button onClick={() => navigate({ to: '/cameras/$cameraId', params: { cameraId: nextCamera.id } })} className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover/nav:opacity-100 hover:scale-110 transition-all text-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Superadmin: Original camera detail ──
function SuperadminCameraDetail() {
  const { cameraId } = Route.useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [, setIsFullscreen] = useState(false);

  const { data: camera, isLoading } = useQuery({
    queryKey: ['camera', cameraId],
    queryFn: () => api.get<Camera>(`/cameras/${cameraId}`),
  });

  const { data: streamData } = useQuery({
    queryKey: ['camera', cameraId, 'stream'],
    queryFn: () => api.get<{ streamUrl: string }>(`/cameras/${cameraId}/stream`),
    enabled: camera?.status === 'online',
  });

  useEffect(() => {
    if (!videoRef.current || !streamData?.streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hls.loadSource(streamData.streamUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamData.streamUrl;
    }
  }, [streamData?.streamUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="aspect-video bg-muted rounded-xl" />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Kamera tidak ditemukan</h2>
        <Link to="/cameras" className="text-primary hover:underline">
          Kembali ke daftar kamera
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cameras" className="btn btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{camera.name}</h1>
          <p className="text-muted-foreground">
            {camera.location || camera.rtName || 'Lokasi tidak tersedia'}
          </p>
        </div>
        <span className={`badge ml-auto ${
          camera.status === 'online' ? 'badge-online' : 'badge-offline'
        }`}>
          {camera.status}
        </span>
      </div>

      <div className="relative bg-black rounded-xl overflow-hidden">
        {camera.status === 'online' ? (
          <>
            <video
              ref={videoRef}
              className="w-full aspect-video"
              autoPlay
              muted={isMuted}
              playsInline
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="aspect-video flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-xl font-medium mb-2">Kamera Offline</p>
              <p className="text-sm text-gray-400">Stream tidak tersedia saat ini</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Detail Kamera</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Nama</dt>
            <dd className="font-medium">{camera.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="capitalize font-medium">{camera.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Lokasi</dt>
            <dd className="font-medium">{camera.location || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">RT</dt>
            <dd className="font-medium">{camera.rtName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Desa</dt>
            <dd className="font-medium">{camera.desaName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Terakhir Online</dt>
            <dd className="font-medium">
              {camera.lastOnlineAt
                ? new Date(camera.lastOnlineAt).toLocaleString('id-ID')
                : '-'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
