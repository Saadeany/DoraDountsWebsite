import api from "./axios";

export const createReview = (data) => api.post("/reviews", data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
