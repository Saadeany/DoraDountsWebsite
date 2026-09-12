import React, { useState, useRef, useEffect } from "react";
import { Bell, Package, Tag, Megaphone, ShieldAlert, UserPlus, Mail, Check, Trash2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../context/NotificationContext";

const TYPE_CONFIG = {
  order_confirmed:  { icon: Package,     color: "text-green-600",  bg: "bg-green-50"  },
  order_processing: { icon: Package,     color: "text-blue-600",   bg: "bg-blue-50"   },
  order_shipped:    { icon: Package,     color: "text-purple-600", bg: "bg-purple-50" },
  order_delivered:  { icon: Package,     color: "text-green-700",  bg: "bg-green-50"  },
  order_cancelled:  { icon: Package,     color: "text-red-600",    bg: "bg-red-50"    },
  promo:            { icon: Megaphone,   color: "text-amber-600",  bg: "bg-amber-50"  },
  coupon:           { icon: Tag,         color: "text-teal-600",   bg: "bg-teal-50"   },
  admin_new_order:  { icon: Package,     color: "text-ink",        bg: "bg-cream"     },
  admin_low_stock:  { icon: ShieldAlert, color: "text-red-600",    bg: "bg-red-50"    },
  admin_new_user:   { icon: UserPlus,    color: "text-blue-600",   bg: "bg-blue-50"   },
  admin_contact:    { icon: Mail,        color: "text-ink",        bg: "bg-cream"     },
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const { notifications, unreadCount, read, readAll, remove, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative flex items-center justify-center text-ink/70 hover:text-ink transition-colors"
      >
        <Bell size={20} />

        {/* 🔴 Red dot — shows when there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex items-center justify-center">
            {/* Pulse ring */}
            <span className="absolute h-4 w-4 animate-ping rounded-full bg-red-400 opacity-60" />
            {/* Solid red badge with count */}
            <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-3 w-80 bg-paper border border-ink/12 shadow-xl z-50 overflow-hidden"
            style={{ maxHeight: "calc(100vh - 80px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 bg-cream/40">
              <h3 className="text-sm font-medium">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={readAll}
                    className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-ink transition-colors">
                    <Check size={11} /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll}
                    className="text-xs text-charcoal/45 hover:text-red-500 transition-colors">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto divide-y divide-ink/6" style={{ maxHeight: "380px" }}>
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={22} className="mx-auto mb-2 text-charcoal/20" />
                  <p className="text-xs text-charcoal/45">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, color, bg } = TYPE_CONFIG[n.type] || TYPE_CONFIG.promo;
                  return (
                    <div key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        n.is_read ? "bg-paper" : "bg-blue-50/40"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
                        <Icon size={14} className={color} />
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => !n.is_read && read(n.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className={`text-xs font-medium leading-snug ${n.is_read ? "text-charcoal/65" : "text-ink"}`}>
                          {n.title}
                          {!n.is_read && (
                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-charcoal/55 leading-snug line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-charcoal/38">{timeAgo(n.createdAt)}</p>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => remove(n.id)}
                        className="shrink-0 text-charcoal/25 hover:text-red-400 transition-colors mt-0.5"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
