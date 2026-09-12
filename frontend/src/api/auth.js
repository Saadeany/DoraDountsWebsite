import api from "./axios";

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getCurrentUser = () => api.get("/auth/me");
export const updateProfile = (formData) =>
  api.put("/auth/profile", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const changePassword = (data) => api.put("/auth/change-password", data);
export const updateAddresses = (addresses) => api.put("/auth/addresses", { addresses });

export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);
export const resendVerification = () => api.post("/auth/resend-verification");
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const resetPassword = (token, new_password) => api.post("/auth/reset-password", { token, new_password });
