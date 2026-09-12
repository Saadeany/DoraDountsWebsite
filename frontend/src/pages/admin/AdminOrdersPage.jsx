import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { getAdminOrders, updateOrderStatus, updateOrderPaymentStatus } from "../../api/admin";
import { formatPrice } from "../../utils/format";
import Loader from "../../components/common/Loader";

const STATUSES = ["pending","processing","shipped","delivered","cancelled"];
const STATUS_COLORS = { pending:"text-yellow-600", processing:"text-blue-600", shipped:"text-purple-600", delivered:"text-green-600", cancelled:"text-red-500" };

const PAYMENT_STATUS_LABELS = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  awaiting_transfer: { label: "Awaiting Transfer", color: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", color: "bg-purple-100 text-purple-700" },
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const { data } = await getAdminOrders(params);
      setOrders(data.orders); setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [filterStatus, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusUpdate = async (id, status) => {
    await updateOrderStatus(id, status);
    fetchOrders();
  };

  const handlePaymentUpdate = async (id, payment_status) => {
    setUpdatingPayment(id);
    try {
      await updateOrderPaymentStatus(id, payment_status);
      await fetchOrders();
    } finally {
      setUpdatingPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1 text-charcoal/60">Fulfilment</p>
        <h1 className="font-display text-3xl">Orders</h1>
      </div>

      {/* Search + status filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex items-center gap-2 border border-ink/15 px-3 py-2 max-w-sm flex-1">
          <Search size={15} className="text-charcoal/40 shrink-0" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Order number, name, email, phone…"
            className="w-full bg-transparent text-sm outline-none" />
          <button type="submit" className="text-xs text-charcoal/50 hover:text-ink shrink-0">Search</button>
        </form>
        {search && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="text-xs text-charcoal/60 underline hover:text-ink">
            Clear search
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {["", ...STATUSES].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`border px-3 py-1.5 text-xs uppercase transition-colors ${filterStatus === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
            {s || "All"} {s === "" && pagination.total !== undefined ? `(${pagination.total})` : ""}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-charcoal/40 border border-dashed border-ink/15">
              <p className="font-display text-xl">No orders found.</p>
            </div>
          ) : orders.map((o) => {
            const pay = PAYMENT_STATUS_LABELS[o.payment_status] || PAYMENT_STATUS_LABELS.pending;
            return (
            <div key={o.id} className="border border-ink/10 overflow-hidden">
              <button onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="w-full flex flex-wrap items-center gap-4 p-4 text-left hover:bg-cream/50 transition-colors">
                <span className="font-mono font-medium text-sm">{o.order_number}</span>
                <span className="text-xs text-charcoal/60">{o.User?.first_name} {o.User?.last_name}</span>
                <span className="text-xs text-charcoal/50 hidden sm:block">{o.User?.email}</span>
                <span className="text-sm font-medium">{formatPrice(o.total_amount)}</span>
                <span className={`text-xs font-medium capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                <span className={`px-2 py-0.5 text-[11px] rounded font-medium ${pay.color}`}>{pay.label}</span>
                <span className="ml-auto text-xs text-charcoal/40">{new Date(o.createdAt).toLocaleDateString("en-EG")}</span>
              </button>
              {expanded === o.id && (
                <div className="border-t border-ink/10 p-4 space-y-4 bg-cream/20">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="eyebrow text-charcoal/50 mb-1">Ship to</p>
                      <p className="font-medium">{o.shipping_full_name}</p>
                      <p className="text-charcoal/60">{o.shipping_area ? `${o.shipping_area}, ` : ""}{o.shipping_city}, {o.shipping_country}</p>
                      <p className="text-xs text-charcoal/50">
                        {o.shipping_address}
                        {o.shipping_building ? `, Bldg ${o.shipping_building}` : ""}
                        {o.shipping_floor ? `, Floor ${o.shipping_floor}` : ""}
                        {o.shipping_apartment ? `, Apt ${o.shipping_apartment}` : ""}
                      </p>
                      {o.shipping_lat && o.shipping_lng && (
                        <a href={`https://www.google.com/maps?q=${o.shipping_lat},${o.shipping_lng}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline">View pinned location</a>
                      )}
                    </div>
                    <div><p className="eyebrow text-charcoal/50 mb-1">Contact</p><p>{o.shipping_phone}</p><p className="text-xs text-charcoal/60">{o.shipping_email}</p></div>
                    <div>
                      <p className="eyebrow text-charcoal/50 mb-1">Payment</p>
                      <p>{o.payment_method?.replace(/_/g," ")}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[11px] rounded font-medium ${pay.color}`}>{pay.label}</span>
                    </div>
                    <div><p className="eyebrow text-charcoal/50 mb-1">Total</p><p className="font-medium text-base">{formatPrice(o.total_amount)}</p>{parseFloat(o.discount_amount) > 0 && <p className="text-xs text-green-600">Coupon: {o.coupon_code}</p>}</div>
                  </div>

                  {/* Transfer confirmation — only relevant for Vodafone Cash / InstaPay */}
                  {["vodafone_cash", "instapay"].includes(o.payment_method) && (
                    <div>
                      <p className="eyebrow text-charcoal/50 mb-2">Payment Status</p>
                      <div className="flex flex-wrap gap-2">
                        {["awaiting_transfer", "paid", "failed", "refunded"].map(s => (
                          <button key={s} onClick={() => handlePaymentUpdate(o.id, s)}
                            disabled={updatingPayment === o.id}
                            className={`border px-3 py-1.5 text-xs uppercase transition-colors disabled:opacity-50 ${o.payment_status === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
                            {PAYMENT_STATUS_LABELS[s].label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-charcoal/50 mt-1.5">Confirm "Paid" once you've verified the customer's WhatsApp transfer screenshot.</p>
                    </div>
                  )}

                  <div>
                    <p className="eyebrow text-charcoal/50 mb-2">Items ({o.items?.length})</p>
                    <div className="space-y-1">
                      {o.items?.map(i => (
                        <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-ink/5 last:border-0">
                          <span>{i.product_name} {i.size ? `(${i.size})` : ""}{i.color ? ` · ${i.color}` : ""} × {i.quantity}</span>
                          <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow text-charcoal/50 mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(s => (
                        <button key={s} onClick={() => handleStatusUpdate(o.id, s)}
                          className={`border px-3 py-1.5 text-xs uppercase transition-colors ${o.status === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 text-xs border transition-colors ${p === page ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminOrdersPage;
