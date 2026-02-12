import { createFileRoute, Outlet, redirect, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  Menu,
  X,
  Home,
  Camera,
  Users,
  MapPin,
  Building,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useBranding } from '../hooks/useBranding';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = useAuth();
  const isRtOrWarga = user?.role === 'admin_rt' || user?.role === 'warga';

  if (isRtOrWarga) {
    return <RTWargaLayout />;
  }

  return <SuperadminLayout />;
}

// ── RT / Warga Layout: Clean header, no sidebar ──
function RTWargaLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const branding = useBranding();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 sm:px-8 py-3 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.app_name || 'Logo'} className="h-9 w-9 object-contain rounded-lg" />
          ) : (
            <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold leading-tight tracking-tight uppercase text-primary">{branding.app_name || 'Desa Digital'}</h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-widest">{branding.site_subtitle || 'BY FIBERNODE INTERNET'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm font-semibold tabular-nums">
            <Clock />
          </div>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
          >
            <User className="h-5 w-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {showProfile && <ProfilePopup user={user} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

// ── Live Clock Component ──
function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span>{time}</span>;
}

// ── Profile Popup Modal ──
function ProfilePopup({ user, onClose }: { user: { id: string; name: string; username: string; role: string } | null; onClose: () => void }) {
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { name?: string; password?: string }) =>
      api.patch(`/users/${user?.id}`, data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const data: { name?: string; password?: string } = {};
    if (name !== user?.name) data.name = name;
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Password baru tidak cocok' });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
        return;
      }
      data.password = newPassword;
    }
    if (Object.keys(data).length === 0) {
      setMessage({ type: 'error', text: 'Tidak ada perubahan' });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Profil</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">@{user?.username} &middot; {user?.role.replace('_', ' ')}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`px-3 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
              {message.text}
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium">Password Baru</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input mt-1" placeholder="Kosongkan jika tidak diubah" minLength={6} />
          </div>
          {newPassword && (
            <div>
              <label className="text-sm font-medium">Konfirmasi Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input mt-1" placeholder="Ulangi password baru" />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
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

// ── Superadmin Layout: Sidebar + Header ──
function SuperadminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const branding = useBranding();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard', roles: ['superadmin'] },
    { to: '/cameras' as const, icon: Camera, label: 'Kamera', roles: ['superadmin'] },
    { to: '/admin/desas' as const, icon: MapPin, label: 'Kelola Desa', roles: ['superadmin'] },
    { to: '/admin/rts' as const, icon: Building, label: 'Kelola RT', roles: ['superadmin'] },
    { to: '/admin/users' as const, icon: Users, label: 'Kelola User', roles: ['superadmin'] },
    { to: '/admin/settings' as const, icon: Settings, label: 'Pengaturan', roles: ['superadmin'] },
  ];

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 bg-[#ED1C24] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                )}
                <span className="font-semibold">{branding.app_name || 'Desa Digital'}</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex btn btn-ghost p-1"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-muted',
                  '[&.active]:bg-primary [&.active]:text-primary-foreground'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-2 border-t space-y-1">
            <Link
              to="/profile"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-muted',
                '[&.active]:bg-primary [&.active]:text-primary-foreground'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Profil</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-ghost p-2"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="btn btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
