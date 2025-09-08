import axios from "axios";

const axiosClient = axios.create({
  // Use env var if set, otherwise fallback to `/api`
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default axiosClient;
