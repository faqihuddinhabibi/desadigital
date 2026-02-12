import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState, useEffect } from 'react';
import { Save, Loader2, Send, Plus, Trash2, Play, RefreshCw, Globe, Shield, Bot, Activity, CheckCircle2, XCircle, Clock, Image, BookOpen, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { ImageUpload } from '../../../components/ImageUpload';

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
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'telegram' | 'monitoring'>('branding');

  const tabs = [
    { id: 'branding' as const, label: 'Logo & Branding', icon: Image },
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

      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      {activeTab === 'branding' && <BrandingSettings />}
      {activeTab === 'domain' && <DomainSettings />}
      {activeTab === 'telegram' && <TelegramSettings />}
      {activeTab === 'monitoring' && <MonitoringSection />}
    </div>
  );
}

// ── Collapsible Tutorial ──

function Tutorial({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors">
        <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-3 pb-3 text-sm text-muted-foreground space-y-2">{children}</div>}
    </div>
  );
}

// ── Logo & Branding ──

function BrandingSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string | null>>('/settings'),
  });

  const [appName, setAppName] = useState('');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [splashLogoUrl, setSplashLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || '');
      setSiteSubtitle(settings.site_subtitle || '');
      setLogoUrl(settings.logo_url || '');
      setSplashLogoUrl(settings.splash_logo_url || '');
      setFaviconUrl(settings.favicon_url || '');
      setMetaTitle(settings.meta_title || '');
      setMetaDescription(settings.meta_description || '');
      setOgImageUrl(settings.og_image_url || '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string | null>) => api.patch('/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const handleSave = () => {
    mutation.mutate({
      app_name: appName || null,
      site_subtitle: siteSubtitle || null,
      logo_url: logoUrl || null,
      splash_logo_url: splashLogoUrl || null,
      favicon_url: faviconUrl || null,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      og_image_url: ogImageUrl || null,
    });
  };

  if (isLoading) return <div className="card p-8 text-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6">
      {/* Logo & Nama */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo & Nama Aplikasi
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Aplikasi</label>
            <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Desa Digital" className="input mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di header RT/Warga, halaman login, sidebar, dan splash screen</p>
          </div>
          <div>
            <label className="text-sm font-medium">Subtitle / Tagline</label>
            <input type="text" value={siteSubtitle} onChange={(e) => setSiteSubtitle(e.target.value)} placeholder="BY FIBERNODE INTERNET" className="input mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Ditampilkan di bawah nama aplikasi pada header RT/Warga dan watermark kamera</p>
          </div>
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            label="Logo (Header & Sidebar)"
            hint="Upload gambar PNG/SVG transparan. Ukuran rekomendasi: 200x200px"
          />
          <ImageUpload
            value={splashLogoUrl}
            onChange={setSplashLogoUrl}
            label="Logo Splash Screen"
            hint="Opsional. Jika kosong, akan menggunakan logo utama di atas"
          />
        </div>
      </div>

      {/* Favicon */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Favicon & Thumbnail
        </h3>
        <div className="space-y-4">
          <ImageUpload
            value={faviconUrl}
            onChange={setFaviconUrl}
            label="Favicon"
            hint="Ikon kecil di tab browser. Format: PNG, SVG, atau ICO. Ukuran: 32x32 atau 64x64px"
            previewSize="sm"
          />
          <ImageUpload
            value={ogImageUrl}
            onChange={setOgImageUrl}
            label="OG Image (Social Media Thumbnail)"
            hint="Gambar yang muncul saat link dibagikan di WhatsApp, Facebook, Twitter, dll. Ukuran: 1200x630px"
            previewSize="lg"
          />
        </div>
      </div>

      {/* Meta Tags */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Meta Tags (SEO)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Meta Title</label>
            <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Desa Digital - Monitoring CCTV | Fibernode" className="input mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Judul halaman di tab browser dan hasil pencarian Google</p>
          </div>
          <div>
            <label className="text-sm font-medium">Meta Description</label>
            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Sistem monitoring CCTV terintegrasi untuk desa digital..." className="input mt-1 min-h-[80px]" />
            <p className="text-xs text-muted-foreground mt-1">Deskripsi singkat yang muncul di hasil pencarian Google. Maksimal 160 karakter</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={mutation.isPending} className="btn btn-primary">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Semua
        </button>
      </div>
      {mutation.isSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Branding berhasil disimpan. Refresh halaman untuk melihat perubahan.
        </div>
      )}
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

  const protocol = sslMethod !== 'none' ? 'https' : 'http';
  const fullUrl = domain ? `${protocol}://${domain}` : null;

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Sistem
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Satu domain untuk seluruh sistem: frontend, backend API, WebSocket, dan CCTV streams. Semua terhubung melalui Nginx reverse proxy.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Domain</label>
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="cctv.desaanda.com" className="input mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Arahkan DNS A record ke IP server Anda, atau gunakan Cloudflare Tunnel</p>
          </div>

          {fullUrl && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1.5">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">Routing (Nginx Reverse Proxy)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">FE</span>
                  <span className="text-muted-foreground">{fullUrl}/</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-semibold">API</span>
                  <span className="text-muted-foreground">{fullUrl}/api/</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-semibold">WS</span>
                  <span className="text-muted-foreground">{fullUrl}/ws/</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-semibold">HLS</span>
                  <span className="text-muted-foreground">{fullUrl}/streams/</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pastikan <code className="px-1 py-0.5 bg-muted rounded">CORS_ORIGIN={fullUrl}</code> di environment backend.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SSL / HTTPS
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          HTTPS diperlukan untuk PWA, Service Worker, dan keamanan koneksi API + WebSocket.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'none', title: 'Tanpa SSL', desc: 'HTTP only (development)' },
              { value: 'letsencrypt', title: "Let's Encrypt", desc: 'SSL gratis & otomatis via Certbot' },
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
              <input type="password" value={cfToken} onChange={(e) => setCfToken(e.target.value)} placeholder="eyJhIjoiNjk..." className="input mt-1 font-mono" />
            </div>
          )}

          {sslMethod === 'letsencrypt' && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p>SSL akan otomatis di-generate saat domain sudah diarahkan ke IP server. Pastikan port 80 dan 443 terbuka.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tutorials */}
      <div className="space-y-2">
        <Tutorial title="Tutorial: Setting DNS untuk Domain Custom">
          <p><b>1.</b> Beli domain dari registrar (Niagahoster, Hostinger, Namecheap, Cloudflare)</p>
          <p><b>2.</b> Login ke panel DNS domain Anda</p>
          <p><b>3.</b> Tambahkan DNS record:</p>
          <div className="bg-muted p-2 rounded font-mono text-xs mt-1">
            <p>Type: A | Name: @ | Value: IP_SERVER_ANDA | TTL: 300</p>
            <p>Type: A | Name: www | Value: IP_SERVER_ANDA | TTL: 300</p>
          </div>
          <p className="mt-2"><b>4.</b> Tunggu propagasi DNS (5-30 menit)</p>
          <p><b>5.</b> Masukkan domain di form di atas, lalu simpan</p>
          <p><b>Cek propagasi:</b> <a href="https://dnschecker.org" target="_blank" rel="noreferrer" className="text-primary underline">dnschecker.org</a></p>
        </Tutorial>

        <Tutorial title="Tutorial: SSL Gratis & Otomatis (Let's Encrypt)">
          <p>SSL sudah <b>gratis dan otomatis</b> dengan Let's Encrypt. Caranya:</p>
          <p><b>1.</b> Pastikan domain sudah diarahkan ke IP server (lihat tutorial DNS di atas)</p>
          <p><b>2.</b> Pastikan port <code>80</code> dan <code>443</code> terbuka di firewall</p>
          <p><b>3.</b> Pilih <b>Let's Encrypt</b> di form SSL di atas, lalu simpan</p>
          <p><b>4.</b> Di Proxmox → klik container <code>desa-digital</code> → <b>Console</b>, lalu jalankan:</p>
          <div className="bg-muted p-2 rounded font-mono text-xs mt-1">
            <p>cd /opt/stacks/desa-digital</p>
            <p>bash scripts/setup-ssl.sh {domain || 'cctv.desaanda.com'} admin@email.com</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Jika menggunakan Portainer dari Git, folder stack biasanya di <code>/data/compose/</code> + ID stack. Bisa juga clone repo lalu jalankan script.</p>
          <p className="mt-2"><b>5.</b> SSL akan otomatis diperpanjang setiap 12 jam oleh Certbot</p>
          <p className="mt-1"><b>6.</b> Di Portainer → Stacks → <code>desa-digital</code> → <b>Editor</b> → update environment:</p>
          <div className="bg-muted p-2 rounded font-mono text-xs mt-1">
            CORS_ORIGIN=https://{domain || 'cctv.desaanda.com'}
          </div>
          <p className="mt-1"><b>7.</b> Klik <b>Update the stack</b></p>
        </Tutorial>

        <Tutorial title="Tutorial: Cloudflare Tunnel (Tanpa Buka Port)">
          <p><b>1.</b> Buat akun Cloudflare gratis di <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-primary underline">dash.cloudflare.com</a></p>
          <p><b>2.</b> Pindahkan DNS domain ke Cloudflare (ikuti panduan di dashboard)</p>
          <p><b>3.</b> Buka <a href="https://one.dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-primary underline">Cloudflare Zero Trust</a></p>
          <p><b>4.</b> Pergi ke <b>Networks → Tunnels → Create a tunnel</b></p>
          <p><b>5.</b> Pilih <b>Cloudflared</b>, beri nama tunnel</p>
          <p><b>6.</b> Copy token yang diberikan (mulai dengan <code>eyJ...</code>)</p>
          <p><b>7.</b> Paste token di form di atas, lalu simpan</p>
          <p><b>8.</b> Di konfigurasi tunnel, tambahkan Public Hostname:</p>
          <div className="bg-muted p-2 rounded font-mono text-xs mt-1">
            <p>Domain: {domain || 'cctv.desaanda.com'} → http://desa-digital-proxy:80</p>
          </div>
          <p className="mt-2"><b>9.</b> Di Portainer → Stacks → <code>desa-digital</code> → <b>Editor</b> → update environment:</p>
          <div className="bg-muted p-2 rounded font-mono text-xs mt-1">
            <p>CORS_ORIGIN=https://{domain || 'cctv.desaanda.com'}</p>
            <p>CLOUDFLARE_TUNNEL_TOKEN=eyJ...</p>
          </div>
          <p className="mt-1"><b>10.</b> Klik <b>Update the stack</b></p>
        </Tutorial>
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
          Terima notifikasi: kamera terputus/terhubung kembali (beserta daftar offline), dan backup database harian.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
            <span className="text-sm font-medium">Aktifkan Notifikasi Telegram</span>
          </div>

          <div>
            <label className="text-sm font-medium">Bot Token</label>
            <input type="password" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" className="input mt-1 font-mono" />
          </div>

          <div>
            <label className="text-sm font-medium">Chat ID</label>
            <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-1001234567890" className="input mt-1 font-mono" />
          </div>
        </div>
      </div>

      {/* Telegram Tutorial */}
      <Tutorial title="Tutorial: Cara Membuat Bot Telegram">
        <p><b>1.</b> Buka Telegram, cari <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary underline">@BotFather</a></p>
        <p><b>2.</b> Kirim <code>/newbot</code></p>
        <p><b>3.</b> Masukkan nama bot (contoh: <code>Desa Digital Alert</code>)</p>
        <p><b>4.</b> Masukkan username bot (contoh: <code>desadigital_alert_bot</code>)</p>
        <p><b>5.</b> Copy <b>Bot Token</b> yang diberikan, paste di form di atas</p>
        <p className="mt-2"><b>Mendapatkan Chat ID:</b></p>
        <p><b>6.</b> Buat grup Telegram, tambahkan bot ke grup</p>
        <p><b>7.</b> Kirim pesan apapun di grup</p>
        <p><b>8.</b> Buka: <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></p>
        <p><b>9.</b> Cari <code>"chat":{`{"id":-100xxx}`}</code> — itulah Chat ID Anda</p>
        <p className="mt-2"><b>Atau gunakan bot:</b> <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-primary underline">@userinfobot</a> / <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer" className="text-primary underline">@getmyid_bot</a></p>
      </Tutorial>

      <div className="flex gap-2 justify-end">
        <button onClick={() => testMutation.mutate()} disabled={!botToken || !chatId || testMutation.isPending} className="btn btn-secondary">
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
          <CheckCircle2 className="h-4 w-4" />Pesan test berhasil dikirim! Cek Telegram Anda.
        </div>
      )}
      {testMutation.isError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4" />Gagal mengirim pesan. Pastikan Bot Token dan Chat ID benar.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />Pengaturan Telegram disimpan
        </div>
      )}

      {/* Notification Toggles */}
      {enabled && <NotificationToggles />}
    </div>
  );
}

