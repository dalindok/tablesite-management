import { useState } from 'react';
import { useRequest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { restaurantsApi } from '../../api/restaurants';
import type { Restaurant, CreateRestaurantExtendedPayload, CuisineType, PriceRange } from '../../types';
import DataTable from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiStore2Line,
  RiAlertLine, RiSettings3Line, RiStarFill,
} from 'react-icons/ri';

const CUISINE_TYPES: CuisineType[] = [
  'Asian','Western','Italian','Japanese','Thai','Chinese',
  'Indian','French','Mexican','Mediterranean','Other',
];

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: 'LOW',    label: '$ Low' },
  { value: 'MEDIUM', label: '$$ Medium' },
  { value: 'HIGH',   label: '$$$ High' },
];

type FormMode = 'create' | 'edit';

function StatusBadge({ status }: { status: Restaurant['status'] }) {
  const m: Record<string, string> = {
    active: 'badge-success', inactive: 'badge-neutral',
    pending: 'badge-warning', suspended: 'badge-danger',
  };
  return <span className={m[status] ?? 'badge-neutral'}>{status}</span>;
}

function PriceTag({ range }: { range?: PriceRange | null }) {
  if (!range) return null;
  const m = { LOW: '$ Low', MEDIUM: '$$ Mid', HIGH: '$$$ High' };
  return <span className="text-xs text-slate-500">{m[range]}</span>;
}

// ── Section header inside form ────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</p>
      <div className="mt-1 border-t border-slate-100" />
    </div>
  );
}

