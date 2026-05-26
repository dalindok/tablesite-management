import { useState } from 'react';
import { useRequest } from 'ahooks';
import { bookingsApi } from '../../api/bookings';
import type { Booking, BookingStatus } from '../../types';
import DataTable from '../../components/common/Table';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import { RiFilterLine, RiEyeLine, RiDeleteBinLine, RiCalendarLine } from 'react-icons/ri';
import dayjs from 'dayjs';

function StatusBadge({ status }: { status: BookingStatus }) {
  const m: Record<string, string> = {
    pending: 'badge-warning', confirmed: 'badge-success',
    cancelled: 'badge-danger', completed: 'badge-info', no_show: 'badge-neutral',
  };
  return <span className={m[status] ?? 'badge-neutral'}>{status.replace('_', ' ')}</span>;
}

export default function AdminBookings() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const { data, loading, refresh } = useRequest(
    () => bookingsApi.adminGetAll({ page, limit: 10, search, status: statusFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, statusFilter] }
  );

  const bookings = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    setUpdating(id);
    try {
      await bookingsApi.adminUpdate(id, { status });
      refresh();
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bookingsApi.adminDelete(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'customer',
      title: 'Customer',
      render: (b: Booking) => (
        <div>
          <p className="font-medium text-slate-800">{b.customerName}</p>
          <p className="text-xs text-slate-400">{b.customerEmail}</p>
        </div>
      ),
    },
    { key: 'restaurantName', title: 'Restaurant', render: (b: Booking) => b.restaurantName || '—' },
    {
      key: 'datetime',
      title: 'Date & Time',
      render: (b: Booking) => (
        <div className="flex items-center gap-1 text-sm">
          <RiCalendarLine className="text-slate-400" size={14} />
          {dayjs(b.date).format('MMM D, YYYY')} at {b.time}
        </div>
      ),
    },
    { key: 'partySize', title: 'Party', render: (b: Booking) => `${b.partySize} guests` },
    { key: 'status', title: 'Status', render: (b: Booking) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      title: '',
      render: (b: Booking) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setViewTarget(b)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500">
            <RiEyeLine size={16} />
          </button>
          {b.status === 'pending' && (
            <>
              <button onClick={() => handleStatusChange(b.id, 'confirmed')} disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">
                Confirm
              </button>
              <button onClick={() => handleStatusChange(b.id, 'cancelled')} disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">
                Cancel
              </button>
            </>
          )}
          <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by customer or restaurant…" />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
          </select>
          <RiFilterLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={bookings} loading={loading} rowKey="id" emptyText="No bookings found" />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      {/* View detail */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Booking Details" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Customer', value: viewTarget.customerName },
                { label: 'Email', value: viewTarget.customerEmail },
                { label: 'Phone', value: viewTarget.customerPhone || '—' },
                { label: 'Restaurant', value: viewTarget.restaurantName },
                { label: 'Date', value: dayjs(viewTarget.date).format('MMMM D, YYYY') },
                { label: 'Time', value: viewTarget.time },
                { label: 'Party Size', value: `${viewTarget.partySize} guests` },
                { label: 'Table', value: viewTarget.tableNumber ? `#${viewTarget.tableNumber}` : 'Not assigned' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm text-slate-800 mt-1">{f.value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</p>
                <div className="mt-1"><StatusBadge status={viewTarget.status} /></div>
              </div>
              {viewTarget.specialRequests && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Special Requests</p>
                  <p className="text-sm text-slate-800 mt-1">{viewTarget.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete booking #${deleteTarget?.id}? This action cannot be undone.`}
        confirmLabel="Delete Booking"
      />
    </div>
  );
}
