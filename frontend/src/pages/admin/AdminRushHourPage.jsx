import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Zap, Search, X, Clock, Calendar } from "lucide-react";
import { getAdminRushHours, createRushHour, updateRushHour, deleteRushHour, getAdminProducts } from "../../api/admin";
import Loader from "../../components/common/Loader";

const emptyForm = () => ({
  name: "",
  discount_percent: "20",
  schedule_type: "recurring_daily",
  start_time: "14:00",
  end_time: "16:00",
  start_at: "",
  end_at: "",
  is_active: false,
  product_ids: [],
  product_labels: {}, // { [id]: name } — just for chip display
});

const formatSchedule = (rh) => {
  if (rh.schedule_type === "recurring_daily") {
    return `Every day, ${rh.start_time?.slice(0, 5)}–${rh.end_time?.slice(0, 5)}`;
  }
  const fmt = (d) => new Date(d).toLocaleString("en-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${fmt(rh.start_at)} → ${fmt(rh.end_at)}`;
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone suffix.
const toLocalInputValue = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminRushHourPage = () => {
  const [rushHours, setRushHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchRushHours = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminRushHours();
      setRushHours(data.rush_hours);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchRushHours(); }, []);

  // Live product search for the picker (debounced)
  useEffect(() => {
    if (modal === null) return;
    if (!productSearch.trim()) { setProductResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await getAdminProducts({ search: productSearch, limit: 10 });
        setProductResults(data.products);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, modal]);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setErr(""); setProductSearch(""); setModal("add"); };
  const openEdit = (rh) => {
    setEditing(rh);
    const labels = {};
    (rh.products || []).forEach((p) => { labels[p.id] = p.name; });
    setForm({
      name: rh.name,
      discount_percent: rh.discount_percent,
      schedule_type: rh.schedule_type,
      start_time: rh.start_time ? rh.start_time.slice(0, 5) : "14:00",
      end_time: rh.end_time ? rh.end_time.slice(0, 5) : "16:00",
      start_at: toLocalInputValue(rh.start_at),
      end_at: toLocalInputValue(rh.end_at),
      is_active: rh.is_active,
      product_ids: (rh.products || []).map((p) => p.id),
      product_labels: labels,
    });
    setErr(""); setProductSearch(""); setModal("edit");
  };

  const addProduct = (p) => {
    if (form.product_ids.includes(p.id)) return;
    setForm((f) => ({
      ...f,
      product_ids: [...f.product_ids, p.id],
      product_labels: { ...f.product_labels, [p.id]: p.name },
    }));
  };
  const removeProduct = (id) => {
    setForm((f) => ({ ...f, product_ids: f.product_ids.filter((pid) => pid !== id) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.discount_percent) return setErr("Name and discount percentage are required.");
    if (form.product_ids.length === 0) return setErr("Select at least one product.");
    if (form.schedule_type === "recurring_daily" && (!form.start_time || !form.end_time)) {
      return setErr("Start and end time are required for a daily rush hour.");
    }
    if (form.schedule_type === "one_off" && (!form.start_at || !form.end_at)) {
      return setErr("Start and end date/time are required for a one-off rush hour.");
    }

    setSaving(true);
    setErr("");
    try {
      const payload = {
        name: form.name.trim(),
        discount_percent: parseFloat(form.discount_percent),
        schedule_type: form.schedule_type,
        is_active: form.is_active,
        product_ids: form.product_ids,
        ...(form.schedule_type === "recurring_daily"
          ? { start_time: `${form.start_time}:00`, end_time: `${form.end_time}:00` }
          : { start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString() }),
      };
      if (modal === "add") await createRushHour(payload);
      else await updateRushHour(editing.id, payload);
      setModal(null);
      fetchRushHours();
    } catch (e) {
      setErr(e.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rh) => {
    if (!window.confirm(`Delete "${rh.name}"?`)) return;
    await deleteRushHour(rh.id);
    fetchRushHours();
  };

  const currentlyActive = rushHours.find((rh) => rh.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1 text-charcoal/60">Flash Discounts</p>
          <h1 className="font-display text-3xl">Rush Hour</h1>
          <p className="text-sm text-charcoal/60 mt-1">
            Time-limited discounts on selected items. Only one can be switched on at a time, and it only discounts
            products that don't already have a sale price.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Rush Hour</button>
      </div>

      {currentlyActive && (
        <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Zap size={16} className="text-amber-600" />
          <span><strong>{currentlyActive.name}</strong> is switched on — {formatSchedule(currentlyActive)}, {parseFloat(currentlyActive.discount_percent)}% off.</span>
        </div>
      )}

      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>{["Name", "Discount", "Schedule", "Products", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {rushHours.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-charcoal/40 text-sm">No Rush Hours yet.</td></tr>
              ) : rushHours.map((rh) => (
                <tr key={rh.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium">{rh.name}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">{parseFloat(rh.discount_percent)}%</td>
                  <td className="px-4 py-3 text-charcoal/60 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      {rh.schedule_type === "recurring_daily" ? <Clock size={12} /> : <Calendar size={12} />}
                      {formatSchedule(rh)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{rh.products?.length || 0} item{rh.products?.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${rh.is_active ? "text-green-600" : "text-charcoal/40"}`}>
                      {rh.is_active ? "On" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(rh)} className="text-charcoal/50 hover:text-ink"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(rh)} className="text-charcoal/50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-lg bg-paper p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">{modal === "add" ? "New Rush Hour" : "Edit Rush Hour"}</h2>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Name</label>
              <input value={form.name} placeholder="e.g. Afternoon Flash Sale"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
            </div>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Discount (%)</label>
              <input type="number" min="1" max="100" value={form.discount_percent}
                onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))} className="input-field" />
            </div>

            <div>
              <label className="eyebrow mb-2 block text-charcoal/60">Schedule Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "recurring_daily", label: "Repeats Daily", desc: "Same time window, every day" },
                  { value: "one_off", label: "One-Off", desc: "A specific date and time" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex flex-col gap-1 border p-3 cursor-pointer transition-colors ${form.schedule_type === opt.value ? "border-ink bg-cream" : "border-ink/20 hover:border-ink/50"}`}>
                    <input type="radio" name="schedule_type" className="sr-only" checked={form.schedule_type === opt.value}
                      onChange={() => setForm((f) => ({ ...f, schedule_type: opt.value }))} />
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-charcoal/60">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.schedule_type === "recurring_daily" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow mb-1 block text-charcoal/60">Starts At</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="eyebrow mb-1 block text-charcoal/60">Ends At</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className="input-field" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="eyebrow mb-1 block text-charcoal/60">Starts At</label>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="eyebrow mb-1 block text-charcoal/60">Ends At</label>
                  <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} className="input-field" />
                </div>
              </div>
            )}

            {/* Product picker */}
            <div>
              <label className="eyebrow mb-2 block text-charcoal/60">Products</label>
              {form.product_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.product_ids.map((id) => (
                    <span key={id} className="flex items-center gap-1.5 border border-ink/20 bg-cream px-2.5 py-1 text-xs">
                      {form.product_labels[id] || `#${id}`}
                      <button type="button" onClick={() => removeProduct(id)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 border border-ink/15 px-3 py-2">
                <Search size={14} className="text-charcoal/40 shrink-0" />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to add…" className="w-full bg-transparent text-sm outline-none" />
              </div>
              {productSearch && (
                <div className="border border-t-0 border-ink/15 max-h-40 overflow-y-auto">
                  {searching ? (
                    <p className="px-3 py-2 text-xs text-charcoal/40">Searching…</p>
                  ) : productResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-charcoal/40">No matches.</p>
                  ) : productResults.map((p) => (
                    <button key={p.id} type="button" onClick={() => addProduct(p)}
                      disabled={form.product_ids.includes(p.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-left hover:bg-cream/60 disabled:opacity-40">
                      <span>{p.name}</span>
                      <span className="text-charcoal/50">{parseFloat(p.discount) > 0 ? "already on sale" : `${p.price} EGP`}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-xs text-charcoal/45">
                Products that already have their own discount won't be affected even if added here.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span>Switch this Rush Hour on{currentlyActive && currentlyActive.id !== editing?.id ? ` (will turn off "${currentlyActive.name}")` : ""}</span>
            </label>

            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Rush Hour"}</button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRushHourPage;
