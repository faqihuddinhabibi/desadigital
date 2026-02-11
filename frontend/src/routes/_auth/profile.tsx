import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_auth/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; password?: string }) =>
      api.patch(`/users/${user?.id}`, data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      setCurrentPassword('');
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

    if (name !== user?.name) {
      data.name = name;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Password baru tidak cocok' });
        return;
      }
      if (newPassword.length < 8) {
        setMessage({ type: 'error', text: 'Password minimal 8 karakter' });
        return;
      }
      data.password = newPassword;
    }

    if (Object.keys(data).length === 0) {
      setMessage({ type: 'error', text: 'Tidak ada perubahan' });
      return;
    }

    updateMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.username}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-accent/10 border border-accent/20 text-accent'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nama</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <input
              id="username"
              type="text"
              value={user?.username}
              className="input bg-muted"
              disabled
            />
            <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
          </div>

          <hr className="my-6" />

          <h3 className="font-medium">Ubah Password</h3>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">Password Baru</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="Kosongkan jika tidak ingin mengubah"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Konfirmasi Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Ulangi password baru"
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn btn-primary"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
