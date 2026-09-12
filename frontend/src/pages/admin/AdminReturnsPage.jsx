import React, { useState, useEffect, useCallback } from "react";
import { Eye, CheckCircle, XCircle, Clock, RefreshCw, Package } from "lucide-react";
import { getAdminReturns, updateReturnRequest, deleteReturnImage } from "../../api/returns";
import { formatPrice } from "../../utils/format";
import Loader from "../../components/common/Loader";

const TYPE_LABELS  = { cancellation:"Cancellation", return:"Return", exchange:"Exchange" };
const STATUS_CONFIG = {
  pending:   { color:"bg-yellow-100 text-yellow-800", label:"Pending"   },
  reviewing: { color:"bg-blue-100 text-blue-800",     label:"Reviewing" },
  approved:  { color:"bg-green-100 text-green-800",   label:"Approved"  },
  rejected:  { color:"bg-red-100 text-red-800",       label:"Rejected"  },
  refunded:  { color:"bg-purple-100 text-purple-800", label:"Refunded"  },
  exchanged: { color:"bg-indigo-100 text-indigo-800", label:"Exchanged" },
  closed:    { color:"bg-gray-100 text-gray-700",     label:"Closed"    },
};
const REASON_LABELS = {
  changed_mind:"Changed mind", found_better_price:"Found better price",
  duplicate_order:"Duplicate order", wrong_item_ordered:"Wrong item ordered",
  delivery_too_slow:"Delivery too slow", item_damaged:"Item damaged",
  item_defective:"Item defective", wrong_item_received:"Wrong item received",
  wrong_size:"Wrong size", wrong_color:"Wrong color",
  item_not_as_described:"Not as described", quality_not_acceptable:"Quality unacceptable",
  missing_parts:"Missing parts", other:"Other",
};
const WORKFLOW = {
  pending:   ["reviewing","approved","rejected"],
  reviewing: ["approved","rejected"],
  approved:  ["refunded","exchanged","closed"],
  rejected:  ["closed"],
  refunded:  ["closed"],
  exchanged: ["closed"],
  closed:    [],
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color:"bg-gray-100 text-gray-700", label: status };
  return <span className={`px-2.5 py-0.5 text-xs rounded font-medium ${cfg.color}`}>{cfg.label}</span>;
};

