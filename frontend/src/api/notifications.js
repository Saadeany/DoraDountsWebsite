import api from "./axios";

export const getNotifications = () => api.get("/notifications");
export const markRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllRead = () => api.put("/notifications/mark-all-read");
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const clearAllNotifications = () => api.delete("/notifications");
export const getEmailLogs = (params) => api.get("/admin/email-logs", { params });
