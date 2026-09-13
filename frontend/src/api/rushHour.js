import api from "./axios";

export const getActiveRushHour = () => api.get("/rush-hour/active");
