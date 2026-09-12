import api from "./axios";

export const getReturnPolicy = () => api.get("/returns/policy");
export const submitReturnRequest = (formData) =>
  api.post("/returns", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getMyRequests = () => api.get("/returns/my-requests");
export const getReturnRequestById = (id) => api.get(`/returns/${id}`);

// Admin
export const getAdminReturns = (params) => api.get("/admin/returns", { params });
export const updateReturnRequest = (id, data) => api.put(`/admin/returns/${id}`, data);
export const deleteReturnImage = (id, index) => api.delete(`/admin/returns/${id}/images/${index}`);
