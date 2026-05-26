import { useState } from 'react';
import { useRequest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { requestsApi } from '../../api/requests';
import type { RestaurantRequest, ReviewRequestPayload } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { RiFilterLine, RiEyeLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import dayjs from 'dayjs';

function StatusBadge({ status }: { status: RestaurantRequest['status'] }) {
  const m: Record<string, string> = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

interface ReviewForm {
  adminNote: string;
}

export default function AdminRequests() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewTarget, setViewTarget] = useState<RestaurantRequest | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ req: RestaurantRequest; action: 'approved' | 'rejected' } | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const { data, loading, refresh } = useRequest(
    () => requestsApi.adminGetAll({ page, limit: 10, search, status: statusFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, statusFilter] }
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewForm>();

  const openReview = (req: RestaurantRequest, action: 'approved' | 'rejected') => {
    reset({ adminNote: '' });
    setReviewTarget({ req, action });
  };

  const onReview = async (form: ReviewForm) => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      const payload: ReviewRequestPayload = { status: reviewTarget.action, adminNote: form.adminNote };
      await requestsApi.adminReview(reviewTarget.req.id, payload);
      setReviewTarget(null);
      refresh();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Error');
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
        <span className="text-sm">
          <span className="font-medium text-slate-700">{r.currentCount}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="font-medium text-primary-600">{r.requestedCount}</span>
          <span className="text-slate-400 ml-1 text-xs">restaurants</span>
        </span>
      ),
    },
    { key: 'reason', title: 'Reason', render: (r: RestaurantRequest) => (
      <p className="text-sm text-slate-600 max-w-xs truncate">{r.reason}</p>
    )},
    { key: 'status', title: 'Status', render: (r: RestaurantRequest) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: 'Submitted', render: (r: RestaurantRequest) => dayjs(r.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions',
      title: '',
      render: (r: RestaurantRequest) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setViewTarget(r)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500">
            <RiEyeLine size={16} />
          </button>
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => openReview(r, 'approved')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                title="Approve"
              >
                <RiCheckLine size={16} />
              </button>
              <button
                onClick={() => openReview(r, 'rejected')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
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

      {/* View modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Request Details" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Owner', value: viewTarget.ownerName },
                { label: 'Email', value: viewTarget.ownerEmail },
                { label: 'Current Restaurants', value: viewTarget.currentCount },
                { label: 'Requested Limit', value: viewTarget.requestedCount },
                { label: 'Submitted', value: dayjs(viewTarget.createdAt).format('MMMM D, YYYY') },
                { label: 'Status', value: viewTarget.status },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm text-slate-800 mt-1">{f.value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reason</p>
                <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg leading-relaxed">{viewTarget.reason}</p>
              </div>
              {viewTarget.adminNote && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Admin Note</p>
                  <p className="text-sm text-slate-700 mt-1 p-3 bg-blue-50 rounded-lg leading-relaxed">{viewTarget.adminNote}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={reviewTarget?.action === 'approved' ? 'Approve Request' : 'Reject Request'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReviewTarget(null)} disabled={reviewing}>Cancel</button>
            <button
              className={reviewTarget?.action === 'approved' ? 'btn-success' : 'btn-danger'}
              onClick={handleSubmit(onReview)}
              disabled={reviewing}
            >
              {reviewing ? 'Processing…' : reviewTarget?.action === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onReview)} className="space-y-4">
          <div className={`p-4 rounded-xl border ${reviewTarget?.action === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-sm font-medium text-slate-700">
              {reviewTarget?.action === 'approved' ? 'Approving' : 'Rejecting'} request from{' '}
              <span className="font-semibold">{reviewTarget?.req.ownerName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {reviewTarget?.req.currentCount} → {reviewTarget?.req.requestedCount} restaurants
            </p>
          </div>
          <div>
            <label className="label">
              Note / Reason <span className="text-slate-400">(required)</span>
            </label>
            <textarea
              className={`input-field resize-none ${errors.adminNote ? 'input-error' : ''}`}
              rows={4}
              placeholder={reviewTarget?.action === 'approved'
                ? 'e.g. Approved. Your limit has been increased.'
                : 'e.g. Please provide more details about your business plan.'}
              {...register('adminNote', { required: 'A note is required' })}
            />
            {errors.adminNote && <p className="mt-1 text-xs text-red-500">{errors.adminNote.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
