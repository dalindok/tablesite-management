import { useState } from 'react';
import { useRequest } from 'ahooks';
import { restaurantsApi } from '../../api/restaurants';
import type { Restaurant } from '../../types';
import DataTable from '../../components/common/Table';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { RiDeleteBinLine, RiFilterLine, RiStore2Line, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import dayjs from 'dayjs';

function StatusBadge({ status }: { status: Restaurant['status'] }) {
  const m: Record<string, string> = {
    active: 'badge-success', inactive: 'badge-neutral',
    pending: 'badge-warning', suspended: 'badge-danger',
  };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

export default function AdminRestaurants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const { data, loading, refresh } = useRequest(
    () => restaurantsApi.adminGetAll({ page, limit: 10, search, status: statusFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, statusFilter] }
  );

  const restaurants = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleStatusChange = async (id: number, status: Restaurant['status']) => {
    setUpdating(id);
    try {
      await restaurantsApi.adminUpdateStatus(id, status);
      refresh();
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await restaurantsApi.adminDelete(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Restaurant',
      render: (r: Restaurant) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <RiStore2Line className="text-primary-500" size={18} />
          </div>
          <div>
            <p className="font-medium text-slate-800">{r.name}</p>
            <p className="text-xs text-slate-400">{r.city}</p>
          </div>
        </div>
      ),
    },
    { key: 'cuisineType', title: 'Cuisine' },
    { key: 'ownerName', title: 'Owner', render: (r: Restaurant) => r.ownerName || '—' },
    { key: 'capacity', title: 'Capacity', render: (r: Restaurant) => `${r.capacity} seats` },
    { key: 'status', title: 'Status', render: (r: Restaurant) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: 'Added', render: (r: Restaurant) => dayjs(r.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions',
      title: '',
      render: (r: Restaurant) => (
        <div className="flex items-center gap-1 justify-end">
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(r.id, 'active')}
                disabled={updating === r.id}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                title="Approve"
              >
                <RiCheckLine size={16} />
              </button>
              <button
                onClick={() => handleStatusChange(r.id, 'suspended')}
                disabled={updating === r.id}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Reject"
              >
                <RiCloseLine size={16} />
              </button>
            </>
          )}
          {r.status === 'active' && (
            <button
              onClick={() => handleStatusChange(r.id, 'inactive')}
              disabled={updating === r.id}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
              title="Deactivate"
            >
              <RiCloseLine size={16} />
            </button>
          )}
          {r.status === 'inactive' && (
            <button
              onClick={() => handleStatusChange(r.id, 'active')}
              disabled={updating === r.id}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
              title="Activate"
            >
              <RiCheckLine size={16} />
            </button>
          )}
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search restaurants…" />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <RiFilterLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={restaurants} loading={loading} rowKey="id" emptyText="No restaurants found" />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete "${deleteTarget?.name}"? This will also remove all related data.`}
        confirmLabel="Delete Restaurant"
      />
    </div>
  );
}
