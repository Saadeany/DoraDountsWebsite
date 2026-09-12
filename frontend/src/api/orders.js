import api from "./axios";

export const checkout = (data) => api.post("/orders/checkout", data);
export const getMyOrders = () => api.get("/orders/my-orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const validateCoupon = (code) => api.post("/coupons/validate", { code });

export const submitContact = (data) => api.post("/contact", data);
