import { useState } from 'react';
import { useRequest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { requestsApi } from '../../api/requests';
import type { RestaurantRequest } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import {
  RiAddLine, RiEyeLine, RiAlertLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine,
  RiArrowRightLine, RiCalendarLine, RiMessage2Line, RiShieldUserLine,
} from 'react-icons/ri';
import dayjs from 'dayjs';

function StatusBadge({ status }: { status: RestaurantRequest['status'] }) {
  const m: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: { cls: 'badge-warning', icon: <RiTimeLine size={12} /> },
    approved: { cls: 'badge-success', icon: <RiCheckboxCircleLine size={12} /> },
    rejected: { cls: 'badge-danger', icon: <RiCloseCircleLine size={12} /> },
  };
  const conf = m[status] ?? { cls: 'badge-neutral', icon: null };
  return (
    <span className={`${conf.cls} flex items-center gap-1`}>
      {conf.icon}{status}
    </span>
  );
}

interface RequestForm {
  requestedCount: number;
  reason: string;
}

export default function OwnerRequests() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<RestaurantRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, refresh } = useRequest(
    () => requestsApi.ownerGetAll({ page, limit: 10 }).then(r => r.data.data),
    { refreshDeps: [page] }
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasPending = requests.some(r => r.status === 'pending');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestForm>({
    defaultValues: { requestedCount: 4, reason: '' },
  });

  const onSubmit = async (form: RequestForm) => {
    setSaving(true);
    try {
      await requestsApi.ownerCreate({ requestedCount: Number(form.requestedCount), reason: form.reason });
      setFormOpen(false);
      reset();
      refresh();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Error submitting request');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'request',
      title: 'Request',
      render: (r: RestaurantRequest) => (
        <div>
          <p className="font-medium text-slate-800">{r.currentCount} → {r.requestedCount} restaurants</p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{r.reason}</p>
        </div>
      ),
    },
    { key: 'status', title: 'Status', render: (r: RestaurantRequest) => <StatusBadge status={r.status} /> },
    {
      key: 'adminNote',
      title: 'Admin Response',
      render: (r: RestaurantRequest) => r.adminNote
        ? <p className="text-sm text-slate-600 max-w-xs truncate">{r.adminNote}</p>
        : <span className="text-slate-300 text-sm">—</span>,
    },
    { key: 'createdAt', title: 'Submitted', render: (r: RestaurantRequest) => dayjs(r.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions', title: '',
      render: (r: RestaurantRequest) => (
        <button onClick={() => setViewTarget(r)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500">
          <RiEyeLine size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <RiAlertLine className="text-primary-500" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Need more restaurants?</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Each owner can manage up to 3 restaurants by default. If you need more, submit a request — the admin will approve or reject with a reason.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => { reset({ requestedCount: 4, reason: '' }); setFormOpen(true); }}
              disabled={hasPending}
              className="btn-primary"
              title={hasPending ? 'You have a pending request' : ''}
            >
              <RiAddLine size={16} />
              New Request
            </button>
          </div>
        </div>
        {hasPending && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
            You have a pending request. Please wait for admin review before submitting another.
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">My Requests</h3>
        </div>
        <DataTable columns={columns} data={requests} loading={loading} rowKey="id" emptyText="No requests submitted yet" />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      {/* New request modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Request Additional Restaurant Slot"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Requested Restaurant Limit</label>
            <input
              type="number"
              min={4}
              max={20}
              className={`input-field ${errors.requestedCount ? 'input-error' : ''}`}
              {...register('requestedCount', { required: true, min: { value: 4, message: 'Min 4 (you already have 3)' }, valueAsNumber: true })}
            />
            {errors.requestedCount && <p className="mt-1 text-xs text-red-500">{errors.requestedCount.message}</p>}
            <p className="mt-1 text-xs text-slate-400">Enter the total number of restaurants you need (e.g. 5)</p>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea
              className={`input-field resize-none ${errors.reason ? 'input-error' : ''}`}
              rows={5}
              placeholder="Explain why you need more restaurants. Include your business plan, location strategy, etc."
              {...register('reason', { required: 'Reason is required', minLength: { value: 30, message: 'Please provide at least 30 characters' } })}
            />
            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>}
          </div>
        </form>
      </Modal>

      {/* View detail modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Request Details" size="md">
        {viewTarget && (
          <div className="space-y-3">

            {/* Status banner */}
            {(() => {
              const cfg = {
                pending:  { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   text: 'text-amber-800',   sub: 'Awaiting admin review' },
                approved: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800', sub: viewTarget.reviewedAt ? `Approved on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}` : 'Approved' },
                rejected: { bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     text: 'text-red-800',     sub: viewTarget.reviewedAt ? `Rejected on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}` : 'Rejected' },
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
            <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Current</p>
                <p className="text-2xl font-bold text-slate-700">{viewTarget.currentCount}</p>
                <p className="text-xs text-slate-400">restaurants</p>
              </div>
              <RiArrowRightLine className="text-primary-400" size={22} />
              <div className="text-center">
                <p className="text-xs text-primary-500 font-medium uppercase tracking-wider mb-1">Requested</p>
                <p className="text-2xl font-bold text-primary-600">{viewTarget.requestedCount}</p>
                <p className="text-xs text-primary-400">restaurants</p>
              </div>
            </div>

            {/* Dates */}
            <div className={`grid gap-3 ${viewTarget.reviewedBy ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

            {/* Owner reason */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-100">
                <RiMessage2Line className="text-amber-500" size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Your Reason</span>
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
                  viewTarget.status === 'approved' ? 'border-emerald-100'
                  : viewTarget.status === 'rejected' ? 'border-red-100'
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
                  }`}>Admin Response</span>
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
    </div>
  );
}
