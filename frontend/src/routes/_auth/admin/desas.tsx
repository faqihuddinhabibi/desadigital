import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import type { PaginatedResponse, Desa } from '../../../types';

export const Route = createFileRoute('/_auth/admin/desas')({
  component: DesasPage,
});

function DesasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingDesa, setEditingDesa] = useState<Desa | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['desas', { page, search }],
    queryFn: () => api.get<PaginatedResponse<Desa>>(`/desas?page=${page}&limit=20${search ? `&search=${search}` : ''}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/desas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['desas'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kelola Desa</h1>
          <p className="text-muted-foreground">Kelola data desa yang terdaftar</p>
        </div>
        <button onClick={() => { setEditingDesa(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Tambah Desa
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari desa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Alamat</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Dibuat</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Tidak ada desa</td></tr>
            ) : (
              data?.data.map((desa) => (
                <tr key={desa.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{desa.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{desa.address || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(desa.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingDesa(desa); setShowForm(true); }} className="btn btn-ghost p-2">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(desa.id)} disabled={deleteMutation.isPending} className="btn btn-ghost p-2 text-destructive">
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

      {showForm && <DesaForm desa={editingDesa} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function DesaForm({ desa, onClose }: { desa: Desa | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(desa?.name || '');
  const [address, setAddress] = useState(desa?.address || '');

  const mutation = useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      desa ? api.patch(`/desas/${desa.id}`, data) : api.post('/desas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desas'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, address: address || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">{desa ? 'Edit Desa' : 'Tambah Desa'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium">Alamat</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input mt-1" />
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
