import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getNotifications, markRead, markAllRead, deleteNotification, clearAllNotifications } from "../api/notifications";
import { useAuth } from "./AuthContext";
import { playNewOrderChime, unlockAudioContext } from "../utils/notificationSound";

const NotificationContext = createContext(null);

const SOUND_PREF_KEY = "ff_admin_sound_enabled";

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try { return localStorage.getItem(SOUND_PREF_KEY) !== "off"; } catch { return true; }
  });
  const pollRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const hasLoadedOnceRef = useRef(false);

  const setSoundEnabled = useCallback((value) => {
    setSoundEnabledState(value);
    try { localStorage.setItem(SOUND_PREF_KEY, value ? "on" : "off"); } catch { /* ignore */ }
  }, []);

  // Browsers block audio until the user has interacted with the page at
  // least once — unlock the audio context on the very first click/keydown
  // anywhere so the first real "new order" chime isn't silently dropped.
  useEffect(() => {
    const unlock = () => unlockAudioContext();
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setNotifications([]); setUnreadCount(0); return; }
    try {
      const { data } = await getNotifications();

      // Chime only for brand-new, unread "new order" alerts that weren't
      // present on the previous fetch — never on first load (that would
      // fire for every unread notification already sitting in the inbox).
      if (hasLoadedOnceRef.current && soundEnabled) {
        const hasNewOrder = data.notifications.some(
          (n) => n.type === "admin_new_order" && !n.is_read && !knownIdsRef.current.has(n.id)
        );
        if (hasNewOrder) playNewOrderChime();
      }
      knownIdsRef.current = new Set(data.notifications.map((n) => n.id));
      hasLoadedOnceRef.current = true;

      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch { /* silent */ }
  }, [isAuthenticated, soundEnabled]);

  // Initial load + poll every 60s for new notifications
  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 60000);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const read = useCallback(async (id) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const readAll = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    const n = notifications.find((x) => x.id === id);
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    if (n && !n.is_read) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  const clearAll = useCallback(async () => {
    await clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // How many unread notifications of a given `type` exist right now —
  // used to drive section-specific red dots (e.g. "Returns" in the admin
  // sidebar) without needing a dedicated backend endpoint.
  const unreadByType = useCallback(
    (type) => notifications.filter((n) => n.type === type && !n.is_read).length,
    [notifications]
  );

  // Marks every unread notification of a given `type` as read in one go.
  const readAllOfType = useCallback(async (type) => {
    const ids = notifications.filter((n) => n.type === type && !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - ids.length));
    await Promise.allSettled(ids.map((id) => markRead(id)));
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, refresh, read, readAll, remove, clearAll,
      unreadByType, readAllOfType,
      soundEnabled, setSoundEnabled,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
