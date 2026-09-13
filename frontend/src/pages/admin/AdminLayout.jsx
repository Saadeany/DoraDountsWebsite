import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart,
  Users, Tag, Mail, RotateCcw, Menu, LogOut, ExternalLink, MapPinned,
  Volume2, VolumeX, Zap
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import NotificationBell from "../../components/common/NotificationBell";

const NAV = [
  { label: "Dashboard",  to: "/admin",            icon: LayoutDashboard },
  { label: "Products",   to: "/admin/products",   icon: Package         },
  { label: "Categories", to: "/admin/categories", icon: FolderOpen      },
  { label: "Rush Hour",  to: "/admin/rush-hour",  icon: Zap             },
  { label: "Orders",     to: "/admin/orders",     icon: ShoppingCart    },
  { label: "Returns",    to: "/admin/returns",    icon: RotateCcw,      notifyType: "admin_new_return" },
  { label: "Zones",      to: "/admin/zones",      icon: MapPinned       },
  { label: "Customers",  to: "/admin/customers",  icon: Users           },
  { label: "Coupons",    to: "/admin/coupons",    icon: Tag             },
  { label: "Email Logs", to: "/admin/email-logs", icon: Mail            },
];

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const { unreadByType, readAllOfType, soundEnabled, setSoundEnabled } = useNotifications();
  const location    = useLocation();
  const navigate    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  const Sidebar = ({ onClose = () => {} }) => (
    <aside className="flex flex-col w-56 bg-ink text-paper h-full">
      {/* Brand */}
      <div className="p-5 pb-4 border-b border-paper/10">
        <p className="font-display text-lg tracking-widest2 text-paper">FELT &amp; FORM</p>
        <p className="text-[11px] text-paper/45 mt-0.5 uppercase tracking-widest">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, to, icon: Icon, notifyType }) => {
          const active = location.pathname === to ||
            (to !== "/admin" && location.pathname.startsWith(to));
          const unread = notifyType ? unreadByType(notifyType) : 0;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => {
                onClose();
                // Clear the red dot the moment the admin opens this section.
                if (notifyType && unread > 0) readAllOfType(notifyType);
              }}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-paper/18 text-paper font-medium"
                  : "text-paper/55 hover:bg-paper/10 hover:text-paper"
              }`}>
              <span className="relative shrink-0">
                <Icon size={16} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-red-400 opacity-70" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-ink" />
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-paper/10 p-4 space-y-3">
        {user && (
          <div className="px-1">
            <p className="text-xs text-paper/40">Signed in as</p>
            <p className="text-xs text-paper/70 font-medium truncate">{user.email}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-1 text-sm text-paper/45 hover:text-paper transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 bg-paper px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-ink/70 hover:text-ink transition-colors"
              aria-label="Open sidebar">
              <Menu size={22} />
            </button>

            {/* Current page title on mobile */}
            <span className="text-sm font-medium text-ink/70 lg:hidden">
              {NAV.find(n => location.pathname === n.to || (n.to !== "/admin" && location.pathname.startsWith(n.to)))?.label || "Admin"}
            </span>
          </div>

          {/* Right side: sound toggle + notifications + view store */}
          <div className="flex items-center gap-4">
            {/* 🔊 New-order sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "New-order sound: on (click to mute)" : "New-order sound: muted (click to unmute)"}
              aria-label="Toggle new order sound alert"
              className="text-ink/60 hover:text-ink transition-colors"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-charcoal/35" />}
            </button>

            {/* 🔴 Notification bell with red dot */}
            <NotificationBell />

            {/* View store link */}
            <Link to="/" target="_blank" rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-xs text-charcoal/55 hover:text-ink transition-colors sm:flex">
              <ExternalLink size={13} />
              View Store
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
