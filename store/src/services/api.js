import axios from "axios";

const api = axios.create({
  baseURL: "https://xylobox.online",
});

export default api;
