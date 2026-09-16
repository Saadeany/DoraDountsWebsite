import React, { useState, useEffect, useCallback } from "react";
import { Search, ShieldBan, ShieldCheck, Trash2, Gift, Award, Mail, MessageCircle, Check } from "lucide-react";
import { getAdminUsers, toggleBlockUser, deleteUser, createCoupon, sendCouponEmail } from "../../api/admin";
import { buildWhatsAppLink } from "../../utils/whatsapp";
import Loader from "../../components/common/Loader";

// Simple, transparent tiering by order count — the raw numbers (orders +
// total spent) are shown right next to it, so the admin isn't relying on a
// black-box score to decide who deserves a discount.
const TIER_CONFIG = {
  New:    "bg-gray-100 text-gray-600",
  Bronze: "bg-orange-100 text-orange-700",
  Silver: "bg-slate-200 text-slate-700",
  Gold:   "bg-amber-100 text-amber-700",
};
const getTier = (orderCount) => {
  if (orderCount >= 6) return "Gold";
  if (orderCount >= 3) return "Silver";
  if (orderCount >= 1) return "Bronze";
  return "New";
};

const suggestCode = (lastName) => {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const base = (lastName || "LOYAL").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "LOYAL";
  return `${base}-${suffix}`;
};

const toDateOnly = (d) => d.toISOString().slice(0, 10);

const emptyDiscountForm = (customer) => {
  const inTwoWeeks = new Date();
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
  return {
    code: suggestCode(customer?.last_name),
    discount: "15",
    start_date: toDateOnly(new Date()),
    expiry_date: toDateOnly(inTwoWeeks),
    usage_limit: "1",
  };
};

const buildCouponWhatsAppMessage = (customer, coupon) =>
  `Hi ${customer.first_name}! 🎉 As a thank-you for being a loyal Felt & Form customer, here's a discount just for you:\n\n` +
  `*${coupon.code}* — ${parseFloat(coupon.discount)}% off your next order\n` +
  `Valid until ${coupon.expiry_date}\n\n` +
  `Shop now: ${window.location.origin}/shop`;

const AdminCustomersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [discountTarget, setDiscountTarget] = useState(null);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Set once the coupon has actually been created — unlocks the optional
  // "Email Code" / "Send via WhatsApp" buttons.
  const [createdCoupon, setCreatedCoupon] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAdminUsers({ search, page, limit: 20 });
      setUsers(data.users); setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDiscount = (customer) => {
    setDiscountTarget(customer);
    setDiscountForm(emptyDiscountForm(customer));
    setErr(""); setCreatedCoupon(null); setEmailSent(false); setEmailErr("");
  };

  const handleGiveDiscount = async () => {
    if (!discountForm.code.trim() || !discountForm.discount) {
      setErr("Code and discount percentage are required.");
      return;
    }
    setSaving(true); setErr("");
    try {
      const { data } = await createCoupon({
        code: discountForm.code.toUpperCase().trim(),
        discount: discountForm.discount,
        start_date: discountForm.start_date,
        expiry_date: discountForm.expiry_date,
        usage_limit: discountForm.usage_limit || 1,
        user_id: discountTarget.id,
      });
      setCreatedCoupon(data.coupon);
    } catch (e) {
      setErr(e.response?.data?.message || "Could not create coupon — that code might already be taken.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailSending(true); setEmailErr("");
    try {
      await sendCouponEmail(createdCoupon.id);
      setEmailSent(true);
    } catch (e) {
      setEmailErr(e.response?.data?.message || "Could not send the email.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1 text-charcoal/60">Loyalty</p>
        <h1 className="font-display text-3xl">Customers</h1>
      </div>
      <div className="flex items-center gap-2 border border-ink/15 px-3 py-2 max-w-xs">
        <Search size={15} className="text-charcoal/40 shrink-0" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers..." className="w-full bg-transparent text-sm outline-none" />
      </div>
      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>{["Name","Email","Phone","Orders","Total Spent","Tier","Status","Joined",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {users.map((u) => {
                const tier = getTier(u.order_count || 0);
                return (
                  <tr key={u.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-charcoal/70">{u.email}</td>
                    <td className="px-4 py-3 text-charcoal/60">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-center">{u.order_count || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{parseFloat(u.total_spent || 0).toLocaleString()} EGP</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[11px] rounded font-medium ${TIER_CONFIG[tier]}`}>{tier}</span>
                    </td>
                    <td className="px-4 py-3"><span className={u.is_blocked ? "text-red-500" : "text-green-600"}>{u.is_blocked ? "Blocked" : "Active"}</span></td>
                    <td className="px-4 py-3 text-charcoal/50 text-xs">{new Date(u.createdAt).toLocaleDateString("en-EG")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDiscount(u)} title="Give a personal discount" className="text-charcoal/50 hover:text-green-600">
                          <Gift size={15} />
                        </button>
                        <button onClick={async () => { await toggleBlockUser(u.id); fetchUsers(); }} title={u.is_blocked ? "Unblock" : "Block"} className="text-charcoal/50 hover:text-ink">
                          {u.is_blocked ? <ShieldCheck size={15} /> : <ShieldBan size={15} />}
                        </button>
                        <button onClick={async () => { if (window.confirm("Delete this customer?")) { await deleteUser(u.id); fetchUsers(); } }} className="text-charcoal/50 hover:text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 text-xs border transition-colors ${p === page ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Give a personal discount modal */}
      {discountTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setDiscountTarget(null)}>
          <div className="w-full max-w-md bg-paper p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-600" />
              <h2 className="font-display text-xl">Give {discountTarget.first_name} a Discount</h2>
            </div>
            <p className="text-xs text-charcoal/60">
              {discountTarget.order_count || 0} order{(discountTarget.order_count || 0) !== 1 ? "s" : ""} so far ·{" "}
              {parseFloat(discountTarget.total_spent || 0).toLocaleString()} EGP spent
            </p>

            {createdCoupon ? (
              <>
                <div className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  Coupon <strong>{createdCoupon.code}</strong> created — only {discountTarget.first_name} can redeem it.
                </div>

                {/* Optional — send it to the customer */}
                <div className="space-y-2">
                  <p className="eyebrow text-charcoal/50">Optional — let them know</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={handleSendEmail}
                      disabled={emailSending || emailSent}
                      className="btn-outline flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {emailSent ? <Check size={14} /> : <Mail size={14} />}
                      {emailSending ? "Sending…" : emailSent ? "Emailed" : "Email Code"}
                    </button>
                    <a
                      href={buildWhatsAppLink(discountTarget.phone, buildCouponWhatsAppMessage(discountTarget, createdCoupon))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle size={14} /> Send via WhatsApp
                    </a>
                  </div>
                  {emailErr && <p className="text-xs text-red-500">{emailErr}</p>}
                  {!discountTarget.phone && (
                    <p className="text-xs text-charcoal/45">No phone number on file — WhatsApp will open without a pre-selected contact.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {[
                  { label: "Coupon Code", key: "code" },
                  { label: "Discount (%)", key: "discount", type: "number" },
                  { label: "Valid From", key: "start_date", type: "date" },
                  { label: "Expires", key: "expiry_date", type: "date" },
                  { label: "Usage Limit", key: "usage_limit", type: "number" },
                ].map(({ label, key, type = "text" }) => (
                  <div key={key}>
                    <label className="eyebrow mb-1 block text-charcoal/60">{label}</label>
                    <input type={type} value={discountForm[key]}
                      onChange={(e) => setDiscountForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="input-field" />
                  </div>
                ))}
                <p className="text-xs text-charcoal/50">
                  Only {discountTarget.first_name} can redeem this — it's locked to their account and won't
                  show up as a public code anywhere.
                </p>
              </>
            )}

            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3 pt-2">
              {!createdCoupon && (
                <button onClick={handleGiveDiscount} disabled={saving} className="btn-primary">
                  {saving ? "Creating…" : "Create Coupon"}
                </button>
              )}
              <button onClick={() => setDiscountTarget(null)} className="btn-outline">{createdCoupon ? "Close" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
