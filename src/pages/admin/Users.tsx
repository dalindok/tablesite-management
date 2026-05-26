import { useState } from 'react';
import { useRequest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { usersApi } from '../../api/users';
import type { User, CreateUserPayload, UpdateUserPayload, UserRole } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiFilterLine } from 'react-icons/ri';
import dayjs from 'dayjs';

type FormMode = 'create' | 'edit';

interface UserForm {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  status?: User['status'];
}

function StatusBadge({ status }: { status: User['status'] }) {
  const m: Record<string, string> = { active: 'badge-success', inactive: 'badge-neutral', suspended: 'badge-danger' };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

function RoleBadge({ role }: { role: UserRole }) {
  const m: Record<string, string> = { admin: 'badge-primary', owner: 'badge-info', customer: 'badge-neutral' };
  return <span className={m[role] ?? 'badge-neutral'}>{role}</span>;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, refresh } = useRequest(
    () => usersApi.getAll({ page, limit: 10, search, role: roleFilter }).then(r => r.data.data),
    { refreshDeps: [page, search, roleFilter] }
  );

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>();

  const openCreate = () => {
    setFormMode('create');
    setEditTarget(null);
    reset({ name: '', email: '', password: '', phone: '', role: 'customer', status: 'active' });
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setFormMode('edit');
    setEditTarget(u);
    reset({ name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, status: u.status });
    setFormOpen(true);
  };

  const onSubmit = async (form: UserForm) => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        await usersApi.create(form as CreateUserPayload);
      } else if (editTarget) {
        const payload: UpdateUserPayload = { name: form.name, email: form.email, phone: form.phone, role: form.role, status: form.status };
        await usersApi.update(editTarget.id, payload);
      }
      setFormOpen(false);
      refresh();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'User',
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800">{u.name}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', title: 'Phone', render: (u: User) => u.phone || <span className="text-slate-300">—</span> },
    { key: 'role', title: 'Role', render: (u: User) => <RoleBadge role={u.role} /> },
    { key: 'status', title: 'Status', render: (u: User) => <StatusBadge status={u.status} /> },
    { key: 'createdAt', title: 'Joined', render: (u: User) => dayjs(u.createdAt).format('MMM D, YYYY') },
    {
      key: 'actions',
      title: '',
      render: (u: User) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
            <RiEditLine size={16} />
          </button>
          <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search users…" />
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="customer">Customer</option>
            </select>
            <RiFilterLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <RiAddLine size={16} /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={users} loading={loading} rowKey="id" emptyText="No users found" />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Add New User' : 'Edit User'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
              {saving ? 'Saving…' : formMode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="John Doe"
                {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input type="email" className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="user@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            {formMode === 'create' && (
              <div className="col-span-2">
                <label className="label">Password</label>
                <input type="password" className={`input-field ${errors.password ? 'input-error' : ''}`} placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })} />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            )}
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="+855 12 345 678" {...register('phone')} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input-field" {...register('role', { required: true })}>
                <option value="customer">Customer</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {formMode === 'edit' && (
              <div className="col-span-2">
                <label className="label">Status</label>
                <select className="input-field" {...register('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete User"
      />
    </div>
  );
}
