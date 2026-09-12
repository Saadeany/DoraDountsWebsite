import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  getCart, getSavedForLater,
  addToCart as apiAddToCart,
  updateCartItem, removeCartItem, toggleSaveForLater,
} from "../api/cart";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

// ── Guest cart key ─────────────────────────────────────────────────────────
const GUEST_KEY = "ff_guest_cart";

const loadGuestCart = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]"); } catch { return []; }
};
const saveGuestCart = (items) => {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
};
const clearGuestCart = () => localStorage.removeItem(GUEST_KEY);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false); // prevent double-merge on strict mode

  // ── Build subtotal from items ──────────────────────────────────────────
  const calcSubtotal = (cartItems) =>
    cartItems.reduce((sum, i) => {
      const p = i.Product || i;
      const price = parseFloat(p.price || i.price || 0);
      const disc  = parseFloat(p.discount || i.discount || 0);
      return sum + price * (1 - disc / 100) * (i.quantity || 1);
    }, 0);

  // ── Sync guest cart into server on login ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) { mergedRef.current = false; return; }
    if (mergedRef.current) return;
    mergedRef.current = true;

    const guest = loadGuestCart();
    const mergeAndRefresh = async () => {
      if (guest.length > 0) {
        // Fire all add requests concurrently; ignore individual failures
        await Promise.allSettled(
          guest.map(item =>
            apiAddToCart({
              product_id: item.product_id,
              size:       item.size  || null,
              color:      item.color || null,
              quantity:   item.quantity,
            })
          )
        );
        clearGuestCart();
      }
      await refreshServerCart();
    };
    mergeAndRefresh();
  }, [isAuthenticated]); // eslint-disable-line

  // ── Refresh server cart ────────────────────────────────────────────────
  const refreshServerCart = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCart();
      setItems(data.items);
      setSubtotal(data.subtotal);
    } catch {
      setItems([]); setSubtotal(0);
    } finally { setLoading(false); }
  }, []);

  // ── Refresh guest cart (localStorage) ────────────────────────────────
  const refreshGuestCart = useCallback(() => {
    const g = loadGuestCart();
    setItems(g);
    setSubtotal(calcSubtotal(g));
  }, []);

  const refreshCart = useCallback(() => {
    if (isAuthenticated) return refreshServerCart();
    refreshGuestCart();
  }, [isAuthenticated, refreshServerCart, refreshGuestCart]);

  // Initial load
  useEffect(() => { refreshCart(); }, [refreshCart]);

  // ── Add item ───────────────────────────────────────────────────────────
  const addItem = useCallback(async (product_id, size, color, quantity = 1) => {
    if (!isAuthenticated) {
      // Guest: upsert into localStorage
      const g = loadGuestCart();
      const idx = g.findIndex(
        i => i.product_id === product_id &&
             (i.size  || null) === (size  || null) &&
             (i.color || null) === (color || null)
      );
      if (idx >= 0) { g[idx].quantity += quantity; }
      else { g.push({ product_id, size: size || null, color: color || null, quantity }); }
      saveGuestCart(g);
      refreshGuestCart();
      return;
    }
    await apiAddToCart({ product_id, size, color, quantity });
    await refreshServerCart();
  }, [isAuthenticated, refreshGuestCart, refreshServerCart]);

  // ── Update quantity ────────────────────────────────────────────────────
  const updateItem = useCallback(async (id, quantity) => {
    if (!isAuthenticated) {
      const g = loadGuestCart().map((item, idx) => idx === id ? { ...item, quantity } : item);
      saveGuestCart(g); refreshGuestCart(); return;
    }
    await updateCartItem(id, quantity);
    await refreshServerCart();
  }, [isAuthenticated, refreshGuestCart, refreshServerCart]);

  // ── Remove item ────────────────────────────────────────────────────────
  const removeItem = useCallback(async (id) => {
    if (!isAuthenticated) {
      const g = loadGuestCart().filter((_, idx) => idx !== id);
      saveGuestCart(g); refreshGuestCart(); return;
    }
    await removeCartItem(id);
    await refreshServerCart();
  }, [isAuthenticated, refreshGuestCart, refreshServerCart]);

  // ── Save for later (server only) ──────────────────────────────────────
  const saveForLater = useCallback(async (id) => {
    if (!isAuthenticated) return; // no-op for guests
    await toggleSaveForLater(id);
    await refreshServerCart();
  }, [isAuthenticated, refreshServerCart]);

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      items, subtotal, itemCount, loading,
      refreshCart, addItem, updateItem, removeItem, saveForLater,
      isGuest: !isAuthenticated,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
