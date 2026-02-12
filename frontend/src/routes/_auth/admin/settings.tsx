import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState, useEffect } from 'react';
import { Save, Loader2, Send, Plus, Trash2, Play, RefreshCw, Globe, Shield, Bot, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const Route = createFileRoute('/_auth/admin/settings')({
  component: SettingsPage,
});

interface MonitoringEndpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  intervalSeconds: number;
  isActive: boolean;
  lastStatus: number | null;
  lastResponseMs: number | null;
  lastCheckedAt: string | null;
}

interface SystemHealth {
  status: string;
  services: { name: string; status: string; responseMs: number }[];
  timestamp: string;
}

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'domain' | 'telegram' | 'monitoring'>('domain');

  const tabs = [
    { id: 'domain' as const, label: 'Domain & SSL', icon: Globe },
    { id: 'telegram' as const, label: 'Telegram Bot', icon: Bot },
    { id: 'monitoring' as const, label: 'Monitoring', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi sistem Desa Digital</p>
      </div>

      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'domain' && <DomainSettings />}
      {activeTab === 'telegram' && <TelegramSettings />}
      {activeTab === 'monitoring' && <MonitoringSection />}
    </div>
  );
}

// ── Domain & SSL ──

function DomainSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string | null>>('/settings'),
  });

  const [domain, setDomain] = useState('');
  const [sslMethod, setSslMethod] = useState('none');
  const [cfToken, setCfToken] = useState('');

  useEffect(() => {
    if (settings) {
      setDomain(settings.domain || '');
      setSslMethod(settings.sslMethod || 'none');
      setCfToken(settings.cloudflare_tunnel_token || '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string | null>) => api.patch('/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const handleSave = () => {
    mutation.mutate({
      domain: domain || null,
      sslMethod,
      cloudflare_tunnel_token: cfToken || null,
    });
  };

  if (isLoading) return <div className="card p-8 text-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="desadigital.fibernode.id"
              className="input mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Arahkan DNS A record ke IP server Anda, atau gunakan Cloudflare Tunnel
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SSL / HTTPS
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'none', title: 'Tanpa SSL', desc: 'HTTP only (development)' },
              { value: 'letsencrypt', title: "Let's Encrypt", desc: 'SSL gratis otomatis via Certbot' },
              { value: 'cloudflare_tunnel', title: 'Cloudflare Tunnel', desc: 'Tunnel aman tanpa expose port' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSslMethod(opt.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  sslMethod === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="font-medium text-sm">{opt.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>

          {sslMethod === 'cloudflare_tunnel' && (
            <div>
              <label className="text-sm font-medium">Cloudflare Tunnel Token</label>
              <input
                type="password"
                value={cfToken}
                onChange={(e) => setCfToken(e.target.value)}
                placeholder="eyJhIjoiNjk..."
                className="input mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Buat tunnel di <a href="https://one.dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-primary underline">Cloudflare Zero Trust</a> → Networks → Tunnels → Create tunnel → Copy token
              </p>
            </div>
          )}

          {sslMethod === 'letsencrypt' && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p>SSL akan otomatis di-generate saat domain sudah diarahkan ke IP server. Pastikan port 80 dan 443 terbuka.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={mutation.isPending} className="btn btn-primary">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Pengaturan
        </button>
      </div>

      {mutation.isSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Pengaturan berhasil disimpan
        </div>
      )}
    </div>
  );
}

// ── Telegram Bot ──

function TelegramSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string | null>>('/settings'),
  });

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setBotToken(settings.telegram_bot_token || '');
      setChatId(settings.telegram_chat_id || '');
      setEnabled(settings.telegram_enabled === 'true');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string | boolean | null>) => api.patch('/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/settings/telegram/test', { botToken, chatId }),
  });

  const handleSave = () => {
    saveMutation.mutate({
      telegram_bot_token: botToken || null,
      telegram_chat_id: chatId || null,
      telegram_enabled: enabled,
    });
  };

  if (isLoading) return <div className="card p-8 text-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Telegram Bot
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Terima notifikasi realtime saat kamera offline, sistem error, dan lainnya melalui Telegram.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
            <span className="text-sm font-medium">Aktifkan Notifikasi Telegram</span>
          </div>

          <div>
            <label className="text-sm font-medium">Bot Token</label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
              className="input mt-1 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Buat bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary underline">@BotFather</a> di Telegram → /newbot → Copy token
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
              className="input mt-1 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Gunakan <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-primary underline">@userinfobot</a> atau <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer" className="text-primary underline">@getmyid_bot</a> untuk mendapatkan Chat ID
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => testMutation.mutate()}
          disabled={!botToken || !chatId || testMutation.isPending}
          className="btn btn-secondary"
        >
          {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Test Kirim
        </button>
        <button onClick={handleSave} disabled={saveMutation.isPending} className="btn btn-primary">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan
        </button>
      </div>

      {testMutation.isSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Pesan test berhasil dikirim! Cek Telegram Anda.
        </div>
      )}
      {testMutation.isError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          Gagal mengirim pesan. Pastikan Bot Token dan Chat ID benar.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Pengaturan Telegram disimpan
        </div>
      )}
    </div>
  );
}

