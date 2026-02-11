import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ArrowLeft, Maximize, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import type { Camera } from '../../../types';

export const Route = createFileRoute('/_auth/cameras/$cameraId')({
  component: CameraDetailPage,
});

function CameraDetailPage() {
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
