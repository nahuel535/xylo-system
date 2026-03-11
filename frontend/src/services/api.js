import axios from "axios";

const api = axios.create({
  baseURL: "https://xylo-system-production.up.railway.app/docs",
});

export default api;