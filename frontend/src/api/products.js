import api from "./axios";

export const getProducts = (params) => api.get("/products", { params });
export const getProductBySlug = (slug) => api.get(`/products/${slug}`);
export const getSearchSuggestions = (q) => api.get("/products/search-suggestions", { params: { q } });
export const getCategories = () => api.get("/categories");
export const getFilterOptions = () => api.get("/meta/filters");
