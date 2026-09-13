import axios from "axios";

const api = axios.create({ baseURL: "/api" });
export const getLeads = (params) => api.get("/leads", { params });
export const getStats = () => api.get("/leads/stats");
export const createLead = (data) => api.post("/leads", data);
export const extractLeads = (rawText) =>
  api.post("/leads/extract", { rawText });
export const updateLead = (id, data) => api.patch(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const clearAllLeads = () => api.delete("/leads/clear-all");
export const getKeywords = () => api.get("/keywords");
export const addKeyword = (term) => api.post("/keywords", { term });
export const removeKeyword = (id) => api.delete(`/keywords/${id}`);
export default api;
