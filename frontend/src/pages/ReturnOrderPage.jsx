import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Upload, X, AlertTriangle, Info, Camera, Package, Shield, Clock, Ruler } from "lucide-react";
import { getOrderById } from "../api/orders";
import { submitReturnRequest } from "../api/returns";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/format";

const RETURN_REASONS = [
  { value: "wrong_size",              label: "Wrong size — item doesn't fit",            requiresPhoto: false },
  { value: "wrong_color",             label: "Wrong color received",                      requiresPhoto: true  },
  { value: "wrong_item_received",     label: "Wrong item sent by store",                  requiresPhoto: true  },
  { value: "item_damaged",            label: "Item arrived damaged",                       requiresPhoto: true  },
  { value: "item_defective",          label: "Item has a manufacturing defect",            requiresPhoto: true  },
  { value: "item_not_as_described",   label: "Item differs significantly from photos",     requiresPhoto: true  },
  { value: "quality_not_acceptable",  label: "Quality below expected standard",            requiresPhoto: true  },
  { value: "missing_parts",           label: "Parts or accessories missing",               requiresPhoto: true  },
  { value: "other",                   label: "Other (please describe below)",              requiresPhoto: false },
];

const POLICY_SECTIONS = [
  {
    icon: Clock,
    title: "14-Day Return Window",
    points: [
      "Returns must be submitted within 14 days of the delivery date.",
      "The 14-day window begins on the date the order status changes to Delivered.",
      "Requests submitted after this window will not be accepted.",
    ],
  },
  {
    icon: Package,
    title: "Item Condition Requirements",
    points: [
      "Item must be unworn — no signs of use, sweat marks, or body odour.",
      "Item must be unwashed and unaltered in any way.",
      "All original tags must be attached and intact.",
      "Item should be in its original packaging where possible.",
      "Items with removed tags, stains, or alterations will be rejected.",
      "Items that smell of perfume or cigarettes may be rejected.",
    ],
  },
  {
    icon: Camera,
    title: "Photo Evidence Required",
    points: [
      "For damaged, defective, or wrong items — clear photos are mandatory.",
      "Photos must show the defect, damage, or discrepancy clearly.",
      "Include a photo of the item tag and packaging if possible.",
      "Maximum 5 photos, each up to 8 MB, JPG/PNG/WEBP only.",
      "Requests without required photos will not be processed.",
    ],
  },
  {
    icon: Shield,
    title: "Non-Returnable Items",
    points: [
      "Items marked as SALE or discounted more than 30% at time of purchase.",
      "Underwear, swimwear, and socks for hygiene reasons.",
      "Customised or personalised items.",
      "Items with broken seals on sealed packaging.",
      "Gift cards and store credit.",
    ],
  },
  {
    icon: Ruler,
    title: "Size Exchanges",
    points: [
      "Size exchanges are subject to stock availability.",
      "If the requested size is unavailable, a refund will be issued instead.",
      "You pay no additional fee for size exchanges — we cover the difference.",
      "Only one size exchange is allowed per item.",
    ],
  },
];

const REFUND_INFO = [
  { method: "Cash on Delivery orders", timeline: "Refunded via InstaPay or Vodafone Cash within 5–7 business days" },
  { method: "Credit Card payments",    timeline: "Reversed to original card within 7–14 business days" },
  { method: "Vodafone Cash",           timeline: "Returned to original Vodafone Cash number within 5–7 business days" },
  { method: "InstaPay",                timeline: "Returned to original InstaPay account within 5–7 business days" },
];

