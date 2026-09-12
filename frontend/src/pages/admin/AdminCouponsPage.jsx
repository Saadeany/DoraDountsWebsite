import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Tag, User as UserIcon } from "lucide-react";
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../api/admin";
import Loader from "../../components/common/Loader";

const emptyForm = () => ({ code:"", discount:"", start_date:"", expiry_date:"", usage_limit:"100", minimum_order_amount:"", is_active: true });

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await getAdminCoupons(); setCoupons(data.coupons); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setErr(""); setModal("add"); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, discount: c.discount, start_date: c.start_date, expiry_date: c.expiry_date, usage_limit: c.usage_limit, minimum_order_amount: c.minimum_order_amount || "", is_active: c.is_active });
    setErr(""); setModal("edit");
  };

  const handleSave = async () => {
    if (!form.code || !form.discount || !form.start_date || !form.expiry_date) return setErr("Code, discount, start date, and expiry date are required.");
    setSaving(true); setErr("");
    try {
      const payload = { ...form, code: form.code.toUpperCase(), minimum_order_amount: form.minimum_order_amount || null };
      if (modal === "add") await createCoupon(payload);
      else await updateCoupon(editing.id, payload);
      setModal(null); fetch();
    } catch (e) { setErr(e.response?.data?.message || "Save failed."); }
    finally { setSaving(false); }
  };

  const totalActive = coupons.filter(c => c.is_active).length;
  const personalCount = coupons.filter(c => c.User).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1 text-charcoal/60">Promotions</p>
          <h1 className="font-display text-3xl">Coupons</h1>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Coupon</button>
      </div>

      <div className="flex gap-4">
        {[{ label: "Total", value: coupons.length }, { label: "Active", value: totalActive }, { label: "Personal (Loyalty)", value: personalCount }].map(({ label, value }) => (
          <div key={label} className="border border-ink/10 px-4 py-3 flex items-center gap-3">
            <Tag size={16} className="text-charcoal/40" />
            <div><p className="text-lg font-medium">{value}</p><p className="text-xs text-charcoal/60">{label}</p></div>
          </div>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>{["Code","Discount","For","Min. Order","Valid","Expires","Used / Limit","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3 font-medium text-green-700">{c.discount}%</td>
                  <td className="px-4 py-3">
                    {c.User ? (
                      <span className="flex items-center gap-1 text-xs text-charcoal/70">
                        <UserIcon size={12} /> {c.User.first_name} {c.User.last_name}
                      </span>
                    ) : (
                      <span className="text-xs text-charcoal/40">Everyone</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{c.minimum_order_amount ? `${parseFloat(c.minimum_order_amount).toLocaleString()} EGP` : "—"}</td>
                  <td className="px-4 py-3 text-charcoal/60">{c.start_date}</td>
                  <td className="px-4 py-3 text-charcoal/60">{c.expiry_date}</td>
                  <td className="px-4 py-3">{c.times_used} / {c.usage_limit}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${c.is_active ? "text-green-600" : "text-red-500"}`}>{c.is_active ? "Active" : "Disabled"}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-charcoal/50 hover:text-ink"><Pencil size={15} /></button>
                      <button onClick={async () => { if (window.confirm("Delete this coupon?")) { await deleteCoupon(c.id); fetch(); } }} className="text-charcoal/50 hover:text-red-500"><Trash2 size={15} /></button>
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
            <h2 className="font-display text-xl">{modal === "add" ? "New Coupon" : "Edit Coupon"}</h2>
            {editing?.User && (
              <p className="text-xs text-charcoal/60 flex items-center gap-1.5">
                <UserIcon size={12} /> Personal coupon for {editing.User.first_name} {editing.User.last_name} — created from Admin &gt; Customers.
              </p>
            )}
            {[
              { label: "Code *", key: "code", disabled: modal === "edit", placeholder: "e.g. SUMMER20" },
              { label: "Discount (%) *", key: "discount", type: "number", placeholder: "e.g. 15" },
              { label: "Start Date *", key: "start_date", type: "date" },
              { label: "Expiry Date *", key: "expiry_date", type: "date" },
              { label: "Usage Limit", key: "usage_limit", type: "number", placeholder: "100" },
              { label: "Minimum Order Amount (EGP)", key: "minimum_order_amount", type: "number", placeholder: "Leave blank for no minimum" },
            ].map(({ label, key, type = "text", disabled, placeholder }) => (
              <div key={key}>
                <label className="eyebrow mb-1 block text-charcoal/60">{label}</label>
                <input type={type} disabled={disabled} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field disabled:opacity-50 disabled:bg-cream" />
              </div>
            ))}
            {modal === "edit" && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active</span>
              </label>
            )}
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Coupon"}</button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCouponsPage;
