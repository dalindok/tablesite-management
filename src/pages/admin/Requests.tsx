import { useState } from 'react';
import { useRequest } from 'ahooks';
import { requestsApi } from '../../api/requests';
import type { RestaurantRequest, ReviewRequestPayload } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import {
  RiFilterLine, RiEyeLine, RiCheckLine, RiCloseLine,
  RiUserLine, RiMailLine, RiAlertLine, RiCheckboxCircleLine,
  RiCloseCircleLine, RiTimeLine, RiStore2Line, RiArrowRightLine,
  RiCalendarLine, RiShieldUserLine, RiMessage2Line,
} from 'react-icons/ri';
import dayjs from 'dayjs';

function StatusBadge({ status }: { status: RestaurantRequest['status'] }) {
  const m: Record<string, string> = {
    pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger',
  };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

export default function AdminRequests() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View detail
  const [viewTarget, setViewTarget] = useState<RestaurantRequest | null>(null);

  // Review (approve / reject)
  const [reviewTarget, setReviewTarget] = useState<{
    req: RestaurantRequest; action: 'approved' | 'rejected';
  } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const { data, loading, refresh } = useRequest(
    () => requestsApi.adminGetAll({ page, limit: 10, search, status: statusFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, statusFilter] }
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openReview = (req: RestaurantRequest, action: 'approved' | 'rejected') => {
    setAdminNote('');
    setNoteError('');
    setReviewTarget({ req, action });
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    if (!adminNote.trim()) { setNoteError('Please provide a note to the owner.'); return; }
    setReviewing(true);
    try {
      const payload: ReviewRequestPayload = {
        status: reviewTarget.action,
        adminNote: adminNote.trim(),
      };
      await requestsApi.adminReview(reviewTarget.req.id, payload);
      setReviewTarget(null);
      refresh();
    } catch (e: any) {
      setNoteError(e?.response?.data?.message ?? 'Error processing request.');
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      key: 'owner',
      title: 'Owner',
      render: (r: RestaurantRequest) => (
        <div>
          <p className="font-medium text-slate-800">{r.ownerName}</p>
          <p className="text-xs text-slate-400">{r.ownerEmail}</p>
        </div>
      ),
    },
    {
      key: 'counts',
      title: 'Request',
      render: (r: RestaurantRequest) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-slate-700">{r.currentCount}</span>
          <RiArrowRightLine className="text-slate-400" size={14} />
          <span className="font-semibold text-primary-600">{r.requestedCount}</span>
          <span className="text-slate-400 text-xs">restaurants</span>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (r: RestaurantRequest) => (
        <p className="text-sm text-slate-600 max-w-xs truncate">{r.reason}</p>
      ),
    },
    { key: 'status', title: 'Status', render: (r: RestaurantRequest) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: 'Submitted', render: (r: RestaurantRequest) => dayjs(r.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions',
      title: '',
      render: (r: RestaurantRequest) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => setViewTarget(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="View Details"
          >
            <RiEyeLine size={16} />
          </button>
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => openReview(r, 'approved')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                title="Approve"
              >
                <RiCheckLine size={16} />
              </button>
              <button
                onClick={() => openReview(r, 'rejected')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Reject"
              >
                <RiCloseLine size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Shared detail body (used in both view & inside review modal) ───────────
  const renderRequestSummary = (r: RestaurantRequest) => (
    <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="text-center">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Current</p>
        <p className="text-2xl font-bold text-slate-700">{r.currentCount}</p>
        <p className="text-xs text-slate-400">restaurants</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <RiArrowRightLine className="text-primary-400" size={22} />
      </div>
      <div className="text-center">
        <p className="text-xs text-primary-500 font-medium uppercase tracking-wider mb-1">Requested</p>
        <p className="text-2xl font-bold text-primary-600">{r.requestedCount}</p>
        <p className="text-xs text-primary-400">restaurants</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by owner…" />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <RiFilterLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={requests} loading={loading} rowKey="id" emptyText="No requests found" />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      {/* ── Request Details (read-only) ── */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Request Details" size="md">
        {viewTarget && (
          <div className="space-y-3">

            {/* Status banner */}
            {(() => {
              const cfg = {
                pending:  { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',  text: 'text-amber-800',   sub: 'Awaiting admin review' },
                approved: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500',text: 'text-emerald-800', sub: viewTarget.reviewedAt ? `Approved on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}` : 'Approved' },
                rejected: { bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',    text: 'text-red-800',     sub: viewTarget.reviewedAt ? `Rejected on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}` : 'Rejected' },
              };
              const c = cfg[viewTarget.status] ?? cfg.pending;
              return (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${c.bg} ${c.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <span className={`text-sm font-semibold capitalize ${c.text}`}>{viewTarget.status}</span>
                  </div>
                  <span className={`text-xs ${c.text} opacity-70`}>{c.sub}</span>
                </div>
              );
            })()}

            {/* Request counter */}
            {renderRequestSummary(viewTarget)}

            {/* Owner info */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <RiUserLine className="text-slate-400" size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Owner</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-700">
                      {(viewTarget.ownerName || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-slate-800">{viewTarget.ownerName || '—'}</p>
                </div>
                <div className="flex items-center gap-2.5 pl-1">
                  <RiMailLine className="text-blue-500 flex-shrink-0" size={15} />
                  <span className="text-sm text-slate-700">{viewTarget.ownerEmail || '—'}</span>
                </div>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <RiCalendarLine className="text-slate-400 flex-shrink-0" size={15} />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Submitted</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{dayjs(viewTarget.createdAt).format('MMM D, YYYY')}</p>
                </div>
              </div>
              {viewTarget.reviewedBy && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <RiShieldUserLine className="text-slate-400 flex-shrink-0" size={15} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reviewed By</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{viewTarget.reviewedBy}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Owner's reason */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-100">
                <RiMessage2Line className="text-amber-500" size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Owner's Reason</span>
              </div>
              <p className="px-4 py-3 text-sm text-amber-900 leading-relaxed max-h-32 overflow-y-auto">{viewTarget.reason}</p>
            </div>

            {/* Admin note */}
            {viewTarget.adminNote && (
              <div className={`rounded-xl overflow-hidden border ${
                viewTarget.status === 'approved'
                  ? 'border-emerald-200 bg-emerald-50'
                  : viewTarget.status === 'rejected'
                  ? 'border-red-200 bg-red-50'
                  : 'border-blue-200 bg-blue-50'
              }`}>
                <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${
                  viewTarget.status === 'approved'
                    ? 'border-emerald-100'
                    : viewTarget.status === 'rejected'
                    ? 'border-red-100'
                    : 'border-blue-100'
                }`}>
                  {viewTarget.status === 'approved'
                    ? <RiCheckboxCircleLine className="text-emerald-500" size={14} />
                    : viewTarget.status === 'rejected'
                    ? <RiCloseCircleLine className="text-red-500" size={14} />
                    : <RiAlertLine className="text-blue-500" size={14} />}
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    viewTarget.status === 'approved' ? 'text-emerald-600'
                    : viewTarget.status === 'rejected' ? 'text-red-600'
                    : 'text-blue-600'
                  }`}>Admin Note</span>
                </div>
                <p className={`px-4 py-3 text-sm leading-relaxed ${
                  viewTarget.status === 'approved' ? 'text-emerald-900'
                  : viewTarget.status === 'rejected' ? 'text-red-900'
                  : 'text-blue-900'
                }`}>{viewTarget.adminNote}</p>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* ── Approve / Reject confirmation modal ── */}
      {reviewTarget && (
        <Modal
          isOpen={!!reviewTarget}
          onClose={() => { if (!reviewing) setReviewTarget(null); }}
          title={reviewTarget.action === 'approved' ? 'Approve Request' : 'Reject Request'}
          size="sm"
          footer={
            <>
              <button className="btn-secondary" onClick={() => setReviewTarget(null)} disabled={reviewing}>
                Cancel
              </button>
              <button
                className={reviewTarget.action === 'approved' ? 'btn-success' : 'btn-danger'}
                onClick={handleReview}
                disabled={reviewing}
              >
                {reviewing
                  ? 'Processing…'
                  : reviewTarget.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </>
          }
        >
          <div className="space-y-4">

            {/* Confirmation banner */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${
              reviewTarget.action === 'approved'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {reviewTarget.action === 'approved'
                ? <RiCheckboxCircleLine className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                : <RiAlertLine className="text-red-500 flex-shrink-0 mt-0.5" size={18} />}
              <div>
                <p className={`text-sm font-semibold ${
                  reviewTarget.action === 'approved' ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {reviewTarget.action === 'approved' ? 'Approve' : 'Reject'} this request?
                </p>
                <p className={`text-sm mt-0.5 ${
                  reviewTarget.action === 'approved' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {reviewTarget.req.ownerName} · {reviewTarget.req.currentCount} → {reviewTarget.req.requestedCount} restaurants
                </p>
              </div>
            </div>

            {/* Request counter (compact) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                <RiStore2Line className="text-slate-400" size={13} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Request</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-medium">Current</p>
                  <p className="text-xl font-bold text-slate-700">{reviewTarget.req.currentCount}</p>
                </div>
                <RiArrowRightLine className="text-primary-400" size={18} />
                <div className="text-center">
                  <p className="text-xs text-primary-500 font-medium">Requested</p>
                  <p className="text-xl font-bold text-primary-600">{reviewTarget.req.requestedCount}</p>
                </div>
              </div>
            </div>

            {/* Owner reason (compact) */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-100">
                <RiMessage2Line className="text-amber-500" size={13} />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Owner's Reason</span>
              </div>
              <p className="px-3 py-2.5 text-sm text-amber-900 leading-relaxed max-h-24 overflow-y-auto">
                {reviewTarget.req.reason}
              </p>
            </div>

            {/* Admin note */}
            <div>
              <label className="label">
                Note to Owner <span className="text-red-400 ml-1">*</span>
              </label>
              <textarea
                className={`input-field resize-none ${noteError ? 'input-error' : ''}`}
                rows={3}
                placeholder={reviewTarget.action === 'approved'
                  ? 'e.g. Approved. Your restaurant limit has been increased to 5.'
                  : 'e.g. Please provide more details about your business plan before re-applying.'}
                value={adminNote}
                onChange={e => { setAdminNote(e.target.value); if (noteError) setNoteError(''); }}
              />
              {noteError && <p className="mt-1 text-xs text-red-500">{noteError}</p>}
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