// ── Notification Toggles ──

interface NotifToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

function NotificationToggles() {
  const queryClient = useQueryClient();
  const { data: toggles, isLoading } = useQuery({
    queryKey: ['notification-toggles'],
    queryFn: () => api.get<NotifToggle[]>('/settings/notifications'),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => api.patch('/settings/notifications', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-toggles'] }),
  });

  const handleToggle = (key: string, enabled: boolean) => {
    mutation.mutate({ [key]: enabled });
  };

  if (isLoading) return <div className="card p-6 text-center text-muted-foreground">Memuat pengaturan notifikasi...</div>;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Pengaturan Notifikasi
      </h3>
      <p className="text-sm text-muted-foreground mb-4">Pilih notifikasi mana yang ingin dikirim ke Telegram</p>

      <div className="space-y-3">
        {toggles?.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => handleToggle(item.key, e.target.checked)}
                className="sr-only peer"
                disabled={mutation.isPending}
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        ))}
      </div>
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
                  <div className="text-xs text-muted-foreground">{svc.status === 'online' ? `${svc.responseMs}ms` : 'Offline'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monitoring HTTP</h3>
          <div className="flex gap-2">
            <button onClick={() => checkAllMutation.mutate()} disabled={checkAllMutation.isPending} className="btn btn-secondary text-sm">
              {checkAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Check Semua
            </button>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm">
              <Plus className="h-4 w-4 mr-1" />Tambah
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
                  <div className="text-xs text-muted-foreground truncate">{ep.method} {ep.url}</div>
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
                  <button onClick={() => checkOneMutation.mutate(ep.id)} disabled={checkOneMutation.isPending} className="btn btn-ghost p-2" title="Check sekarang">
                    <Play className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(ep.id)} disabled={deleteMutation.isPending} className="btn btn-ghost p-2 text-destructive" title="Hapus">
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
