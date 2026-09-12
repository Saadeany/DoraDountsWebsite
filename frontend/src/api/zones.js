import api from "./axios";

export const getZones = () => api.get("/zones");
