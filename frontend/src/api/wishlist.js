import api from "./axios";

export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (product_id) => api.post("/wishlist", { product_id });
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);
