import { useState } from 'react';
import { useRequest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { requestsApi } from '../../api/requests';
import type { RestaurantRequest } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { RiAddLine, RiEyeLine, RiAlertLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine } from 'react-icons/ri';
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
              Each owner can manage up to 3 restaurants by default. To add more, submit a request to the admin team.
              You'll receive a response with an approval or rejection and a reason.
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
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              viewTarget.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
              viewTarget.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <StatusBadge status={viewTarget.status} />
                <span className="text-sm text-slate-600">
                  {viewTarget.status === 'pending' && 'Awaiting admin review'}
                  {viewTarget.status === 'approved' && `Approved on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}`}
                  {viewTarget.status === 'rejected' && `Rejected on ${dayjs(viewTarget.reviewedAt).format('MMM D, YYYY')}`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Count</p>
                <p className="text-sm text-slate-800 mt-1">{viewTarget.currentCount} restaurants</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Requested Limit</p>
                <p className="text-sm text-slate-800 mt-1">{viewTarget.requestedCount} restaurants</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Submitted</p>
                <p className="text-sm text-slate-800 mt-1">{dayjs(viewTarget.createdAt).format('MMMM D, YYYY')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Your Reason</p>
              <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg leading-relaxed">{viewTarget.reason}</p>
            </div>
            {viewTarget.adminNote && (
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Admin Response</p>
                <p className="text-sm text-slate-700 mt-1 p-3 bg-blue-50 rounded-lg leading-relaxed border border-blue-100">{viewTarget.adminNote}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
