import React, { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { getEmailLogs } from "../../api/notifications";
import Loader from "../../components/common/Loader";

const TYPE_LABELS = {
  welcome: "Welcome",
  verify_email: "Email Verification",
  password_reset: "Password Reset",
  order_confirmation: "Order Confirmation",
  order_status_update: "Order Status",
  admin_new_order: "Admin: New Order",
  admin_low_stock: "Admin: Low Stock",
  admin_new_user: "Admin: New User",
  admin_contact: "Admin: Contact",
};

const AdminEmailLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.email_type = filterType;
      const { data } = await getEmailLogs(params);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalSent = logs.filter(l => l.status === "sent").length;
  const totalFailed = logs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1 text-charcoal/60">System</p>
        <h1 className="font-display text-3xl">Email Logs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Logged", value: pagination.total || 0, icon: Mail, color: "text-ink" },
          { label: "Sent", value: totalSent, icon: CheckCircle, color: "text-green-600" },
          { label: "Failed", value: totalFailed, icon: XCircle, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-ink/10 p-4 flex items-center gap-3">
            <Icon size={20} className={`${color} shrink-0`} />
            <div>
              <p className="text-lg font-medium">{value}</p>
              <p className="text-xs text-charcoal/60">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input-field w-auto text-sm"
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="input-field w-auto text-sm"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream">
              <tr>
                {["Type", "Recipient", "Subject", "Status", "Sent At"].map(h => (
                  <th key={h} className="px-4 py-3 text-left eyebrow text-charcoal/60 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-charcoal/40 text-sm">No email logs yet.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs bg-cream border border-ink/10 px-2 py-0.5">
                      {TYPE_LABELS[log.email_type] || log.email_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70 max-w-[180px] truncate">{log.recipient}</td>
                  <td className="px-4 py-3 text-charcoal/70 max-w-[220px] truncate">{log.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${log.status === "sent" ? "text-green-600" : "text-red-500"}`}>
                      {log.status === "sent" ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {log.status}
                    </span>
                    {log.error_message && (
                      <p className="mt-1 text-[11px] text-red-400 max-w-[160px] truncate" title={log.error_message}>
                        {log.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal/50 whitespace-nowrap text-xs">
                    {new Date(log.sent_at).toLocaleString("en-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 text-xs border transition-colors ${p === page ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailLogsPage;
