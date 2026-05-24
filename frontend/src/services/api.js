import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.msg || "";
    const isAuthError = [401, 422].includes(error.response?.status) && (
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("session") ||
      message.toLowerCase().includes("login") ||
      message.toLowerCase().includes("subject")
    );
    if (isAuthError) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/auth/me"),
};

export const contact = {
  send: (payload) => api.post("/contact", payload),
};

export const predictions = {
  create: (payload) => api.post("/predict", payload),
  history: () => api.get("/history"),
  problems: () => api.get("/problems"),
  train: () => api.post("/train"),
  trainUpload: (file) => {
    const formData = new FormData();
    formData.append("dataset", file);
    return api.post("/train/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  joinProject: (projectCode) => api.post("/projects/join", { projectCode }),
  updateTask: (projectId, taskId, payload) => api.patch(`/projects/${projectId}/tasks/${taskId}`, payload),
  updateActuals: (projectId, payload) => api.patch(`/projects/${projectId}/actuals`, payload),
  simulateDelay: (id, payload) => api.post(`/projects/${id}/simulate-delay`, payload),
  optimize: (id) => api.post(`/projects/${id}/optimize`),
  downloadReport: async (id, projectName) => {
    const response = await api.get(`/reports/${id}`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName || "project"}_estimate.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

export const admin = {
  summary: () => api.get("/admin/summary"),
};

export default api;
