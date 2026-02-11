import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, ChevronDown, Check } from 'lucide-react';
import type { PaginatedResponse, User, RT } from '../../../types';

export const Route = createFileRoute('/_auth/admin/users')({
  component: UsersPage,
});

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => api.get<PaginatedResponse<User>>(`/users?page=${page}&limit=20${search ? `&search=${search}` : ''}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kelola User</h1>
          <p className="text-muted-foreground">Kelola data pengguna sistem</p>
        </div>
        <button onClick={() => { setEditingUser(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Tidak ada user</td></tr>
            ) : (
              data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.username}</td>
                  <td className="px-4 py-3"><span className="badge bg-primary/20 text-primary capitalize">{user.role.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`badge ${user.isActive ? 'badge-online' : 'badge-offline'}`}>{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingUser(user); setShowForm(true); }} className="btn btn-ghost p-2"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => deleteMutation.mutate(user.id)} disabled={deleteMutation.isPending} className="btn btn-ghost p-2 text-destructive">
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">Sebelumnya</button>
          <span className="text-sm text-muted-foreground">Halaman {page} dari {data.pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="btn btn-secondary">Selanjutnya</button>
        </div>
      )}

      {showForm && <UserForm user={editingUser} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'warga');
  const [rtId, setRtId] = useState(user?.rtId || '');

  const { data: rts } = useQuery({
    queryKey: ['rts', 'all'],
    queryFn: () => api.get<PaginatedResponse<RT>>('/rts?limit=100'),
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; username: string; password?: string; role: string; rtId?: string }) =>
      user ? api.patch(`/users/${user.id}`, data) : api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: { name: string; username: string; password?: string; role: string; rtId?: string } = { name, username, role };
    if (password) data.password = password;
    if (rtId) data.rtId = rtId;
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{user ? 'Edit User' : 'Tambah User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input mt-1" required pattern="^[a-z0-9_]+$" title="Hanya huruf kecil, angka, dan underscore" />
          </div>
          <div>
            <label className="text-sm font-medium">Password {user && '(kosongkan jika tidak diubah)'}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" {...(!user && { required: true })} minLength={8} />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'superadmin' | 'admin_rt' | 'warga')} className="input mt-1" required>
              <option value="superadmin">Superadmin</option>
              <option value="admin_rt">Admin RT</option>
              <option value="warga">Warga</option>
            </select>
          </div>
          {(role === 'admin_rt' || role === 'warga') && (
            <div>
              <label className="text-sm font-medium">Area (RT)</label>
              <SearchableSelect
                options={rts?.data || []}
                value={rtId}
                onChange={setRtId}
                placeholder="Pilih RT"
                required
              />
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

function SearchableSelect({ 
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
