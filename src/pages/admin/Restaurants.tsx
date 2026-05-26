import { useState } from 'react';
import { useRequest } from 'ahooks';
import { restaurantsApi } from '../../api/restaurants';
import type { Restaurant } from '../../types';
import DataTable from '../../components/common/Table';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import {
  RiDeleteBinLine, RiFilterLine, RiStore2Line,
  RiCheckLine, RiCloseLine, RiEyeLine,
  RiAlertLine, RiMapPinLine, RiPhoneLine, RiMailLine,
  RiGlobalLine, RiUserLine, RiStarFill, RiTimeLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiParkingBoxLine,
  RiCalendarLine, RiShieldLine,
} from 'react-icons/ri';
import dayjs from 'dayjs';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Restaurant['status'] }) {
  const m: Record<string, string> = {
    active: 'badge-success', inactive: 'badge-neutral',
    pending: 'badge-warning', suspended: 'badge-danger',
  };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

function DetailRow({ icon, label, value, valueClass }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${valueClass ?? 'text-slate-800'}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ── Status action modal (deactivate / reactivate) ────────────────────────────
function StatusActionModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  restaurant,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  mode: 'deactivate' | 'reactivate';
  restaurant: Restaurant | null;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => { setReason(''); setError(''); onClose(); };

  const handleConfirm = () => {
    if (!reason.trim()) { setError('Please provide a reason.'); return; }
    onConfirm(reason.trim());
  };

  // Reset on open
  if (!isOpen) return null;

  const isDeactivate = mode === 'deactivate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isDeactivate ? 'Deactivate Restaurant' : 'Reactivate Restaurant'}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
          <button
            className={isDeactivate ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? (isDeactivate ? 'Deactivating…' : 'Reactivating…')
              : (isDeactivate ? 'Deactivate' : 'Reactivate')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${
          isDeactivate ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <RiAlertLine className={`flex-shrink-0 mt-0.5 ${isDeactivate ? 'text-amber-500' : 'text-emerald-500'}`} size={18} />
          <div>
            <p className={`text-sm font-semibold ${isDeactivate ? 'text-amber-800' : 'text-emerald-800'}`}>
              {isDeactivate ? 'Deactivate' : 'Reactivate'} "{restaurant?.name}"?
            </p>
            <p className={`text-sm mt-0.5 ${isDeactivate ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isDeactivate
                ? 'This restaurant will no longer accept new bookings.'
                : 'This restaurant will be set back to active and can accept bookings.'}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="label">
            {isDeactivate ? 'Reason for deactivation' : 'Reason for reactivation'}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            className={`input-field resize-none ${error ? 'input-error' : ''}`}
            rows={3}
            placeholder={isDeactivate
              ? 'e.g. Violation of terms, multiple complaints…'
              : 'e.g. Issue resolved, owner confirmed compliance…'}
            value={reason}
            onChange={e => { setReason(e.target.value); if (error) setError(''); }}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ── Read-only detail modal ────────────────────────────────────────────────────
function RestaurantDetailModal({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant | null;
  onClose: () => void;
}) {
  if (!restaurant) return null;

  const statusCfg: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    active:    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   dot: 'bg-amber-400' },
    inactive:  { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
    suspended: { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',     dot: 'bg-red-500' },
  };
  const sc = statusCfg[restaurant.status] ?? statusCfg.inactive;

  return (
    <Modal
      isOpen={!!restaurant}
      onClose={onClose}
      title="Restaurant Details"
      size="xl"
    >
      <div className="space-y-3">

        {/* Hero: cover image + name */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          {restaurant.coverImageUrl || restaurant.image ? (
            <img
              src={restaurant.coverImageUrl ?? restaurant.image}
              alt={restaurant.name}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-primary-50 flex items-center justify-center">
              <RiStore2Line className="text-primary-200" size={56} />
            </div>
          )}
          {/* Status pill over image */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${sc.bg} ${sc.border} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {restaurant.status}
          </div>
          {restaurant.isPopular && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-semibold">
              <RiStarFill size={11} /> Popular
            </div>
          )}
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <p className="text-white font-bold text-lg leading-tight">{restaurant.name}</p>
            <p className="text-white/70 text-xs">{restaurant.cuisineType} · {restaurant.city}</p>
          </div>
        </div>

        {/* Basic info */}
        <SectionCard title="Restaurant Info">
          <div className="col-span-2">
            <DetailRow
              icon={<RiStore2Line className="text-slate-400" size={15} />}
              label="Description"
              value={restaurant.description || 'No description'}
              valueClass="text-slate-600"
            />
          </div>
          <DetailRow
            icon={<RiTimeLine className="text-primary-500" size={15} />}
            label="Opening Hours"
            value={`${restaurant.openingTime} — ${restaurant.closingTime}`}
            valueClass="text-primary-700"
          />
          <DetailRow
            icon={<RiGroupLine className="text-emerald-500" size={15} />}
            label="Capacity"
            value={`${restaurant.capacity} seats`}
            valueClass="text-emerald-700"
          />
          {restaurant.priceRange && (
            <DetailRow
              icon={<RiMoneyDollarCircleLine className="text-slate-400" size={15} />}
              label="Price Range"
              value={{ LOW: '$ Low', MEDIUM: '$$ Medium', HIGH: '$$$ High' }[restaurant.priceRange] ?? restaurant.priceRange}
            />
          )}
          {restaurant.dressCode && (
            <DetailRow
              icon={<RiShieldLine className="text-slate-400" size={15} />}
              label="Dress Code"
              value={restaurant.dressCode}
            />
          )}
          {restaurant.parkingAvailable !== undefined && (
            <DetailRow
              icon={<RiParkingBoxLine className="text-slate-400" size={15} />}
              label="Parking"
              value={restaurant.parkingAvailable ? 'Available' : 'Not available'}
              valueClass={restaurant.parkingAvailable ? 'text-emerald-700' : 'text-slate-600'}
            />
          )}
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location">
          <div className="col-span-2">
            <DetailRow
              icon={<RiMapPinLine className="text-red-400" size={15} />}
              label="Address"
              value={[restaurant.address, restaurant.city, restaurant.state, restaurant.country, restaurant.postalCode]
                .filter(Boolean).join(', ')}
            />
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact">
          <DetailRow icon={<RiPhoneLine className="text-emerald-500" size={15} />} label="Phone" value={restaurant.phone} />
          <DetailRow icon={<RiMailLine className="text-blue-500" size={15} />} label="Email" value={restaurant.email} />
          {restaurant.website && (
            <div className="col-span-2">
              <DetailRow icon={<RiGlobalLine className="text-slate-400" size={15} />} label="Website" value={restaurant.website} />
            </div>
          )}
        </SectionCard>

        {/* Owner */}
        <SectionCard title="Owner">
          <DetailRow icon={<RiUserLine className="text-primary-500" size={15} />} label="Name" value={restaurant.ownerName} valueClass="text-primary-700" />
          <DetailRow icon={<RiMailLine className="text-blue-500" size={15} />} label="Email" value={(restaurant as any).ownerEmail} />
          {(restaurant as any).ownerPhone && (
            <DetailRow icon={<RiPhoneLine className="text-emerald-500" size={15} />} label="Phone" value={(restaurant as any).ownerPhone} />
          )}
          <DetailRow
            icon={<RiCalendarLine className="text-slate-400" size={15} />}
            label="Registered"
            value={dayjs(restaurant.createdAt).format('MMM D, YYYY')}
          />
        </SectionCard>

        {/* Booking settings */}
        {(restaurant.minBookingNotice !== undefined || restaurant.maxBookingDays !== undefined) && (
          <SectionCard title="Booking Settings">
            {restaurant.minBookingNotice !== undefined && (
              <DetailRow
                icon={<RiTimeLine className="text-slate-400" size={15} />}
                label="Min Notice"
                value={`${restaurant.minBookingNotice} min`}
              />
            )}
            {restaurant.maxBookingDays !== undefined && (
              <DetailRow
                icon={<RiCalendarLine className="text-slate-400" size={15} />}
                label="Max Days Ahead"
                value={`${restaurant.maxBookingDays} days`}
              />
            )}
            {restaurant.cancellationHours !== undefined && (
              <DetailRow
                icon={<RiTimeLine className="text-slate-400" size={15} />}
                label="Cancellation Window"
                value={`${restaurant.cancellationHours} hrs`}
              />
            )}
            {restaurant.depositRequired && (
              <DetailRow
                icon={<RiMoneyDollarCircleLine className="text-amber-500" size={15} />}
                label="Deposit Required"
                value={restaurant.depositAmount ? `$${Number(restaurant.depositAmount).toFixed(2)}` : 'Yes'}
                valueClass="text-amber-700"
              />
            )}
          </SectionCard>
        )}

        {/* Admin note (deactivation / reactivation reason) */}
        {restaurant.adminNote && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
              <RiAlertLine className="text-amber-500" size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Admin Note</span>
            </div>
            <p className="px-4 py-3 text-sm text-amber-900 leading-relaxed">{restaurant.adminNote}</p>
          </div>
        )}

      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminRestaurants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View detail
  const [viewTarget, setViewTarget] = useState<Restaurant | null>(null);

  // Status action (deactivate / reactivate)
  const [statusActionTarget, setStatusActionTarget] = useState<Restaurant | null>(null);
  const [statusActionMode, setStatusActionMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [statusActing, setStatusActing] = useState(false);

  // Quick actions (no reason needed: approve, reject pending)
  const [updating, setUpdating] = useState<number | null>(null);

  const { data, loading, refresh } = useRequest(
    () => restaurantsApi.adminGetAll({ page, limit: 10, search, status: statusFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, statusFilter] }
  );

  const restaurants = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleQuickStatus = async (id: number, status: Restaurant['status']) => {
    setUpdating(id);
    try {
      await restaurantsApi.adminUpdateStatus(id, status);
      refresh();
    } finally {
      setUpdating(null);
    }
  };

  const openStatusAction = (r: Restaurant, mode: 'deactivate' | 'reactivate') => {
    setStatusActionTarget(r);
    setStatusActionMode(mode);
  };

  const handleStatusAction = async (reason: string) => {
    if (!statusActionTarget) return;
    setStatusActing(true);
    try {
      const newStatus: Restaurant['status'] = statusActionMode === 'deactivate' ? 'inactive' : 'active';
      await restaurantsApi.adminUpdateStatus(statusActionTarget.id, newStatus, reason);
      setStatusActionTarget(null);
      refresh();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setStatusActing(false);
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
          {r.coverImageUrl || r.image ? (
            <img src={r.coverImageUrl ?? r.image} alt={r.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <RiStore2Line className="text-primary-500" size={18} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-slate-800">{r.name}</p>
              {r.isPopular && <RiStarFill size={11} className="text-amber-400" />}
            </div>
            <p className="text-xs text-slate-400">{r.cuisineType} · {r.city}</p>
          </div>
        </div>
      ),
    },
    { key: 'ownerName', title: 'Owner', render: (r: Restaurant) => r.ownerName || '—' },
    { key: 'capacity', title: 'Capacity', render: (r: Restaurant) => `${r.capacity} seats` },
    { key: 'status', title: 'Status', render: (r: Restaurant) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: 'Added', render: (r: Restaurant) => dayjs(r.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions',
      title: '',
      render: (r: Restaurant) => (
        <div className="flex items-center gap-1 justify-end">
          {/* View detail */}
          <button
            onClick={() => setViewTarget(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="View Details"
          >
            <RiEyeLine size={16} />
          </button>

          {/* Pending: approve / reject (no reason needed) */}
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => handleQuickStatus(r.id, 'active')}
                disabled={updating === r.id}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                title="Approve"
              >
                <RiCheckLine size={16} />
              </button>
              <button
                onClick={() => handleQuickStatus(r.id, 'suspended')}
                disabled={updating === r.id}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Reject"
              >
                <RiCloseLine size={16} />
              </button>
            </>
          )}

          {/* Active: deactivate with reason */}
          {r.status === 'active' && (
            <button
              onClick={() => openStatusAction(r, 'deactivate')}
              disabled={updating === r.id}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
              title="Deactivate"
            >
              <RiCloseLine size={16} />
            </button>
          )}

          {/* Inactive: reactivate (no reason needed) */}
          {r.status === 'inactive' && (
            <button
              onClick={() => handleQuickStatus(r.id, 'active')}
              disabled={updating === r.id}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
              title="Reactivate"
            >
              <RiCheckLine size={16} />
            </button>
          )}

          {/* Suspended: reactivate with reason */}
          {r.status === 'suspended' && (
            <button
              onClick={() => openStatusAction(r, 'reactivate')}
              disabled={updating === r.id}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
              title="Reactivate"
            >
              <RiCheckLine size={16} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => setDeleteTarget(r)}
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

      {/* View detail (read-only) */}
      <RestaurantDetailModal restaurant={viewTarget} onClose={() => setViewTarget(null)} />

      {/* Deactivate / Reactivate with reason */}
      <StatusActionModal
        isOpen={!!statusActionTarget}
        onClose={() => setStatusActionTarget(null)}
        onConfirm={handleStatusAction}
        mode={statusActionMode}
        restaurant={statusActionTarget}
        loading={statusActing}
      />

      {/* Delete confirm */}
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
