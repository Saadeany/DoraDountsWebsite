import api from "./axios";

// ---- Dashboard ----
export const getDashboardStats = () => api.get("/admin/stats");

// ---- Products ----
export const getAdminProducts = (params) => api.get("/admin/products", { params });
export const createProduct = (formData) =>
  api.post("/admin/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateProduct = (id, formData) =>
  api.put(`/admin/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const deleteProductImage = (productId, imageId) =>
  api.delete(`/admin/products/${productId}/images/${imageId}`);

// ---- Categories ----
export const createCategory = (formData) =>
  api.post("/admin/categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateCategory = (id, formData) =>
  api.put(`/admin/categories/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// ---- Orders ----
export const getAdminOrders = (params) => api.get("/admin/orders", { params });
export const updateOrderStatus = (id, status) => api.put(`/admin/orders/${id}/status`, { status });
export const updateOrderPaymentStatus = (id, payment_status) =>
  api.put(`/admin/orders/${id}/payment-status`, { payment_status });

// ---- Customers ----
export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const toggleBlockUser = (id) => api.put(`/admin/users/${id}/block`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// ---- Coupons ----
export const getAdminCoupons = () => api.get("/admin/coupons");
export const createCoupon = (data) => api.post("/admin/coupons", data);
export const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);
export const sendCouponEmail = (id) => api.post(`/admin/coupons/${id}/send-email`);

// ---- Zones (delivery areas) ----
export const getAdminZones = () => api.get("/admin/zones");
export const createZone = (data) => api.post("/admin/zones", data);
export const updateZone = (id, data) => api.put(`/admin/zones/${id}`, data);
export const deleteZone = (id) => api.delete(`/admin/zones/${id}`);

// ---- Rush Hour (timed flash discounts) ----
export const getAdminRushHours = () => api.get("/admin/rush-hours");
export const createRushHour = (data) => api.post("/admin/rush-hours", data);
export const updateRushHour = (id, data) => api.put(`/admin/rush-hours/${id}`, data);
export const deleteRushHour = (id) => api.delete(`/admin/rush-hours/${id}`);
