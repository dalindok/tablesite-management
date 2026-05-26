import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurantsApi } from "../../api/restaurants";
import { menusApi } from "../../api/menus";
import type {
  RestaurantFull,
  Table,
  GalleryImage,
  SpecialClosure,
  Menu,
  MenuItem,
  DayOfWeek,
  CreateTablePayload,
  UpdateTablePayload,
  AddGalleryImagePayload,
  CreateClosurePayload,
  CreateMenuPayload,
  CreateMenuItemPayload,
} from "../../types";
import {
  RiArrowLeftLine,
  RiTimeLine,
  RiTableLine,
  RiImageLine,
  RiPriceTag3Line,
  RiBookOpenLine,
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSaveLine,
  RiCheckLine,
  RiCloseLine,
  RiLoader4Line,
} from "react-icons/ri";

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

type Tab = "hours" | "tables" | "gallery" | "tags" | "closures" | "menus";

function Spinner() {
  return <RiLoader4Line className="animate-spin text-primary-500" size={20} />;
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Tab: Operating Hours ──────────────────────────────────────────────────────
function HoursTab({ restaurantId }: { restaurantId: number }) {
  type HourRow = {
    day_of_week: DayOfWeek;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  };

  const defaultHours = (): HourRow[] =>
    DAYS.map((d) => ({
      day_of_week: d,
      open_time: "09:00",
      close_time: "22:00",
      is_closed: false,
    }));

  const [hours, setHours] = useState<HourRow[]>(defaultHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    restaurantsApi
      .ownerGetFull(restaurantId)
      .then((r) => {
        const oh = r.data.data.operating_hours;
        if (oh && oh.length > 0) {
          const merged = DAYS.map((d) => {
            const found = oh.find((h) => h.day_of_week === d);
            return found
              ? {
                  day_of_week: d,
                  open_time: found.open_time,
                  close_time: found.close_time,
                  is_closed: found.is_closed,
                }
              : {
                  day_of_week: d,
                  open_time: "09:00",
                  close_time: "22:00",
                  is_closed: false,
                };
          });
          setHours(merged);
        }
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const update = (
    day: DayOfWeek,
    field: keyof HourRow,
    value: string | boolean,
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, [field]: value } : h)),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      // Backend expects bare array, not { hours: [] }
      await restaurantsApi.ownerUpdateHours(restaurantId, hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error saving hours");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );

  return (
    <SectionCard
      title="Operating Hours"
      action={
        <button
          className="btn-primary text-sm"
          onClick={save}
          disabled={saving}>
          {saving ? (
            <Spinner />
          ) : saved ? (
            <RiCheckLine size={16} />
          ) : (
            <RiSaveLine size={16} />
          )}
          {saved ? "Saved!" : "Save Hours"}
        </button>
      }>
      <div className="space-y-2">
        {hours.map((h) => (
          <div
            key={h.day_of_week}
            className={`grid grid-cols-[140px_1fr_1fr_auto] gap-3 items-center p-3 rounded-xl border transition-colors
              ${h.is_closed ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200"}`}>
            <span className="font-medium text-slate-700 text-sm">
              {DAY_LABELS[h.day_of_week]}
            </span>
            <input
              type="time"
              value={h.open_time}
              disabled={h.is_closed}
              onChange={(e) =>
                update(h.day_of_week, "open_time", e.target.value)
              }
              className="input-field py-1.5 text-sm disabled:opacity-40"
            />
            <input
              type="time"
              value={h.close_time}
              disabled={h.is_closed}
              onChange={(e) =>
                update(h.day_of_week, "close_time", e.target.value)
              }
              className="input-field py-1.5 text-sm disabled:opacity-40"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-red-500"
                checked={h.is_closed}
                onChange={(e) =>
                  update(h.day_of_week, "is_closed", e.target.checked)
                }
              />
              Closed
            </label>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Tab: Tables ───────────────────────────────────────────────────────────────
function TablesTab({ restaurantId }: { restaurantId: number }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<Table | null>(null);
  const [form, setForm] = useState<CreateTablePayload>({
    table_number: "",
    capacity: 2,
  });
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await restaurantsApi.ownerListTables(restaurantId);
      setTables(r.data.data);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (t: Table) => {
    setEditRow(t);
    setForm({
      table_number: t.table_number,
      capacity: t.capacity,
      floor: t.floor,
      description: t.description,
    });
    setAddOpen(false);
  };

  const startAdd = () => {
    setEditRow(null);
    setForm({ table_number: "", capacity: 2 });
    setAddOpen(true);
  };

  const save = async () => {
    if (!form.table_number) return;
    setSaving(true);
    try {
      if (editRow) {
        await restaurantsApi.ownerUpdateTable(
          restaurantId,
          editRow.id,
          form as UpdateTablePayload,
        );
        setEditRow(null);
      } else {
        await restaurantsApi.ownerCreateTable(restaurantId, form);
        setAddOpen(false);
      }
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error saving table");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this table?")) return;
    try {
      await restaurantsApi.ownerDeleteTable(restaurantId, id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error deleting table");
    }
  };

  const FormRow = () => (
    <div className="grid grid-cols-[80px_80px_100px_1fr_auto] gap-2 items-end p-3 rounded-xl border border-primary-200 bg-primary-50">
      <div>
        <label className="label text-xs">Table #</label>
        <input
          className="input-field py-1.5 text-sm"
          placeholder="T1"
          value={form.table_number}
          onChange={(e) =>
            setForm((f) => ({ ...f, table_number: e.target.value }))
          }
        />
      </div>
      <div>
        <label className="label text-xs">Seats</label>
        <input
          type="number"
          min={1}
          className="input-field py-1.5 text-sm"
          value={form.capacity}
          onChange={(e) =>
            setForm((f) => ({ ...f, capacity: +e.target.value }))
          }
        />
      </div>
      <div>
        <label className="label text-xs">Floor</label>
        <input
          className="input-field py-1.5 text-sm"
          placeholder="Ground"
          value={form.floor ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
        />
      </div>
      <div>
        <label className="label text-xs">Description</label>
        <input
          className="input-field py-1.5 text-sm"
          placeholder="Near window…"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>
      <div className="flex gap-1 pb-0.5">
        <button
          className="btn-primary py-1.5 px-3 text-sm"
          onClick={save}
          disabled={saving}>
          {saving ? <Spinner /> : <RiCheckLine size={15} />}
        </button>
        <button
          className="btn-secondary py-1.5 px-3 text-sm"
          onClick={() => {
            setAddOpen(false);
            setEditRow(null);
          }}>
          <RiCloseLine size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <SectionCard
      title="Tables"
      action={
        <button
          className="btn-primary text-sm"
          onClick={startAdd}
          disabled={addOpen || !!editRow}>
          <RiAddLine size={15} /> Add Table
        </button>
      }>
      {addOpen && (
        <div className="mb-3">
          <FormRow />
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : tables.length === 0 && !addOpen ? (
        <p className="text-center text-slate-400 py-8 text-sm">
          No tables yet. Add one above.
        </p>
      ) : (
        <div className="space-y-2">
          {tables.map((t) =>
            editRow?.id === t.id ? (
              <div key={t.id}>
                <FormRow />
              </div>
            ) : (
              <div
                key={t.id}
                className="grid grid-cols-[80px_60px_90px_1fr_auto] gap-3 items-center p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <span className="font-semibold text-slate-800 text-sm">
                  {t.table_number}
                </span>
                <span className="text-slate-600 text-sm">
                  {t.capacity} seats
                </span>
                <span className="text-slate-500 text-xs">{t.floor ?? "—"}</span>
                <span className="text-slate-400 text-xs truncate">
                  {t.description ?? "—"}
                </span>
                <div className="flex gap-1">
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    onClick={() => startEdit(t)}>
                    <RiEditLine size={15} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    onClick={() => del(t.id)}>
                    <RiDeleteBinLine size={15} />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ── Tab: Gallery ──────────────────────────────────────────────────────────────
function GalleryTab({ restaurantId }: { restaurantId: number }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AddGalleryImagePayload>({
    url: "",
    caption: "",
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await restaurantsApi.ownerGetFull(restaurantId);
      setImages(r.data.data.gallery_images ?? []);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!form.url) return;
    setSaving(true);
    try {
      await restaurantsApi.ownerAddGalleryImage(restaurantId, {
        ...form,
        sort_order: images.length,
      });
      setForm({ url: "", caption: "", sort_order: 0 });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error adding image");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Remove this image?")) return;
    try {
      await restaurantsApi.ownerDeleteGalleryImage(restaurantId, id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error deleting image");
    }
  };

  return (
    <SectionCard title="Gallery Images">
      <div className="flex gap-2 mb-5">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Image URL (https://…)"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <input
          className="input-field w-40 text-sm"
          placeholder="Caption"
          value={form.caption ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
        />
        <button
          className="btn-primary text-sm"
          onClick={add}
          disabled={saving || !form.url}>
          {saving ? <Spinner /> : <RiAddLine size={15} />}
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">
          No images yet. Paste a URL above.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-xl overflow-hidden border border-slate-200">
              <img
                src={img.url}
                alt={img.caption ?? ""}
                className="w-full h-36 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <button
                  className="self-end p-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  onClick={() => del(img.id)}>
                  <RiDeleteBinLine size={14} />
                </button>
                {img.caption && (
                  <p className="text-white text-xs font-medium truncate">
                    {img.caption}
                  </p>
                )}
              </div>
              {img.caption && (
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-xs text-slate-500 truncate">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Tab: Tags & Closures ──────────────────────────────────────────────────────
function TagsClosuresTab({ restaurantId }: { restaurantId: number }) {
  const [tags, setTags] = useState<string[]>([]);
  const [closures, setClosures] = useState<SpecialClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [cForm, setCForm] = useState<CreateClosurePayload>({
    date: "",
    reason: "",
  });
  const [cSaving, setCsaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await restaurantsApi.ownerGetFull(restaurantId);
      // tags are Tag objects { id, name } after the join unwrap
      setTags(r.data.data.tags?.map((t) => t.name) ?? []);
      setClosures(r.data.data.special_closures ?? []);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const saveTags = async () => {
    setSaving(true);
    try {
      await restaurantsApi.ownerUpdateTags(restaurantId, { tags });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error saving tags");
    } finally {
      setSaving(false);
    }
  };

  const addClosure = async () => {
    if (!cForm.date) return;
    setCsaving(true);
    try {
      await restaurantsApi.ownerAddClosure(restaurantId, cForm);
      setCForm({ date: "", reason: "" });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error adding closure");
    } finally {
      setCsaving(false);
    }
  };

  const delClosure = async (id: number) => {
    try {
      await restaurantsApi.ownerDeleteClosure(restaurantId, id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error deleting closure");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Tags */}
      <SectionCard
        title="Tags"
        action={
          <button
            className="btn-primary text-sm"
            onClick={saveTags}
            disabled={saving}>
            {saving ? <Spinner /> : <RiSaveLine size={15} />}
            Save Tags
          </button>
        }>
        <div className="flex gap-2 mb-4">
          <input
            className="input-field flex-1 text-sm"
            placeholder="e.g. Fine Dining"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())
            }
          />
          <button className="btn-secondary text-sm" onClick={addTag}>
            <RiAddLine size={15} /> Add
          </button>
        </div>
        {tags.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">
            No tags. Type above and press Enter.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-primary-400 hover:text-red-500 transition-colors">
                  <RiCloseLine size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Special Closures */}
      <SectionCard title="Special Closures">
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            className="input-field text-sm"
            value={cForm.date}
            onChange={(e) => setCForm((f) => ({ ...f, date: e.target.value }))}
          />
          <input
            className="input-field flex-1 text-sm"
            placeholder="Reason (e.g. Khmer New Year)"
            value={cForm.reason ?? ""}
            onChange={(e) =>
              setCForm((f) => ({ ...f, reason: e.target.value }))
            }
          />
          <button
            className="btn-primary text-sm"
            onClick={addClosure}
            disabled={cSaving || !cForm.date}>
            {cSaving ? <Spinner /> : <RiAddLine size={15} />}
            Add
          </button>
        </div>
        {closures.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">
            No special closures.
          </p>
        ) : (
          <div className="space-y-2">
            {closures.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                <div>
                  <p className="font-medium text-slate-700 text-sm">
                    {typeof c.date === "string" ? c.date.split("T")[0] : c.date}
                  </p>
                  {c.reason && (
                    <p className="text-xs text-slate-400 mt-0.5">{c.reason}</p>
                  )}
                </div>
                <button
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={() => delClosure(c.id)}>
                  <RiDeleteBinLine size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Menus ────────────────────────────────────────────────────────────────
function MenusTab({ restaurantId }: { restaurantId: number }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState<CreateMenuPayload>({
    name: "",
    is_active: true,
    sort_order: 0,
  });
  const [menuAdding, setMenuAdding] = useState(false);
  const [itemForm, setItemForm] = useState<CreateMenuItemPayload>({
    name: "",
    price: 0,
    category: "",
    is_available: true,
    is_vegan: false,
    is_vegetarian: false,
    is_gluten_free: false,
    sort_order: 0,
  });
  const [itemAdding, setItemAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await menusApi.list(restaurantId);
      // r.data.data is { restaurant_id, menus: [] }
      const data = r.data.data.menus ?? [];
      setMenus(data);
      setActiveMenu((prev) => {
        if (!prev && data.length > 0) return data[0];
        if (prev) return data.find((m) => m.id === prev.id) ?? data[0] ?? null;
        return null;
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const addMenu = async () => {
    if (!menuForm.name) return;
    setSaving(true);
    try {
      await menusApi.create(restaurantId, {
        ...menuForm,
        sort_order: menus.length,
      });
      setMenuForm({ name: "", is_active: true, sort_order: 0 });
      setMenuAdding(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error adding menu");
    } finally {
      setSaving(false);
    }
  };

  const delMenu = async (id: number) => {
    if (!confirm("Delete this menu and all its items?")) return;
    try {
      await menusApi.delete(restaurantId, id);
      if (activeMenu?.id === id) setActiveMenu(null);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error deleting menu");
    }
  };

  const toggleActive = async (menu: Menu) => {
    try {
      await menusApi.update(restaurantId, menu.id, {
        is_active: !menu.is_active,
      });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error updating menu");
    }
  };

  const addItem = async () => {
    if (!activeMenu || !itemForm.name) return;
    setSaving(true);
    try {
      await menusApi.createItem(restaurantId, activeMenu.id, {
        ...itemForm,
        sort_order: activeMenu.items?.length ?? 0,
      });
      setItemForm({
        name: "",
        price: 0,
        category: "",
        is_available: true,
        is_vegan: false,
        is_vegetarian: false,
        is_gluten_free: false,
        sort_order: 0,
      });
      setItemAdding(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error adding item");
    } finally {
      setSaving(false);
    }
  };

  const delItem = async (itemId: number) => {
    if (!activeMenu || !confirm("Delete this item?")) return;
    try {
      await menusApi.deleteItem(restaurantId, activeMenu.id, itemId);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error deleting item");
    }
  };

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 items-start">
      {/* Left — Menu list */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 text-sm">Menus</h3>
          <button
            className="text-primary-500 hover:text-primary-700 transition-colors"
            onClick={() => setMenuAdding((v) => !v)}>
            <RiAddLine size={18} />
          </button>
        </div>

        {menuAdding && (
          <div className="mb-3 space-y-2 p-3 rounded-xl border border-primary-200 bg-primary-50">
            <input
              className="input-field text-sm py-1.5"
              placeholder="Menu name"
              value={menuForm.name}
              onChange={(e) =>
                setMenuForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <input
              className="input-field text-sm py-1.5"
              placeholder="Description (optional)"
              value={menuForm.description ?? ""}
              onChange={(e) =>
                setMenuForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <div className="flex gap-1.5">
              <button
                className="btn-primary py-1.5 text-xs flex-1"
                onClick={addMenu}
                disabled={saving}>
                {saving ? <Spinner /> : "Add"}
              </button>
              <button
                className="btn-secondary py-1.5 text-xs"
                onClick={() => setMenuAdding(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : menus.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-4">
            No menus yet.
          </p>
        ) : (
          <div className="space-y-1">
            {menus.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors group
                  ${activeMenu?.id === m.id ? "bg-primary-50 border border-primary-200" : "hover:bg-slate-50 border border-transparent"}`}
                onClick={() => setActiveMenu(m)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {m.items?.length ?? 0} items
                  </p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className={`p-1 rounded text-xs ${m.is_active ? "text-green-500" : "text-slate-400"} hover:bg-slate-100`}
                    title={
                      m.is_active
                        ? "Active — click to deactivate"
                        : "Inactive — click to activate"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(m);
                    }}>
                    <RiCheckLine size={13} />
                  </button>
                  <button
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      delMenu(m.id);
                    }}>
                    <RiDeleteBinLine size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — Items */}
      <div className="card">
        {!activeMenu ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RiBookOpenLine size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Select a menu to manage its items</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-700">
                  {activeMenu.name}
                </h3>
                {activeMenu.description && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeMenu.description}
                  </p>
                )}
              </div>
              <button
                className="btn-primary text-sm"
                onClick={() => setItemAdding((v) => !v)}>
                <RiAddLine size={15} /> Add Item
              </button>
            </div>

            {/* Item add form */}
            {itemAdding && (
              <div className="mb-4 p-4 rounded-xl border border-primary-200 bg-primary-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label text-xs">Item Name *</label>
                    <input
                      className="input-field text-sm py-1.5"
                      placeholder="Fish Amok"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Description</label>
                    <input
                      className="input-field text-sm py-1.5"
                      placeholder="Short description"
                      value={itemForm.description ?? ""}
                      onChange={(e) =>
                        setItemForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-sm py-1.5"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, price: +e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Category</label>
                    <input
                      className="input-field text-sm py-1.5"
                      placeholder="Main / Appetizer / Dessert"
                      value={itemForm.category ?? ""}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, category: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Image URL</label>
                    <input
                      className="input-field text-sm py-1.5"
                      placeholder="https://…"
                      value={itemForm.image_url ?? ""}
                      onChange={(e) =>
                        setItemForm((f) => ({
                          ...f,
                          image_url: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 flex gap-4 text-sm text-slate-600">
                    {(
                      [
                        { key: "is_available", label: "Available" },
                        { key: "is_vegan", label: "Vegan" },
                        { key: "is_vegetarian", label: "Vegetarian" },
                        { key: "is_gluten_free", label: "Gluten-free" },
                      ] as const
                    ).map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-primary-500"
                          checked={!!itemForm[key]}
                          onChange={(e) =>
                            setItemForm((f) => ({
                              ...f,
                              [key]: e.target.checked,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary text-sm"
                    onClick={addItem}
                    disabled={saving}>
                    {saving ? <Spinner /> : "Add Item"}
                  </button>
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => setItemAdding(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items list */}
            {(activeMenu.items?.length ?? 0) === 0 && !itemAdding ? (
              <p className="text-center text-slate-400 py-10 text-sm">
                No items. Add one above.
              </p>
            ) : (
              <div className="space-y-2">
                {activeMenu.items?.map((item: MenuItem) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <RiImageLine size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">
                          {item.name}
                        </p>
                        {item.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {item.category}
                          </span>
                        )}
                        {!item.is_available && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            Unavailable
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {item.is_vegan && (
                          <span className="text-xs text-green-600">Vegan</span>
                        )}
                        {item.is_vegetarian && (
                          <span className="text-xs text-emerald-600">
                            Vegetarian
                          </span>
                        )}
                        {item.is_gluten_free && (
                          <span className="text-xs text-blue-600">GF</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-slate-800">
                        ${Number(item.price).toFixed(2)}
                      </p>
                      <button
                        className="mt-1 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => delItem(item.id)}>
                        <RiDeleteBinLine size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "hours", label: "Hours", icon: <RiTimeLine size={16} /> },
  { id: "tables", label: "Tables", icon: <RiTableLine size={16} /> },
  { id: "gallery", label: "Gallery", icon: <RiImageLine size={16} /> },
  { id: "tags", label: "Tags & Closures", icon: <RiPriceTag3Line size={16} /> },
  { id: "menus", label: "Menus", icon: <RiBookOpenLine size={16} /> },
];

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const restaurantId = Number(id);
  const [tab, setTab] = useState<Tab>("hours");
  const [info, setInfo] = useState<RestaurantFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    restaurantsApi
      .ownerGetFull(restaurantId)
      .then((r) => setInfo(r.data.data))
      .catch(() => navigate("/owner/restaurants"))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/owner/restaurants")}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <RiArrowLeftLine size={18} />
        </button>
        <div>
          {loading ? (
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-800">{info?.name}</h1>
              <p className="text-sm text-slate-400">
                {info?.cuisineType} · {info?.city}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}
      {!loading && restaurantId && (
        <>
          {tab === "hours" && <HoursTab restaurantId={restaurantId} />}
          {tab === "tables" && <TablesTab restaurantId={restaurantId} />}
          {tab === "gallery" && <GalleryTab restaurantId={restaurantId} />}
          {tab === "tags" && <TagsClosuresTab restaurantId={restaurantId} />}
          {tab === "menus" && <MenusTab restaurantId={restaurantId} />}
        </>
      )}
    </div>
  );
}