// ── Monitoring ──

function MonitoringSection() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: health } = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: () => api.get<SystemHealth>('/settings/health'),
    refetchInterval: 30000,
  });

  const { data: endpoints, isLoading } = useQuery<MonitoringEndpoint[]>({
    queryKey: ['monitoring-endpoints'],
    queryFn: () => api.get<MonitoringEndpoint[]>('/settings/monitoring'),
  });

  const checkAllMutation = useMutation({
    mutationFn: () => api.post('/settings/monitoring/check-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-endpoints'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/monitoring/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-endpoints'] }),
  });

  const checkOneMutation = useMutation({
    mutationFn: (id: string) => api.post(`/settings/monitoring/${id}/check`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-endpoints'] }),
  });

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Status Sistem
        </h3>
        {health && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {health.services.map((svc) => (
              <div key={svc.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {svc.status === 'online' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <div>
                  <div className="text-sm font-medium">{svc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {svc.status === 'online' ? `${svc.responseMs}ms` : 'Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monitoring Endpoints */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monitoring HTTP</h3>
          <div className="flex gap-2">
            <button
              onClick={() => checkAllMutation.mutate()}
              disabled={checkAllMutation.isPending}
              className="btn btn-secondary text-sm"
            >
              {checkAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Check Semua
            </button>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat...</div>
        ) : !endpoints?.length ? (
          <div className="text-center py-8 text-muted-foreground">Belum ada endpoint monitoring</div>
        ) : (
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="shrink-0">
                  {ep.lastStatus === null ? (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  ) : ep.lastStatus === ep.expectedStatus ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ep.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {ep.method} {ep.url}
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  {ep.lastStatus !== null && (
                    <>
                      <div className={`text-sm font-mono ${ep.lastStatus === ep.expectedStatus ? 'text-green-500' : 'text-destructive'}`}>
                        {ep.lastStatus === 0 ? 'Timeout' : ep.lastStatus}
                      </div>
                      <div className="text-xs text-muted-foreground">{ep.lastResponseMs}ms</div>
                    </>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => checkOneMutation.mutate(ep.id)}
                    disabled={checkOneMutation.isPending}
                    className="btn btn-ghost p-2"
                    title="Check sekarang"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(ep.id)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-ghost p-2 text-destructive"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddEndpointForm onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddEndpointForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [expectedStatus, setExpectedStatus] = useState(200);

  const mutation = useMutation({
    mutationFn: (data: { name: string; url: string; method: string; expectedStatus: number }) =>
      api.post('/settings/monitoring', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-endpoints'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, url, method, expectedStatus });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Tambah Endpoint Monitoring</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required placeholder="Backend API" />
          </div>
          <div>
            <label className="text-sm font-medium">URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="input mt-1" required placeholder="https://api.example.com/health" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="input mt-1">
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Expected Status</label>
              <input type="number" value={expectedStatus} onChange={(e) => setExpectedStatus(Number(e.target.value))} className="input mt-1" />
            </div>
          </div>
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