const AdminReturnsPage = () => {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // request being reviewed
  const [actionForm, setActionForm] = useState({
    status: "", admin_notes: "", rejection_reason: "",
    refund_amount: "", refund_method: "original_payment", refund_reference: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (filterType)   params.type   = filterType;
      const { data } = await getAdminReturns(params);
      setRequests(data.requests);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [page, filterStatus, filterType]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openRequest = (req) => {
    setSelected(req);
    setActionForm({
      status: req.status,
      admin_notes: req.admin_notes || "",
      rejection_reason: req.rejection_reason || "",
      refund_amount: req.refund_amount || "",
      refund_method: req.refund_method || "original_payment",
      refund_reference: req.refund_reference || "",
    });
    setSaveMsg("");
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      await updateReturnRequest(selected.id, actionForm);
      setSaveMsg("✓ Saved successfully");
      fetchRequests();
      // Re-fetch the selected request to show updated state
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg("✗ " + (e.response?.data?.message || "Save failed"));
    } finally { setSaving(false); }
  };

  // Stats counts
  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1 text-charcoal/60">After-sale</p>
        <h1 className="font-display text-3xl">Returns & Cancellations</h1>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, { color, label }]) => (
          <div key={key} className={`px-3 py-1.5 rounded text-xs font-medium ${color}`}>
            {label}: {counts[key] || 0}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="input-field w-auto text-sm">
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="input-field w-auto text-sm">
          <option value="">All types</option>
          <option value="cancellation">Cancellations</option>
          <option value="return">Returns</option>
          <option value="exchange">Exchanges</option>
        </select>
        {(filterStatus || filterType) && (
          <button onClick={() => { setFilterStatus(""); setFilterType(""); setPage(1); }} className="text-xs text-charcoal/60 underline hover:text-ink">
            Clear filters
          </button>
        )}
      </div>

      {loading ? <Loader /> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: request list */}
          <div className="lg:col-span-2 space-y-2">
            {requests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-ink/15">
                <Package size={28} className="mx-auto mb-2 text-charcoal/25" />
                <p className="text-sm text-charcoal/50">No requests found.</p>
              </div>
            ) : requests.map(req => (
              <button key={req.id} onClick={() => openRequest(req)}
                className={`w-full text-left border p-4 space-y-2 transition-colors hover:border-ink ${selected?.id === req.id ? "border-ink bg-cream/60" : "border-ink/15"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-charcoal/60">{req.request_number}</p>
                    <p className="text-sm font-medium mt-0.5">{req.User?.first_name} {req.User?.last_name}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-charcoal/60">
                  <span className="capitalize">{TYPE_LABELS[req.type] || req.type}</span>
                  <span>{req.Order?.order_number}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal/60">{REASON_LABELS[req.reason] || req.reason}</span>
                  <span className="text-charcoal/50">{new Date(req.createdAt).toLocaleDateString("en-EG")}</span>
                </div>
                {req.images?.length > 0 && (
                  <p className="text-[10px] text-blue-600">{req.images.length} photo{req.images.length > 1 ? "s" : ""} attached</p>
                )}
              </button>
            ))}

            {pagination.total_pages > 1 && (
              <div className="flex gap-1 pt-2">
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-7 w-7 text-xs border transition-colors ${p === page ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>{p}</button>
                ))}
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="border border-dashed border-ink/15 py-20 text-center text-charcoal/40">
                <Eye size={28} className="mx-auto mb-2" />
                <p className="text-sm">Select a request to review</p>
              </div>
            ) : (
              <div className="border border-ink/15 divide-y divide-ink/10">
                {/* Header */}
                <div className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-charcoal/60">{selected.request_number}</p>
                    <h2 className="font-display text-xl mt-0.5">
                      {TYPE_LABELS[selected.type]} Request
                    </h2>
                    <p className="text-xs text-charcoal/60 mt-1">
                      Submitted {new Date(selected.createdAt).toLocaleDateString("en-EG", { day:"numeric", month:"long", year:"numeric" })}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Customer info */}
                <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="eyebrow text-charcoal/50 mb-1">Customer</p>
                    <p className="font-medium">{selected.User?.first_name} {selected.User?.last_name}</p>
                    <p className="text-charcoal/60 text-xs">{selected.User?.email}</p>
                    <p className="text-charcoal/60 text-xs">{selected.User?.phone}</p>
                  </div>
                  <div>
                    <p className="eyebrow text-charcoal/50 mb-1">Order</p>
                    <p className="font-medium font-mono">{selected.Order?.order_number}</p>
                    <p className="text-charcoal/60 text-xs">{formatPrice(selected.Order?.total_amount)}</p>
                    <p className="text-xs capitalize text-charcoal/50">{selected.Order?.status}</p>
                  </div>
                </div>

                {/* Request details */}
                <div className="p-5 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="eyebrow text-charcoal/50 mb-1">Type</p><p className="capitalize">{TYPE_LABELS[selected.type]}</p></div>
                    <div><p className="eyebrow text-charcoal/50 mb-1">Reason</p><p>{REASON_LABELS[selected.reason] || selected.reason}</p></div>
                  </div>
                  {selected.description && (
                    <div>
                      <p className="eyebrow text-charcoal/50 mb-1">Customer Notes</p>
                      <p className="text-charcoal/80 bg-cream/60 p-3 text-xs leading-relaxed">{selected.description}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                {selected.items?.length > 0 && (
                  <div className="p-5">
                    <p className="eyebrow text-charcoal/50 mb-2">Items Requested</p>
                    <div className="space-y-1.5">
                      {selected.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs border-b border-ink/5 pb-1.5">
                          <span className="text-charcoal/80">
                            {item.product_name}
                            {item.size ? ` (${item.size})` : ""}
                            {item.color ? ` · ${item.color}` : ""}
                          </span>
                          <span className="text-charcoal/60">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence photos */}
                {selected.images?.length > 0 && (
                  <div className="p-5">
                    <p className="eyebrow text-charcoal/50 mb-2">Evidence Photos ({selected.images.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Evidence ${idx+1}`} className="h-20 w-20 object-cover border border-ink/15 hover:opacity-90 transition-opacity" />
                          </a>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Remove this photo?")) return;
                              await deleteReturnImage(selected.id, idx);
                              setSelected(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
                            }}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin action panel */}
                <div className="p-5 space-y-4 bg-cream/30">
                  <h3 className="font-medium text-sm">Admin Actions</h3>

                  {/* Status update */}
                  {WORKFLOW[selected.status]?.length > 0 && (
                    <div>
                      <label className="eyebrow mb-1 block text-charcoal/60">Update Status</label>
                      <div className="flex flex-wrap gap-2">
                        {WORKFLOW[selected.status].map(s => (
                          <button key={s} onClick={() => setActionForm(f => ({ ...f, status: s }))}
                            className={`border px-3 py-1.5 text-xs capitalize transition-colors ${actionForm.status === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
                            {STATUS_CONFIG[s]?.label || s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection reason (only when rejecting) */}
                  {actionForm.status === "rejected" && (
                    <div>
                      <label className="eyebrow mb-1 block text-charcoal/60">Rejection Reason * <span className="text-red-500">(sent to customer)</span></label>
                      <textarea rows={2} value={actionForm.rejection_reason}
                        onChange={e => setActionForm(f => ({ ...f, rejection_reason: e.target.value }))}
                        placeholder="Explain why this request cannot be approved (visible to customer)…"
                        className="input-field resize-none text-sm" />
                    </div>
                  )}

                  {/* Refund fields (only when approving or refunding) */}
                  {["approved","refunded"].includes(actionForm.status) && selected.type !== "exchange" && (
                    <div className="space-y-3">
                      <div>
                        <label className="eyebrow mb-1 block text-charcoal/60">Refund Amount (EGP)</label>
                        <input type="number" value={actionForm.refund_amount} min="0"
                          onChange={e => setActionForm(f => ({ ...f, refund_amount: e.target.value }))}
                          placeholder={`Max: ${formatPrice(selected.Order?.total_amount)}`}
                          className="input-field text-sm" />
                      </div>
                      <div>
                        <label className="eyebrow mb-1 block text-charcoal/60">Refund Method</label>
                        <select value={actionForm.refund_method} onChange={e => setActionForm(f => ({ ...f, refund_method: e.target.value }))} className="input-field text-sm">
                          <option value="original_payment">Original Payment Method</option>
                          <option value="store_credit">Store Credit</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div>
                        <label className="eyebrow mb-1 block text-charcoal/60">Refund Reference / Transaction ID</label>
                        <input type="text" value={actionForm.refund_reference}
                          onChange={e => setActionForm(f => ({ ...f, refund_reference: e.target.value }))}
                          placeholder="Payment gateway reference number"
                          className="input-field text-sm" />
                      </div>
                    </div>
                  )}

                  {/* Admin notes (always visible) */}
                  <div>
                    <label className="eyebrow mb-1 block text-charcoal/60">Internal Admin Notes <span className="font-normal normal-case text-charcoal/40">(not shown to customer)</span></label>
                    <textarea rows={3} value={actionForm.admin_notes}
                      onChange={e => setActionForm(f => ({ ...f, admin_notes: e.target.value }))}
                      placeholder="Internal notes, decisions, tracking references…"
                      className="input-field resize-none text-sm" />
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-3">
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                      {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : "Save Changes"}
                    </button>
                    {saveMsg && (
                      <span className={`text-xs ${saveMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{saveMsg}</span>
                    )}
                  </div>

                  {/* Timeline */}
                  {(selected.reviewed_at || selected.resolved_at) && (
                    <div className="border-t border-ink/10 pt-3 space-y-1 text-xs text-charcoal/50">
                      {selected.reviewed_at && <p className="flex items-center gap-1.5"><Clock size={11} /> Reviewed: {new Date(selected.reviewed_at).toLocaleString("en-EG")}</p>}
                      {selected.resolved_at && <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-500" /> Resolved: {new Date(selected.resolved_at).toLocaleString("en-EG")}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsPage;