const ReturnOrderPage = () => {
  const { orderId } = useParams();
  const toast = useToast();
  const fileInputRef = useRef();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("return");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [policyOpen, setPolicyOpen] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    getOrderById(orderId)
      .then(({ data }) => {
        setOrder(data.order);
        // Pre-select all items
        setSelectedItems(data.order.items?.map(i => ({ ...i, selected: true, return_qty: i.quantity })) || []);
      })
      .catch(() => toast.error("Order not found."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const selectedReason = RETURN_REASONS.find(r => r.value === reason);
  const photoRequired = selectedReason?.requiresPhoto && type !== "cancellation";

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) { toast.warning("Maximum 5 photos allowed."); return; }
    const newImages = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(images[idx].preview);
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleItem = (id) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.warning("Please select a reason."); return; }
    if (!selectedItems.some(i => i.selected)) { toast.warning("Please select at least one item."); return; }
    if (photoRequired && images.length === 0) {
      toast.warning("Photo evidence is required for this return reason. Please upload at least one photo.");
      return;
    }
    if (!agreed) { toast.warning("Please confirm you have read and agree to the Return Policy."); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("order_id", orderId);
      fd.append("type", type);
      fd.append("reason", reason);
      if (description.trim()) fd.append("description", description.trim());
      fd.append("items", JSON.stringify(
        selectedItems.filter(i => i.selected).map(i => ({
          order_item_id: i.id,
          product_name: i.product_name,
          size: i.size,
          color: i.color,
          quantity: i.return_qty || i.quantity,
        }))
      ));
      images.forEach(({ file }) => fd.append("images", file));

      const { data } = await submitReturnRequest(fd);
      setRequestData(data.request);
      setSubmitted(true);
      toast.success("Return request submitted!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-charcoal/60">Loading order…</div>;

  if (submitted && requestData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <CheckCircle size={56} className="mx-auto text-green-500" strokeWidth={1.5} />
        <h1 className="font-display text-3xl">Request Submitted</h1>
        <div className="stitch-rule mx-auto w-20 text-ink/20" />
        <div className="border border-ink/10 p-5 text-left space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-charcoal/60">Request number</span><span className="font-mono font-medium">{requestData.request_number}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Type</span><span className="capitalize">{requestData.type}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Order</span><span>{order?.order_number}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Status</span><span className="text-amber-600 font-medium">Pending Review</span></div>
        </div>
        <div className="border border-ink/10 p-4 text-sm text-left space-y-1.5">
          <p className="font-medium mb-2">What happens next?</p>
          <p className="text-charcoal/70">1. Our team will review your request within <strong>24–48 hours</strong>.</p>
          <p className="text-charcoal/70">2. You'll receive an email with instructions or our decision.</p>
          {requestData.type === "return" && <p className="text-charcoal/70">3. If approved, we'll arrange pickup or a drop-off location.</p>}
          <p className="text-charcoal/70">{requestData.type === "return" ? "4." : "3."} Refund or exchange processed within <strong>5–7 business days</strong> of item receipt.</p>
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/profile/orders" className="btn-primary">My Orders</Link>
          <Link to="/shop" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/profile/orders" className="text-xs text-charcoal/60 hover:text-ink flex items-center gap-1 mb-6">← Back to My Orders</Link>
      <div className="mb-8">
        <h1 className="font-display text-3xl">Return / Exchange</h1>
        <div className="stitch-rule mt-3 w-20 text-ink/30" />
        {order && <p className="text-sm text-charcoal/60 mt-2">For order <span className="font-mono">{order.order_number}</span></p>}
      </div>

      {/* ── Return Policy Accordion ─────────────────────────────────────── */}
      <section className="mb-8 border border-ink/10">
        <div className="bg-cream/50 px-5 py-3 border-b border-ink/10">
          <h2 className="font-medium text-sm flex items-center gap-2"><Shield size={15} /> Return Policy — Please Read Before Submitting</h2>
        </div>
        {POLICY_SECTIONS.map(({ icon: Icon, title, points }) => (
          <div key={title} className="border-b border-ink/10 last:border-0">
            <button onClick={() => setPolicyOpen(policyOpen === title ? null : title)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-cream/40 transition-colors">
              <div className="flex items-center gap-2.5 text-sm font-medium"><Icon size={15} className="text-charcoal/50" />{title}</div>
              <span className="text-charcoal/40 text-lg">{policyOpen === title ? "−" : "+"}</span>
            </button>
            {policyOpen === title && (
              <ul className="px-5 pb-4 space-y-1.5">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-charcoal/70">
                    <span className="text-ink mt-0.5 shrink-0">•</span>{p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      {/* ── Refund Timeline ────────────────────────────────────────────── */}
      <section className="mb-8 border border-ink/10 p-5">
        <h2 className="font-medium text-sm mb-3 flex items-center gap-2"><Clock size={15} /> Refund Timelines</h2>
        <div className="space-y-2">
          {REFUND_INFO.map(({ method, timeline }) => (
            <div key={method} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 text-xs">
              <span className="font-medium text-charcoal/80">{method}</span>
              <span className="text-charcoal/60">{timeline}</span>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <div>
          <label className="eyebrow mb-2 block">Request Type *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value:"return",   label:"Return for Refund",   desc:"Send item back and get your money back" },
              { value:"exchange", label:"Exchange for Size",    desc:"Swap for a different size or color" },
            ].map(t => (
              <label key={t.value} className={`flex flex-col gap-1 border p-4 cursor-pointer transition-colors ${type === t.value ? "border-ink bg-cream" : "border-ink/20 hover:border-ink/50"}`}>
                <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="sr-only" />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-charcoal/60">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <label className="eyebrow mb-2 block">Select Items to Return *</label>
          <div className="space-y-2">
            {selectedItems.map(item => (
              <label key={item.id} className={`flex items-center gap-3 border p-3 cursor-pointer transition-colors ${item.selected ? "border-ink bg-cream/50" : "border-ink/15"}`}>
                <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{item.product_name}</span>
                  {item.size && <span className="text-charcoal/60"> · Size {item.size}</span>}
                  {item.color && <span className="text-charcoal/60"> · {item.color}</span>}
                </div>
                <span className="text-sm text-charcoal/60">× {item.quantity}</span>
                <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="eyebrow mb-2 block">Reason for Return *</label>
          <div className="space-y-2">
            {RETURN_REASONS.map(r => (
              <label key={r.value} className={`flex items-start gap-3 border p-3 cursor-pointer transition-colors ${reason === r.value ? "border-ink bg-cream" : "border-ink/15 hover:border-ink/40"}`}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm">{r.label}</span>
                  {r.requiresPhoto && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Photo required</span>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="eyebrow mb-1 block">
            Additional Details {reason === "other" && <span className="text-red-500">*</span>}
          </label>
          <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
            placeholder={reason === "item_damaged" ? "Describe where and how the item is damaged. When did you first notice it?" :
              reason === "wrong_item_received" ? "What item did you receive? What was on the label vs. what you ordered?" :
              reason === "quality_not_acceptable" ? "Describe the quality issue — stitching, fabric, colour, etc." :
              "Please describe the issue in as much detail as possible. The more context you provide, the faster we can resolve this."}
            className="input-field resize-none" />
        </div>

        {/* Photo upload */}
        <div>
          <label className="eyebrow mb-1 block">
            Evidence Photos {photoRequired && <span className="text-red-500">* Required</span>}
          </label>
          <p className="text-xs text-charcoal/60 mb-3">
            {photoRequired
              ? "Clear photos are required for this return reason. Show the defect, damage, or discrepancy. Include a photo of the tag."
              : "Optional but recommended. Photos help us process your request faster."}
          </p>

          {/* Uploaded previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map(({ preview }, idx) => (
                <div key={idx} className="relative group">
                  <img src={preview} alt={`Evidence ${idx + 1}`} className="h-20 w-20 object-cover border border-ink/15" />
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border border-dashed border-ink/30 px-4 py-3 text-sm text-charcoal/60 hover:border-ink hover:text-ink transition-colors">
              <Upload size={16} />
              Upload Photos ({images.length}/5)
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageAdd} />
        </div>

        {/* Policy agreement */}
        <div className="border border-ink/15 p-4 bg-cream/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 shrink-0" />
            <span className="text-sm text-charcoal/80">
              I confirm that I have read and understood the Return Policy above. The item(s) I am returning are unworn, unwashed, and have all original tags attached. I understand that items not meeting these conditions will be rejected and returned to me at my cost.
            </span>
          </label>
        </div>

        {/* Warning */}
        {photoRequired && images.length === 0 && reason && (
          <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Photo evidence is required for this reason. Your request cannot be submitted without at least one photo.
          </div>
        )}

        <button type="submit" disabled={submitting || !reason || !agreed || (photoRequired && images.length === 0)}
          className="btn-primary w-full disabled:opacity-50">
          {submitting ? "Submitting Request…" : `Submit ${type === "exchange" ? "Exchange" : "Return"} Request`}
        </button>
        <Link to="/profile/orders" className="block text-center text-xs text-charcoal/60 hover:text-ink">
          Cancel — keep my order
        </Link>
      </form>
    </div>
  );
};

export default ReturnOrderPage;