export default function OwnerRestaurants() {
  const navigate = useNavigate();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [formOpen, setFormOpen]   = useState(false);
  const [formMode, setFormMode]   = useState<FormMode>('create');
  const [editTarget, setEditTarget] = useState<Restaurant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, refresh } = useRequest(
    () => restaurantsApi.ownerGetAll({ page, limit: 10, search }).then(r => r.data.data),
    { refreshDeps: [page, search] },
  );

  const restaurants      = data?.data ?? [];
  const total            = data?.total ?? 0;
  const totalPages       = data?.totalPages ?? 1;
  const restaurantLimit  = data?.restaurantLimit ?? 3;
  const canAdd           = data?.canAddRestaurant ?? (total < restaurantLimit);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<CreateRestaurantExtendedPayload>({
    defaultValues: {
      priceRange: 'MEDIUM',
      isPopular: false,
      depositRequired: false,
      parkingAvailable: false,
      capacity: 50,
      minCapacity: 2,
      minBookingNotice: 60,
      maxBookingDays: 30,
      cancellationHours: 24,
      depositAmount: 0,
    },
  });

  const depositRequired = watch('depositRequired');

  const openCreate = () => {
    setFormMode('create');
    setEditTarget(null);
    reset({
      priceRange: 'MEDIUM', isPopular: false, depositRequired: false,
      parkingAvailable: false, capacity: 50, minCapacity: 2,
      minBookingNotice: 60, maxBookingDays: 30, cancellationHours: 24, depositAmount: 0,
    });
    setFormOpen(true);
  };

  const openEdit = async (r: Restaurant) => {
    setFormMode('edit');
    setEditTarget(r);
    setFormOpen(true);
    // Pre-fill with list data immediately so the modal opens fast,
    // then overwrite with the full detail once fetched.
    reset({
      name: r.name,
      description: r.description ?? '',
      cuisineType: r.cuisineType,
      address: r.address,
      city: r.city,
      phone: r.phone,
      email: r.email,
      capacity: (r as any).capacity,
    });
    try {
      const full = await restaurantsApi.ownerGetFull(r.id);
      const f = full.data.data;
      reset({
        name:               f.name,
        description:        f.description ?? '',
        cuisineType:        f.cuisineType,
        address:            f.address,
        city:               f.city,
        state:              f.state ?? '',
        country:            f.country ?? '',
        postalCode:         f.postalCode ?? '',
        phone:              f.phone,
        email:              f.email,
        website:            f.website ?? '',
        coverImageUrl:      f.coverImageUrl ?? '',
        latitude:           f.latitude ?? '',
        longitude:          f.longitude ?? '',
        priceRange:         f.priceRange ?? 'MEDIUM',
        isPopular:          f.isPopular ?? false,
        capacity:           f.capacity,
        minCapacity:        f.minCapacity,
        minBookingNotice:   f.minBookingNotice,
        maxBookingDays:     f.maxBookingDays,
        cancellationHours:  f.cancellationHours,
        depositRequired:    f.depositRequired,
        depositAmount:      f.depositAmount,
        parkingAvailable:   f.parkingAvailable,
        dressCode:          f.dressCode ?? '',
      });
    } catch {
      // silently keep the partial reset already applied
    }
  };

  const onSubmit = async (form: CreateRestaurantExtendedPayload) => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        await restaurantsApi.ownerCreate(form);
      } else if (editTarget) {
        await restaurantsApi.ownerUpdate(editTarget.id, form);
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
      await restaurantsApi.ownerDelete(deleteTarget.id);
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
          {(r as any).coverImageUrl ? (
            <img src={(r as any).coverImageUrl} alt={r.name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <RiStore2Line className="text-primary-500" size={18} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-slate-800">{r.name}</p>
              {(r as any).isPopular && <RiStarFill size={12} className="text-amber-400" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-slate-400">{r.cuisineType} · {r.city}</p>
              <PriceTag range={(r as any).priceRange} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Address',
      render: (r: Restaurant) => <span className="text-slate-500 text-sm">{r.address}</span>,
    },
    {
      key: 'capacity',
      title: 'Capacity',
      render: (r: Restaurant) => `${r.capacity} seats`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (r: Restaurant) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      title: '',
      render: (r: Restaurant) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => navigate(`/owner/restaurants/${r.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-500 transition-colors"
            title="Manage"
          >
            <RiSettings3Line size={16} />
          </button>
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="Edit"
          >
            <RiEditLine size={16} />
          </button>
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
      {/* Limit banner */}
      {!canAdd && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <RiAlertLine className="text-amber-500 flex-shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Restaurant limit reached ({total}/{restaurantLimit})</p>
            <p className="text-sm text-amber-600">
              Need more?{' '}
              <button onClick={() => navigate('/owner/requests')} className="underline font-medium">
                Submit a request to admin
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Search restaurants…"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{total}/{restaurantLimit} used</span>
          <button
            onClick={canAdd ? openCreate : () => navigate('/owner/requests')}
            className={canAdd ? 'btn-primary' : 'btn-secondary'}
          >
            <RiAddLine size={16} />
            {canAdd ? 'Add Restaurant' : 'Request More'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns} data={restaurants} loading={loading} rowKey="id"
          emptyText="No restaurants yet. Add your first one!"
        />
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Add Restaurant' : 'Edit Restaurant'}
        size="xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
              {saving ? 'Saving…' : formMode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">

            {/* ── Basic Info ── */}
            <SectionLabel>Basic Info</SectionLabel>

            <div className="col-span-2">
              <label className="label">Restaurant Name *</label>
              <input className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="My Restaurant"
                {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="A brief description…"
                {...register('description')} />
            </div>

            <div>
              <label className="label">Cuisine Type *</label>
              <select className="input-field" {...register('cuisineType', { required: true })}>
                {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Price Range</label>
              <select className="input-field" {...register('priceRange')}>
                {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input id="isPopular" type="checkbox" className="w-4 h-4 accent-primary-500"
                {...register('isPopular')} />
              <label htmlFor="isPopular" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Mark as Popular <span className="text-slate-400 font-normal">(highlights restaurant with a star)</span>
              </label>
            </div>

            {/* ── Cover Image ── */}
            <div className="col-span-2">
              <label className="label">Cover Image URL</label>
              <input className="input-field" placeholder="https://…" {...register('coverImageUrl')} />
            </div>

            {/* ── Location ── */}
            <SectionLabel>Location</SectionLabel>

            <div className="col-span-2">
              <label className="label">Street Address *</label>
              <input className={`input-field ${errors.address ? 'input-error' : ''}`} placeholder="136 Norodom Blvd"
                {...register('address', { required: 'Address is required' })} />
            </div>

            <div>
              <label className="label">City *</label>
              <input className={`input-field ${errors.city ? 'input-error' : ''}`} placeholder="Phnom Penh"
                {...register('city', { required: 'City is required' })} />
            </div>

            <div>
              <label className="label">State / Province</label>
              <input className="input-field" placeholder="Phnom Penh" {...register('state')} />
            </div>

            <div>
              <label className="label">Country</label>
              <input className="input-field" placeholder="Cambodia" {...register('country')} />
            </div>

            <div>
              <label className="label">Postal Code</label>
              <input className="input-field" placeholder="12301" {...register('postalCode')} />
            </div>

            <div>
              <label className="label">Latitude</label>
              <input type="text" className="input-field" placeholder="11.5648"
                {...register('latitude')} />
            </div>

            <div>
              <label className="label">Longitude</label>
              <input type="text" className="input-field" placeholder="104.9282"
                {...register('longitude')} />
            </div>

            {/* ── Contact ── */}
            <SectionLabel>Contact</SectionLabel>

            <div>
              <label className="label">Phone *</label>
              <input className={`input-field ${errors.phone ? 'input-error' : ''}`} placeholder="+855 23 000 000"
                {...register('phone', { required: 'Phone is required' })} />
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="restaurant@example.com"
                {...register('email', { required: 'Email is required' })} />
            </div>

            <div className="col-span-2">
              <label className="label">Website</label>
              <input className="input-field" placeholder="https://www.example.com" {...register('website')} />
            </div>

            {/* ── Capacity & Booking ── */}
            <SectionLabel>Capacity &amp; Booking</SectionLabel>

            <div>
              <label className="label">Max Capacity (seats) *</label>
              <input type="number"
                className={`input-field ${errors.capacity ? 'input-error' : ''} ${formMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="120"
                disabled={formMode === 'edit'}
                {...register('capacity', { required: true, min: 1, valueAsNumber: true })} />
              {formMode === 'edit' && (
                <p className="mt-1 text-xs text-slate-400">Capacity is managed through tables — edit in the Manage view.</p>
              )}
            </div>

            <div>
              <label className="label">Min Capacity</label>
              <input type="number" className="input-field" placeholder="2"
                {...register('minCapacity', { min: 1, valueAsNumber: true })} />
            </div>

            <div>
              <label className="label">Min Booking Notice (min)</label>
              <input type="number" className="input-field" placeholder="60"
                {...register('minBookingNotice', { min: 0, valueAsNumber: true })} />
            </div>

            <div>
              <label className="label">Max Booking Days Ahead</label>
              <input type="number" className="input-field" placeholder="30"
                {...register('maxBookingDays', { min: 1, valueAsNumber: true })} />
            </div>

            <div>
              <label className="label">Cancellation Hours</label>
              <input type="number" className="input-field" placeholder="24"
                {...register('cancellationHours', { min: 0, valueAsNumber: true })} />
            </div>

            <div>
              <label className="label">Dress Code</label>
              <input className="input-field" placeholder="Smart Casual" {...register('dressCode')} />
            </div>

            {/* ── Deposit ── */}
            <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input id="depositRequired" type="checkbox" className="w-4 h-4 accent-primary-500"
                {...register('depositRequired')} />
              <label htmlFor="depositRequired" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Require deposit
              </label>
            </div>

            {depositRequired && (
              <div className="col-span-2">
                <label className="label">Deposit Amount ($)</label>
                <input type="number" step="0.01" className="input-field" placeholder="20.00"
                  {...register('depositAmount', { min: 0, valueAsNumber: true })} />
              </div>
            )}

            {/* ── Amenities ── */}
            <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input id="parkingAvailable" type="checkbox" className="w-4 h-4 accent-primary-500"
                {...register('parkingAvailable')} />
              <label htmlFor="parkingAvailable" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Parking available
              </label>
            </div>

          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
