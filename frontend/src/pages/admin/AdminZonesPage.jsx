import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, MapPinned, Ban, CheckCircle2 } from "lucide-react";
import { getAdminZones, createZone, updateZone, deleteZone } from "../../api/admin";
import Loader from "../../components/common/Loader";

const emptyForm = () => ({ name: "", shipping_price: "", is_deliverable: true, sort_order: "0" });

const AdminZonesPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetchZones = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminZones();
      setZones(data.zones);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchZones(); }, []);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setErr(""); setModal("add"); };
  const openEdit = (z) => {
    setEditing(z);
    setForm({
      name: z.name,
      shipping_price: z.shipping_price,
      is_deliverable: z.is_deliverable,
      sort_order: z.sort_order,
    });
    setErr("");
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.shipping_price === "") {
      return setErr("Area name and shipping price are required.");
    }
    setSaving(true);
    setErr("");
    try {
      const payload = { ...form, shipping_price: parseFloat(form.shipping_price) || 0, sort_order: parseInt(form.sort_order, 10) || 0 };
      if (modal === "add") await createZone(payload);
      else await updateZone(editing.id, payload);
      setModal(null);
      fetchZones();
    } catch (e) {
      setErr(e.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDeliverable = async (z) => {
    await updateZone(z.id, { is_deliverable: !z.is_deliverable });
    fetchZones();
  };

  const handleDelete = async (z) => {
    if (!window.confirm(`Delete "${z.name}"? Past orders keep their address details, but this area won't be offered at checkout anymore.`)) return;
    await deleteZone(z.id);
    fetchZones();
  };

  const deliverableCount = zones.filter((z) => z.is_deliverable).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1 text-charcoal/60">Delivery</p>
          <h1 className="font-display text-3xl">Zones</h1>
          <p className="text-sm text-charcoal/60 mt-1">
            The areas customers can choose at checkout, and what you charge to ship to each.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Zone</button>
      </div>

      <div className="flex gap-4">
        {[
          { label: "Total Areas", value: zones.length },
          { label: "Deliverable", value: deliverableCount },
          { label: "Blocked", value: zones.length - deliverableCount },
        ].map(({ label, value }) => (
          <div key={label} className="border border-ink/10 px-4 py-3 flex items-center gap-3">
            <MapPinned size={16} className="text-charcoal/40" />
            <div><p className="text-lg font-medium">{value}</p><p className="text-xs text-charcoal/60">{label}</p></div>
          </div>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>{["Area", "Shipping Price", "Status", "Order", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {zones.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-charcoal/40 text-sm">No zones yet — add your first delivery area.</td></tr>
              ) : zones.map((z) => (
                <tr key={z.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 font-medium">{z.name}</td>
                  <td className="px-4 py-3">{parseFloat(z.shipping_price).toLocaleString()} EGP</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleDeliverable(z)}
                      className={`flex items-center gap-1.5 text-xs font-medium ${z.is_deliverable ? "text-green-600" : "text-red-500"}`}
                      title="Click to toggle"
                    >
                      {z.is_deliverable ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                      {z.is_deliverable ? "Deliverable" : "Not Deliverable"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{z.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(z)} className="text-charcoal/50 hover:text-ink"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(z)} className="text-charcoal/50 hover:text-red-500"><Trash2 size={15} /></button>
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
          <div className="w-full max-w-md bg-paper p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl">{modal === "add" ? "New Zone" : "Edit Zone"}</h2>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Area Name *</label>
              <input value={form.name} placeholder="e.g. Nasr City"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Shipping Price (EGP) *</label>
              <input type="number" min="0" value={form.shipping_price} placeholder="e.g. 60"
                onChange={e => setForm(f => ({ ...f, shipping_price: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Sort Order</label>
              <input type="number" value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="input-field" />
              <p className="text-xs text-charcoal/50 mt-1">Lower numbers appear first in the checkout dropdown.</p>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_deliverable}
                onChange={e => setForm(f => ({ ...f, is_deliverable: e.target.checked }))} />
              <span>We currently deliver to this area</span>
            </label>

            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Zone"}</button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminZonesPage;
