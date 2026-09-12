import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ff_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralizes the "session expired" experience: any 401 clears the stale
// token so the next render shows the logged-out navbar instead of a broken state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ff_token");
      localStorage.removeItem("ff_user");
    }
    return Promise.reject(error);
  }
);

export default api;
