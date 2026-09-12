import React, { useState, useEffect } from "react";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/admin";
import Loader from "../../components/common/Loader";

const StatCard = ({ icon: Icon, label, value, sub, color = "text-charcoal/30" }) => (
  <div className="border border-ink/10 bg-paper p-5 space-y-2">
    <div className="flex items-center justify-between">
      <p className="eyebrow text-charcoal/60">{label}</p>
      <Icon size={18} className={color} />
    </div>
    <p className="font-display text-3xl">{value}</p>
    {sub && <p className="text-xs text-charcoal/50">{sub}</p>}
  </div>
);

const STATUS_COLORS = { pending:"bg-yellow-100 text-yellow-700", processing:"bg-blue-100 text-blue-700", shipped:"bg-purple-100 text-purple-700", delivered:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700" };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard" />;
  if (!stats) return <p className="text-charcoal/60">Failed to load stats.</p>;

  const maxRevenue = Math.max(...stats.monthly_revenue.map(m => parseFloat(m.revenue)), 1);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-1 text-charcoal/60">Overview</p>
        <h1 className="font-display text-3xl">Dashboard</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users}        label="Customers"      value={stats.total_users.toLocaleString()} />
        <StatCard icon={Package}      label="Products"       value={stats.total_products.toLocaleString()} />
        <StatCard icon={ShoppingCart} label="Total Orders"   value={stats.total_orders.toLocaleString()} />
        <StatCard icon={DollarSign}   label="Total Revenue"  value={`${parseFloat(stats.total_revenue).toLocaleString()} EGP`} />
      </div>

      {/* Low stock alert */}
      {stats.low_stock_products?.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h2 className="font-medium text-red-700">Low Stock Alert — {stats.low_stock_products.length} product{stats.low_stock_products.length !== 1 ? "s" : ""} need attention</h2>
            </div>
            <Link to="/admin/products" className="text-xs text-red-600 underline hover:text-red-800">Manage Inventory</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {stats.low_stock_products.map(p => (
              <div key={p.id} className="bg-white border border-red-100 px-3 py-2 rounded">
                <p className="text-xs font-medium text-ink truncate">{p.name}</p>
                <p className={`text-sm font-bold mt-0.5 ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                  {p.stock === 0 ? "Sold Out" : `${p.stock} left`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly revenue chart */}
        {stats.monthly_revenue.length > 0 && (
          <div className="lg:col-span-2 border border-ink/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} />
              <h2 className="font-display text-lg">Monthly Revenue</h2>
            </div>
            <div className="flex items-end gap-2 h-40">
              {stats.monthly_revenue.map(m => {
                const height = (parseFloat(m.revenue) / maxRevenue) * 100;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[9px] text-charcoal/50 leading-none">{parseFloat(m.revenue).toLocaleString()}</span>
                    <div className="w-full bg-ink transition-all duration-700 group relative" style={{ height: `${height}%` }} title={`${m.month}: ${m.revenue} EGP (${m.order_count} orders)`}>
                    </div>
                    <span className="text-[10px] text-charcoal/60">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders by status */}
        <div className="border border-ink/10 p-6">
          <h2 className="font-display text-lg mb-4">Orders by Status</h2>
          <div className="space-y-2">
            {stats.orders_by_status.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-xs rounded capitalize ${STATUS_COLORS[s.status] || "bg-cream text-charcoal"}`}>{s.status}</span>
                <span className="font-medium text-sm">{s.count}</span>
              </div>
            ))}
          </div>
          <Link to="/admin/orders" className="mt-4 block text-xs text-charcoal/60 underline hover:text-ink">View all orders →</Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="border border-ink/10 p-5">
        <h2 className="font-display text-lg mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add Product", to: "/admin/products" },
            { label: "View Orders", to: "/admin/orders" },
            { label: "New Coupon", to: "/admin/coupons" },
            { label: "Email Logs", to: "/admin/email-logs" },
            { label: "Customers", to: "/admin/customers" },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="btn-outline text-xs px-4 py-2">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
