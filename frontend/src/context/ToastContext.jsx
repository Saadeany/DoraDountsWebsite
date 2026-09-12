import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-700",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info:    "bg-blue-50 border-blue-200 text-blue-700",
};

const ICON_STYLES = {
  success: "text-green-500",
  error:   "text-red-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ message, type = "info", duration = 4000 }) => {
    const id = ++_id;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 toasts
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience methods
  const success = useCallback((message, opts) => toast({ message, type: "success", ...opts }), [toast]);
  const error   = useCallback((message, opts) => toast({ message, type: "error",   ...opts }), [toast]);
  const warning = useCallback((message, opts) => toast({ message, type: "warning", ...opts }), [toast]);
  const info    = useCallback((message, opts) => toast({ message, type: "info",    ...opts }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Portal — fixed bottom-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 48, scale: 0.95 }}
                animate={{ opacity: 1, x: 0,  scale: 1 }}
                exit={{    opacity: 0, x: 48,  scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`pointer-events-auto flex items-start gap-3 border rounded px-4 py-3 shadow-md ${STYLES[t.type]}`}
              >
                <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[t.type]}`} />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
