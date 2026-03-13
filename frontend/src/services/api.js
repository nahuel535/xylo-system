import axios from "axios";

const api = axios.create({
  baseURL: "https://xylo-system-production.up.railway.app",
});

const token = localStorage.getItem("xylo_token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;