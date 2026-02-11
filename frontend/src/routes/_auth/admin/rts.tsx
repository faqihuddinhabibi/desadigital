import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import type { PaginatedResponse, RT, Desa } from '../../../types';

export const Route = createFileRoute('/_auth/admin/rts')({
  component: RtsPage,
});

function RtsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingRt, setEditingRt] = useState<RT | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rts', { page, search }],
    queryFn: () => api.get<PaginatedResponse<RT>>(`/rts?page=${page}&limit=20${search ? `&search=${search}` : ''}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rts'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kelola RT</h1>
          <p className="text-muted-foreground">Kelola data RT yang terdaftar</p>
        </div>
        <button onClick={() => { setEditingRt(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Tambah RT
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Cari RT..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-medium">RT/RW</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Desa</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Tidak ada RT</td></tr>
            ) : (
              data?.data.map((rt) => (
                <tr key={rt.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{rt.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">RT {rt.rtNumber}{rt.rwNumber ? `/RW ${rt.rwNumber}` : ''}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{rt.desaName || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingRt(rt); setShowForm(true); }} className="btn btn-ghost p-2"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => deleteMutation.mutate(rt.id)} disabled={deleteMutation.isPending} className="btn btn-ghost p-2 text-destructive">
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

      {showForm && <RtForm rt={editingRt} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function RtForm({ rt, onClose }: { rt: RT | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(rt?.name || '');
  const [rtNumber, setRtNumber] = useState(rt?.rtNumber?.toString() || '');
  const [rwNumber, setRwNumber] = useState(rt?.rwNumber?.toString() || '');
  const [desaId, setDesaId] = useState(rt?.desaId || '');

  const { data: desas } = useQuery({
    queryKey: ['desas', 'all'],
    queryFn: () => api.get<PaginatedResponse<Desa>>('/desas?limit=100'),
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; rtNumber: number; rwNumber?: number; desaId: string }) =>
      rt ? api.patch(`/rts/${rt.id}`, data) : api.post('/rts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, rtNumber: parseInt(rtNumber), rwNumber: rwNumber ? parseInt(rwNumber) : undefined, desaId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">{rt ? 'Edit RT' : 'Tambah RT'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Desa</label>
            <select value={desaId} onChange={(e) => setDesaId(e.target.value)} className="input mt-1" required>
              <option value="">Pilih Desa</option>
              {desas?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nomor RT</label>
              <input type="number" value={rtNumber} onChange={(e) => setRtNumber(e.target.value)} className="input mt-1" required min={1} />
            </div>
            <div>
              <label className="text-sm font-medium">Nomor RW</label>
              <input type="number" value={rwNumber} onChange={(e) => setRwNumber(e.target.value)} className="input mt-1" min={1} />
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
