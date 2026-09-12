import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getWishlist, addToWishlist as apiAdd, removeFromWishlist as apiRemove } from "../api/wishlist";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      const { data } = await getWishlist();
      setItems(data.items);
    } catch {
      // ignore — wishlist icon just stays empty
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId) => items.some((item) => item.product_id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      if (isInWishlist(productId)) {
        await apiRemove(productId);
      } else {
        await apiAdd(productId);
      }
      await refreshWishlist();
    },
    [isInWishlist, refreshWishlist]
  );

  return (
    <WishlistContext.Provider value={{ items, refreshWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
};
