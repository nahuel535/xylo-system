import axios from "axios";

const api = axios.create({
  baseURL: "https://xylo-system-production.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("xylo_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isOnLoginPage = window.location.pathname === "/login";
    if (error.response?.status === 401 && !isOnLoginPage) {
      localStorage.removeItem("xylo_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
