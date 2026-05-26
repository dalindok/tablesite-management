import { useState } from 'react';
import { useRequest } from 'ahooks';
import { bookingsApi } from '../../api/bookings';
import type { Booking, BookingStatus } from '../../types';
import DataTable from '../../components/common/Table';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import {
  RiFilterLine, RiEyeLine, RiDeleteBinLine, RiCalendarLine,
  RiAlertLine, RiTimeLine, RiGroupLine, RiTableLine, RiStore2Line,
  RiPhoneLine, RiMailLine, RiUserLine, RiHistoryLine,
  RiMessage2Line, RiCloseCircleLine,
} from 'react-icons/ri';
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

  // ── Cancel confirmation state ──
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

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

  const openCancelDialog = (b: Booking) => {
    setCancelTarget(b);
    setCancelReason('');
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    try {
      await bookingsApi.adminUpdate(cancelTarget.id, {
        status: 'cancelled',
        cancellationReason: cancelReason.trim(),
      });
      setCancelTarget(null);
      refresh();
    } catch (e: any) {
      setCancelError(e?.response?.data?.message ?? 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
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
          <p className="text-xs text-slate-400">{b.customerPhone || b.customerEmail}</p>
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
          <button
            onClick={() => setViewTarget(b)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="View Details"
          >
            <RiEyeLine size={16} />
          </button>

          {/* Pending: confirm or cancel */}
          {b.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(b.id, 'confirmed')}
                disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => openCancelDialog(b)}
                disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {/* Confirmed: complete, no-show, or cancel */}
          {b.status === 'confirmed' && (
            <>
              <button
                onClick={() => handleStatusChange(b.id, 'completed')}
                disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() => handleStatusChange(b.id, 'no_show')}
                disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-medium transition-colors"
              >
                No Show
              </button>
              <button
                onClick={() => openCancelDialog(b)}
                disabled={updating === b.id}
                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={() => setDeleteTarget(b)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete"
          >
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

      {/* ── View Booking Detail ── */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Booking Details" size="lg">
        {viewTarget && (
          <div className="space-y-3">

            {/* ── Status banner ── */}
            {(() => {
              const cfg: Record<BookingStatus, { bg: string; text: string; border: string; dot: string }> = {
                pending:   { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   dot: 'bg-amber-400' },
                confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
                cancelled: { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',     dot: 'bg-red-500' },
                completed: { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200',    dot: 'bg-blue-500' },
                no_show:   { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
              };
              const c = cfg[viewTarget.status] ?? cfg.pending;
              return (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${c.bg} ${c.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <span className={`text-sm font-semibold capitalize ${c.text}`}>
                      {viewTarget.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">#{viewTarget.id}</span>
                </div>
              );
            })()}

            {/* ── Booking Info ── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <RiCalendarLine className="text-slate-400" size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Booking Info</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">

                {/* Date — highlighted */}
                <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-primary-700 leading-none">
                      {dayjs(viewTarget.date).format('MMM').toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary-700 leading-none">
                      {dayjs(viewTarget.date).format('D')}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-primary-800">
                      {dayjs(viewTarget.date).format('dddd, MMMM D, YYYY')}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RiTimeLine className="text-primary-500" size={13} />
                      <span className="text-sm text-primary-600 font-medium">{viewTarget.time}</span>
                    </div>
                  </div>
                </div>

                {/* Party size */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <RiGroupLine className="text-emerald-600" size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Party Size</p>
                    <p className="text-base font-bold text-emerald-800">{viewTarget.partySize} guests</p>
                  </div>
                </div>

                {/* Table */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <RiTableLine className="text-slate-500" size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Table</p>
                    <p className="text-base font-bold text-slate-700">
                      {viewTarget.tableNumber ? `#${viewTarget.tableNumber}` : 'Not assigned'}
                    </p>
                  </div>
                </div>

                {/* Restaurant */}
                <div className="flex items-center gap-2">
                  <RiStore2Line className="text-slate-400 flex-shrink-0" size={15} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Restaurant</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{viewTarget.restaurantName || '—'}</p>
                  </div>
                </div>

                {/* Booked on */}
                <div className="flex items-center gap-2">
                  <RiHistoryLine className="text-slate-400 flex-shrink-0" size={15} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Booked On</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {viewTarget.createdAt ? dayjs(viewTarget.createdAt).format('MMM D, YYYY · HH:mm') : '—'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Contact Details ── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <RiUserLine className="text-slate-400" size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact Details</span>
              </div>
              <div className="p-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-700">
                      {(viewTarget.contactCustomerName || viewTarget.customerName || '?')
                        .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-slate-800">
                    {viewTarget.contactCustomerName || viewTarget.customerName || '—'}
                  </p>
                </div>
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2.5">
                    <RiPhoneLine className="text-emerald-500 flex-shrink-0" size={15} />
                    <span className="text-sm text-slate-700">
                      {viewTarget.contactCustomerPhone || viewTarget.customerPhone || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <RiMailLine className="text-blue-500 flex-shrink-0" size={15} />
                    <span className="text-sm text-slate-700 break-all">
                      {viewTarget.contactCustomerEmail || viewTarget.customerEmail || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Account (booked by) ── */}
            {viewTarget.bookingUserName && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <RiUserLine className="text-slate-400" size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Booked By (Account)</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{viewTarget.bookingUserName}</p>
                </div>
              </div>
            )}

            {/* ── Special Requests ── */}
            {viewTarget.specialRequests && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-100">
                  <RiMessage2Line className="text-amber-500" size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Special Requests</span>
                </div>
                <p className="px-4 py-3 text-sm text-amber-900 leading-relaxed">{viewTarget.specialRequests}</p>
              </div>
            )}

            {/* ── Cancellation Reason ── */}
            {viewTarget.cancellationReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
                  <RiCloseCircleLine className="text-red-500" size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Cancellation Reason</span>
                </div>
                <p className="px-4 py-3 text-sm text-red-900 leading-relaxed">{viewTarget.cancellationReason}</p>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* ── Cancel Confirmation Modal ── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => { if (!cancelling) setCancelTarget(null); }}
        title="Cancel Booking"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Keep Booking
            </button>
            <button className="btn-danger" onClick={handleConfirmCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </>
        }
      >
        {cancelTarget && (
          <div className="space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <RiAlertLine className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-800">Cancel this booking?</p>
                <p className="text-sm text-red-600 mt-0.5">
                  {cancelTarget.customerName} · {dayjs(cancelTarget.date).format('MMM D')} at {cancelTarget.time} · {cancelTarget.partySize} guests
                </p>
              </div>
            </div>

            {/* Reason input */}
            <div>
              <label className="label">
                Reason for cancellation <span className="text-red-400">*</span>
              </label>
              <textarea
                className={`input-field resize-none ${cancelError ? 'input-error' : ''}`}
                rows={3}
                placeholder="e.g. Restaurant unavailable, overbooking, policy violation…"
                value={cancelReason}
                onChange={e => { setCancelReason(e.target.value); if (cancelError) setCancelError(''); }}
              />
              {cancelError && <p className="mt-1 text-xs text-red-500">{cancelError}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ── */}
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
