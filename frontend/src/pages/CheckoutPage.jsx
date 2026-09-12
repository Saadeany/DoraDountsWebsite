import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, LocateFixed, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { checkout } from "../api/orders";
import { getZones } from "../api/zones";
import { formatPrice, getFinalPrice, getPrimaryImage } from "../utils/format";

const TAX_RATE = 0.14;
const FREE_SHIPPING_THRESHOLD = 1500;

const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery", note: null },
  { value: "vodafone_cash",    label: "Vodafone Cash",    note: "You'll receive transfer instructions by email after placing this order." },
  { value: "instapay",         label: "InstaPay",         note: "You'll receive transfer instructions by email after placing this order." },
];

const emptyForm = () => ({
  shipping_full_name: "",
  shipping_phone: "",
  shipping_email: "",
  shipping_address: "",
  shipping_building: "",
  shipping_floor: "",
  shipping_apartment: "",
  zone_id: "",
  payment_method: "cash_on_delivery",
});

const Field = ({ label, name, type = "text", required = true, form, update, placeholder }) => (
  <div>
    <label className="eyebrow mb-1 block">{label}</label>
    <input
      type={type}
      required={required}
      value={form[name]}
      placeholder={placeholder}
      onChange={(e) => update(name, e.target.value)}
      className="input-field"
    />
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const coupon = location.state?.coupon || null;
  const { items, subtotal, refreshCart } = useCart();
  const { user } = useAuth();

  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [savedAddressChoice, setSavedAddressChoice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getZones().then(({ data }) => setZones(data.zones)).catch(() => setZones([]));
  }, []);

  // Prefill from the account once (name/phone/email), so the customer isn't
  // typing those every time.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      shipping_full_name: f.shipping_full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      shipping_phone: f.shipping_phone || user.phone || "",
      shipping_email: f.shipping_email || user.email || "",
    }));
  }, [user]);

  const selectedZone = zones.find((z) => String(z.id) === String(form.zone_id));
  const shippingPrice = selectedZone ? parseFloat(selectedZone.shipping_price) : null;

  const discount = coupon ? subtotal * (coupon.discount / 100) : 0;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * TAX_RATE;
  const shipping = shippingPrice === null
    ? null
    : (taxableAmount >= FREE_SHIPPING_THRESHOLD ? 0 : shippingPrice);
  const total = shipping === null ? null : taxableAmount + tax + shipping;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Saved address reuse ──────────────────────────────────────────────
  const savedAddresses = user?.addresses || [];
  const applySavedAddress = (idx) => {
    setSavedAddressChoice(idx);
    if (idx === "") return;
    const addr = savedAddresses[parseInt(idx, 10)];
    if (!addr) return;
    const matchedZone = zones.find((z) => z.name === addr.area);
    setForm((f) => ({
      ...f,
      shipping_full_name: addr.full_name || f.shipping_full_name,
      shipping_phone: addr.phone || f.shipping_phone,
      shipping_address: addr.address || "",
      shipping_building: addr.building_number || "",
      shipping_floor: addr.floor || "",
      shipping_apartment: addr.apartment_number || "",
      zone_id: matchedZone ? String(matchedZone.id) : f.zone_id,
    }));
    if (addr.latitude && addr.longitude) {
      setCoords({ lat: addr.latitude, lng: addr.longitude });
    }
  };

  // ── Optional map pin via browser geolocation ─────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location sharing.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location. You can still check out without it.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.zone_id) {
      setError("Please select your delivery area.");
      return;
    }
    if (selectedZone && !selectedZone.is_deliverable) {
      setError(`We're sorry, we don't currently deliver to "${selectedZone.name}". Please choose a different area.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        shipping_country: "Egypt",
        shipping_lat: coords?.lat ?? null,
        shipping_lng: coords?.lng ?? null,
      };
      if (coupon) payload.coupon_code = coupon.code;
      const { data } = await checkout(payload);
      await refreshCart();
      navigate(`/order-success/${data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const selectedPayment = PAYMENT_METHODS.find((p) => p.value === form.payment_method);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl mb-8">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Shipping form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-ink/10 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl">Shipping Information</h2>
                {savedAddresses.length > 0 && (
                  <select
                    value={savedAddressChoice}
                    onChange={(e) => applySavedAddress(e.target.value)}
                    className="input-field w-auto text-xs py-1.5"
                  >
                    <option value="">Use a saved address…</option>
                    {savedAddresses.map((a, i) => (
                      <option key={i} value={i}>
                        {a.area || "Address"}{a.is_default ? " (default)" : ""} — {a.address?.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" name="shipping_full_name" form={form} update={update} />
                <Field label="Phone" name="shipping_phone" type="tel" form={form} update={update} />
                <Field label="Email" name="shipping_email" type="email" form={form} update={update} />

                <div>
                  <label className="eyebrow mb-1 block">City</label>
                  <input value="Cairo" disabled className="input-field opacity-60 cursor-not-allowed" />
                </div>

                <div className="sm:col-span-2">
                  <label className="eyebrow mb-1 block">Area *</label>
                  <select
                    required
                    value={form.zone_id}
                    onChange={(e) => update("zone_id", e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select your area…</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id} disabled={!z.is_deliverable}>
                        {z.name}{!z.is_deliverable ? " — not currently deliverable" : ` — ${parseFloat(z.shipping_price).toLocaleString()} EGP shipping`}
                      </option>
                    ))}
                  </select>
                  {selectedZone && !selectedZone.is_deliverable && (
                    <p className="mt-1.5 text-xs text-red-500">We don't currently deliver to this area — please pick another one.</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="eyebrow mb-1 block">Street Address</label>
                  <input
                    required
                    value={form.shipping_address}
                    onChange={(e) => update("shipping_address", e.target.value)}
                    className="input-field"
                    placeholder="Street name, landmark"
                  />
                </div>

                <Field label="Building No." name="shipping_building" required={false} form={form} update={update} />
                <Field label="Floor" name="shipping_floor" required={false} form={form} update={update} />
                <Field label="Apartment No." name="shipping_apartment" required={false} form={form} update={update} />
              </div>

              {/* Optional map pin */}
              <div className="mt-5 border-t border-ink/10 pt-4">
                <p className="eyebrow mb-2">Pin your location (optional)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={useMyLocation} disabled={locating}
                    className="btn-outline text-xs px-4 py-2">
                    <LocateFixed size={14} /> {locating ? "Locating…" : "Use My Current Location"}
                  </button>
                  {coords && (
                    <a
                      href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-green-700"
                    >
                      <Check size={13} /> Location pinned — <span className="underline">view on map</span>
                    </a>
                  )}
                </div>
                {locateError && <p className="mt-1.5 text-xs text-charcoal/50">{locateError}</p>}
                <p className="mt-1.5 text-xs text-charcoal/45">
                  <MapPin size={11} className="inline -mt-0.5 mr-1" />
                  This helps our delivery rider find you faster — it's optional and separate from the Area/Address above.
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div className="border border-ink/10 p-6">
              <h2 className="font-display text-xl mb-5">Payment Method</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-3 cursor-pointer border p-3 transition-colors ${
                      form.payment_method === pm.value ? "border-ink bg-cream" : "border-ink/15 hover:border-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.value}
                      checked={form.payment_method === pm.value}
                      onChange={(e) => update("payment_method", e.target.value)}
                    />
                    <span className="text-sm">{pm.label}</span>
                  </label>
                ))}
              </div>
              {selectedPayment?.note && (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {selectedPayment.note} You'll then send a screenshot of the transfer on WhatsApp with your order
                  number so we can confirm it before shipping.
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 border border-red-200">{error}</p>}
          </div>

          {/* Order summary sidebar */}
          <div className="h-fit space-y-4 border border-ink/10 p-6">
            <h2 className="font-display text-xl">Order Summary</h2>
            <div className="stitch-rule text-ink/20" />
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {items.map((item) => {
                const fp = getFinalPrice(item.Product?.price, item.Product?.discount);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={getPrimaryImage(item.Product)} alt={item.Product?.name} className="h-14 w-11 object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{item.Product?.name}</p>
                      {item.size && <p className="text-xs text-charcoal/50">Size: {item.size}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs">×{item.quantity}</p>
                      <p className="text-xs font-medium">{formatPrice(fp * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="stitch-rule text-ink/20" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-charcoal/60">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({coupon.code})</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-charcoal/60">Tax (14%)</span><span>{formatPrice(tax)}</span></div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Shipping</span>
                <span>{shipping === null ? "Select an area" : shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="stitch-rule text-ink/20 !my-3" />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span><span>{total === null ? "—" : formatPrice(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
