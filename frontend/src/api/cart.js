import api from "./axios";

export const getCart = () => api.get("/cart");
export const getSavedForLater = () => api.get("/cart/saved");
export const addToCart = (data) => api.post("/cart", data);
export const updateCartItem = (id, quantity) => api.put(`/cart/${id}`, { quantity });
export const removeCartItem = (id) => api.delete(`/cart/${id}`);
export const toggleSaveForLater = (id) => api.put(`/cart/${id}/save-for-later`);
