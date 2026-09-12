import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { updateProfile, changePassword, updateAddresses } from "../api/auth";
import { getMyOrders } from "../api/orders";
import { getZones } from "../api/zones";
import { formatPrice } from "../utils/format";
import { LogOut, User, Package, MapPin, Lock, RefreshCw, RotateCcw, Plus, Pencil, Trash2, Star } from "lucide-react";

const TABS = [
  { key:"profile",  label:"Profile",   icon:User,    path:"/profile" },
  { key:"orders",   label:"My Orders", icon:Package, path:"/profile/orders" },
  { key:"addresses",label:"Addresses", icon:MapPin,  path:"/profile/addresses" },
  { key:"password", label:"Password",  icon:Lock,    path:"/profile/password" },
];

const STATUS_BADGE = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped:    "bg-purple-50 text-purple-700 border-purple-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

const getTabFromPath = (path) => {
  if (path.includes("/orders"))    return "orders";
  if (path.includes("/addresses")) return "addresses";
  if (path.includes("/password"))  return "password";
  return "profile";
};

const emptyAddress = () => ({
  full_name: "", phone: "", city: "Cairo", area: "",
  building_number: "", floor: "", apartment_number: "", address: "",
});

const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState(() => getTabFromPath(location.pathname));
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "" });
  const [pwForm, setPwForm] = useState({ current_password:"", new_password:"", confirm_password:"" });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(null);

  // ── Addresses tab state ────────────────────────────────────────────────
  const [zones, setZones] = useState([]);
  const [addrModal, setAddrModal] = useState(null); // null | "add" | "edit"
  const [addrForm, setAddrForm] = useState(emptyAddress());
  const [editingIdx, setEditingIdx] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);
  const addresses = user?.addresses || [];

  useEffect(() => {
    if (tab === "addresses" && zones.length === 0) {
      getZones().then(({ data }) => setZones(data.zones)).catch(() => {});
    }
  }, [tab, zones.length]);

  // Sync tab from URL (handles browser back/forward and direct links)
  useEffect(() => { setTab(getTabFromPath(location.pathname)); }, [location.pathname]);

  const switchTab = (key, path) => { setTab(key); navigate(path, { replace: true }); };

  useEffect(() => {
    if (tab !== "orders") return;
    setOrdersLoading(true);
    getMyOrders().then(({ data }) => setOrders(data.orders)).catch(() => {}).finally(() => setOrdersLoading(false));
  }, [tab]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile(form);
      refreshUser(data.user);
      toast.success("Profile updated successfully.");
    } catch (e) { toast.error(e.response?.data?.message || "Update failed."); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error("Passwords do not match."); return; }
    setSaving(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwForm({ current_password:"", new_password:"", confirm_password:"" });
      toast.success("Password changed successfully.");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to change password."); }
    finally { setSaving(false); }
  };

  const handleReorder = async (order) => {
    setReordering(order.id);
    let added = 0;
    try {
      for (const item of order.items || []) {
        try {
          await addItem(item.product_id, item.size, item.color, item.quantity);
          added++;
        } catch { /* skip unavailable items silently */ }
      }
      if (added > 0) toast.success(`${added} item${added !== 1 ? "s" : ""} added to your cart.`);
      else toast.warning("None of these items are currently available.");
    } finally { setReordering(null); }
  };

  // ── Address CRUD (all persisted via PUT /auth/addresses, one array) ────
  const openAddAddress = () => { setAddrForm(emptyAddress()); setEditingIdx(null); setAddrModal("add"); };
  const openEditAddress = (a, idx) => { setAddrForm({ ...emptyAddress(), ...a }); setEditingIdx(idx); setAddrModal("edit"); };

  const persistAddresses = async (next) => {
    const { data } = await updateAddresses(next);
    refreshUser({ ...user, addresses: data.addresses });
  };

  const saveAddress = async () => {
    if (!addrForm.full_name || !addrForm.phone || !addrForm.area || !addrForm.address) {
      toast.warning("Name, phone, area, and address are required.");
      return;
    }
    setAddrSaving(true);
    try {
      let next = [...addresses];
      if (editingIdx !== null) {
        next[editingIdx] = { ...next[editingIdx], ...addrForm };
      } else {
        next = [{ ...addrForm, is_default: next.length === 0 }, ...next];
      }
      await persistAddresses(next);
      setAddrModal(null);
      toast.success("Address saved.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save address.");
    } finally {
      setAddrSaving(false);
    }
  };

  const deleteAddress = async (idx) => {
    if (!window.confirm("Remove this saved address?")) return;
    const next = addresses.filter((_, i) => i !== idx);
    if (next.length > 0 && !next.some((a) => a.is_default)) next[0].is_default = true;
    try {
      await persistAddresses(next);
      toast.success("Address removed.");
    } catch {
      toast.error("Could not remove address.");
    }
  };

  const makeDefault = async (idx) => {
    const next = addresses.map((a, i) => ({ ...a, is_default: i === idx }));
    try {
      await persistAddresses(next);
    } catch {
      toast.error("Could not update default address.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">My Account</h1>
          <p className="text-sm text-charcoal/60 mt-1">{user?.email}</p>
          {!user?.is_email_verified && (
            <span className="mt-2 inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">Email not verified</span>
          )}
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-ink">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="flex flex-col gap-8 sm:flex-row">
        {/* Tabs sidebar */}
        <aside className="flex flex-row gap-1 sm:flex-col sm:w-44">
          {TABS.map(({ key, label, icon: Icon, path }) => (
            <button key={key} onClick={() => switchTab(key, path)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${tab === key ? "bg-ink text-paper" : "text-charcoal/70 hover:text-ink"}`}>
              <Icon size={15} /><span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 border border-ink/10 p-6">

          {/* Profile */}
          {tab === "profile" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl mb-4">Profile Information</h2>
              {[{ label: "First Name", key: "first_name" }, { label: "Last Name", key: "last_name" }, { label: "Phone", key: "phone" }].map(({ label, key }) => (
                <div key={key}>
                  <label className="eyebrow mb-1 block">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div>
                <label className="eyebrow mb-1 block">Email</label>
                <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div>
              <h2 className="font-display text-xl mb-4">Order History</h2>
              {ordersLoading ? (
                <div className="py-8 text-center text-charcoal/50 text-sm">Loading orders…</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-ink/15">
                  <Package size={32} className="mx-auto mb-3 text-charcoal/25" />
                  <p className="text-charcoal/50 text-sm">No orders yet.</p>
                  <Link to="/shop" className="mt-4 inline-block btn-primary text-xs">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <div key={o.id} className="border border-ink/10 overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-cream/30">
                        <div>
                          <p className="font-mono font-medium text-sm">{o.order_number}</p>
                          <p className="text-xs text-charcoal/60 mt-0.5">{new Date(o.createdAt).toLocaleDateString("en-EG", { day:"numeric", month:"long", year:"numeric" })}</p>
                        </div>
                        <span className={`inline-block border px-2 py-0.5 text-[11px] uppercase ${STATUS_BADGE[o.status] || ""}`}>{o.status}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{formatPrice(o.total_amount)}</span>
                          {/* Re-order button */}
                          <button onClick={() => handleReorder(o)} disabled={reordering === o.id}
                            title="Add all items back to cart"
                            className="flex items-center gap-1.5 text-xs border border-ink/20 px-3 py-1.5 hover:border-ink transition-colors disabled:opacity-50">
                            <RotateCcw size={12} className={reordering === o.id ? "animate-spin" : ""} />
                            Reorder
                          </button>
                          {/* Cancel button (only for pending/processing) */}
                          {["pending","processing"].includes(o.status) && (
                            <Link to={`/cancel-order/${o.id}`} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors">
                              Cancel
                            </Link>
                          )}
                          {/* Return button (only for delivered) */}
                          {o.status === "delivered" && (
                            <Link to={`/return-order/${o.id}`} className="text-xs text-charcoal/60 border border-ink/20 px-3 py-1.5 hover:border-ink transition-colors">
                              Return
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="divide-y divide-ink/5 px-4">
                        {o.items?.map(i => (
                          <div key={i.id} className="flex justify-between py-2.5 text-sm">
                            <span className="text-charcoal/80">{i.product_name} {i.size ? `(${i.size})` : ""}{i.color ? ` · ${i.color}` : ""} × {i.quantity}</span>
                            <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl">Saved Addresses</h2>
                <button onClick={openAddAddress} className="btn-primary text-xs px-4 py-2"><Plus size={14} /> Add Address</button>
              </div>

              {addresses.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-ink/15">
                  <MapPin size={32} className="mx-auto mb-3 text-charcoal/25" />
                  <p className="text-charcoal/50 text-sm">No saved addresses yet.</p>
                  <p className="text-xs text-charcoal/40 mt-1">Addresses are also saved automatically the first time you check out.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {addresses.map((a, idx) => (
                    <div key={idx} className={`border p-4 space-y-1.5 relative ${a.is_default ? "border-ink" : "border-ink/12"}`}>
                      {a.is_default && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink">
                          <Star size={11} className="fill-ink" /> Default
                        </span>
                      )}
                      <p className="text-sm font-medium">{a.full_name}</p>
                      <p className="text-xs text-charcoal/60">{a.phone}</p>
                      <p className="text-xs text-charcoal/70">
                        {a.area}, {a.city || "Cairo"}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        {a.address}
                        {a.building_number ? `, Bldg ${a.building_number}` : ""}
                        {a.floor ? `, Floor ${a.floor}` : ""}
                        {a.apartment_number ? `, Apt ${a.apartment_number}` : ""}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        {!a.is_default && (
                          <button onClick={() => makeDefault(idx)} className="text-xs text-charcoal/60 underline hover:text-ink">Set as default</button>
                        )}
                        <button onClick={() => openEditAddress(a, idx)} className="text-charcoal/50 hover:text-ink"><Pencil size={13} /></button>
                        <button onClick={() => deleteAddress(idx)} className="text-charcoal/50 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Password */}
          {tab === "password" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl mb-4">Change Password</h2>
              {[
                { label: "Current Password", key: "current_password" },
                { label: "New Password", key: "new_password" },
                { label: "Confirm New Password", key: "confirm_password" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="eyebrow mb-1 block">{label}</label>
                  <input type="password" minLength={key !== "current_password" ? 8 : undefined}
                    value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field" />
                </div>
              ))}
              <button onClick={savePassword} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Update Password"}</button>
              <div className="pt-2">
                <Link to="/forgot-password" className="text-xs text-charcoal/60 underline hover:text-ink">Forgot your current password?</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address add/edit modal */}
      {addrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setAddrModal(null)}>
          <div className="w-full max-w-md bg-paper p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl">{addrModal === "add" ? "Add Address" : "Edit Address"}</h2>

            {[
              { label: "Full Name *", key: "full_name" },
              { label: "Phone *", key: "phone" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="eyebrow mb-1 block text-charcoal/60">{label}</label>
                <input value={addrForm[key]} onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
              </div>
            ))}

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">City</label>
              <input value="Cairo" disabled className="input-field opacity-60 cursor-not-allowed" />
            </div>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Area *</label>
              <select value={addrForm.area} onChange={e => setAddrForm(f => ({ ...f, area: e.target.value }))} className="input-field">
                <option value="">Select area…</option>
                {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            </div>

            <div>
              <label className="eyebrow mb-1 block text-charcoal/60">Street Address *</label>
              <input value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))} className="input-field" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Building", key: "building_number" },
                { label: "Floor", key: "floor" },
                { label: "Apartment", key: "apartment_number" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="eyebrow mb-1 block text-charcoal/60">{label}</label>
                  <input value={addrForm[key]} onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveAddress} disabled={addrSaving} className="btn-primary">{addrSaving ? "Saving…" : "Save Address"}</button>
              <button onClick={() => setAddrModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
