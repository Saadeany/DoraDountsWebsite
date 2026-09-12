import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { getOrderById } from "../api/orders";
import { submitReturnRequest } from "../api/returns";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/format";

const CANCELLATION_REASONS = [
  { value: "changed_mind",        label: "I changed my mind" },
  { value: "found_better_price",  label: "Found a better price elsewhere" },
  { value: "duplicate_order",     label: "Accidentally placed a duplicate order" },
  { value: "wrong_item_ordered",  label: "Ordered the wrong item" },
  { value: "delivery_too_slow",   label: "Delivery time is too long" },
  { value: "other",               label: "Other reason" },
];

const CANCELLABLE_STATUSES = ["pending", "processing"];
const STATUS_LABELS = { pending: "Pending", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const STATUS_COLORS = { pending: "text-yellow-600 bg-yellow-50 border-yellow-200", processing: "text-blue-600 bg-blue-50 border-blue-200", shipped: "text-purple-600 bg-purple-50 border-purple-200", delivered: "text-green-600 bg-green-50 border-green-200", cancelled: "text-red-600 bg-red-50 border-red-200" };

const CancelOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    getOrderById(orderId)
      .then(({ data }) => setOrder(data.order))
      .catch(() => toast.error("Order not found."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const canCancel = order && CANCELLABLE_STATUSES.includes(order.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.warning("Please select a reason for cancellation."); return; }
    if (!confirmed) { toast.warning("Please confirm you have read and understood the cancellation policy."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("order_id", orderId);
      fd.append("type", "cancellation");
      fd.append("reason", reason);
      if (description.trim()) fd.append("description", description.trim());
      const { data } = await submitReturnRequest(fd);
      setRequestNumber(data.request.request_number);
      setSubmitted(true);
      toast.success("Cancellation request submitted!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-charcoal/60">Loading order…</div>;

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <CheckCircle size={56} className="mx-auto text-green-500" strokeWidth={1.5} />
        <h1 className="font-display text-3xl">Request Submitted</h1>
        <div className="stitch-rule mx-auto w-20 text-ink/20" />
        <div className="border border-ink/10 p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-charcoal/60">Request number</span><span className="font-mono font-medium">{requestNumber}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Order</span><span>{order?.order_number}</span></div>
          <div className="flex justify-between"><span className="text-charcoal/60">Status</span><span className="text-amber-600 font-medium">Pending Review</span></div>
        </div>
        <p className="text-sm text-charcoal/70">We'll email you within 24 hours with our decision. If approved, your order will be cancelled and any payment refunded within 5–7 business days.</p>
        <div className="flex justify-center gap-4">
          <Link to="/profile/orders" className="btn-primary">My Orders</Link>
          <Link to="/shop" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link to="/profile/orders" className="text-xs text-charcoal/60 hover:text-ink flex items-center gap-1 mb-4">← Back to My Orders</Link>
        <h1 className="font-display text-3xl">Cancel Order</h1>
        <div className="stitch-rule mt-3 w-20 text-ink/30" />
      </div>

      {/* Order summary */}
      {order && (
        <div className="border border-ink/10 p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-medium">{order.order_number}</p>
              <p className="text-xs text-charcoal/60 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-EG", { day:"numeric", month:"long", year:"numeric" })}</p>
            </div>
            <span className={`border px-2.5 py-1 text-xs uppercase font-medium rounded ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="stitch-rule text-ink/15" />
          <div className="space-y-1.5">
            {order.items?.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-charcoal/75">{i.product_name} {i.size ? `(${i.size})` : ""} × {i.quantity}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-medium text-sm border-t border-ink/10 pt-2">
            <span>Total Paid</span><span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      )}

      {/* Can't cancel — already shipped/delivered */}
      {order && !canCancel ? (
        <div className="border border-red-200 bg-red-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle size={20} />
            <h2 className="font-medium">This order cannot be cancelled</h2>
          </div>
          <p className="text-sm text-red-700">
            Orders can only be cancelled while in <strong>Pending</strong> or <strong>Processing</strong> status.
            Your order is currently <strong>{STATUS_LABELS[order.status]}</strong>.
          </p>
          {order.status === "shipped" && (
            <p className="text-sm text-red-700">
              Your order is already on its way. Once you receive it, you can submit a <strong>Return request</strong> within 14 days.
            </p>
          )}
          {order.status === "delivered" && (
            <div className="pt-2">
              <Link to={`/return-order/${orderId}`} className="btn-primary inline-flex text-sm">Submit a Return Instead</Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Policy box */}
          <div className="border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
              <Info size={16} />
              Cancellation Policy
            </div>
            <ul className="text-xs text-amber-800 space-y-1.5 list-inside">
              <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span>Cancellations are reviewed manually by our team within 24 hours.</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span>Once an order has been <strong>shipped</strong>, it cannot be cancelled.</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span>If approved and you paid online, the refund will be processed within <strong>5–7 business days</strong>.</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span>Cash on Delivery orders with no payment collected will be cancelled at no charge.</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">•</span>Repeated cancellations may result in order restrictions on your account.</li>
            </ul>
          </div>

          {/* Reason */}
          <div>
            <label className="eyebrow mb-2 block">Reason for Cancellation *</label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 border p-3 cursor-pointer transition-colors ${reason === r.value ? "border-ink bg-cream" : "border-ink/15 hover:border-ink/40"}`}>
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="eyebrow mb-1 block">Additional Details (optional)</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Any additional information that might help us process your request…"
              className="input-field resize-none" />
          </div>

          {/* Confirmation checkbox */}
          <label className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${confirmed ? "border-ink bg-cream" : "border-ink/20"}`}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 shrink-0" />
            <span className="text-sm text-charcoal/80">
              I understand that submitting this request does <strong>not</strong> guarantee cancellation, and I will receive an email with the final decision within 24 hours. If the order has already been prepared for shipping, cancellation may not be possible.
            </span>
          </label>

          <button type="submit" disabled={submitting || !reason} className="btn-primary w-full">
            {submitting ? "Submitting Request…" : "Submit Cancellation Request"}
          </button>
          <Link to="/profile/orders" className="block text-center text-xs text-charcoal/60 hover:text-ink">
            Go back — keep my order
          </Link>
        </form>
      )}
    </div>
  );
};

export default CancelOrderPage;
