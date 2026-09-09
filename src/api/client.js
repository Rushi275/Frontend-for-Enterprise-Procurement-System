import axios from "axios";

// Configure this in .env.local when the Spring Boot service is not on 8080.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const body = error?.response?.data;
  if (typeof body === "string" && body.trim()) return body;
  if (body?.message) return body.message;
  if (error?.code === "ERR_NETWORK") {
    return "Unable to reach the procurement service. Check that the backend is running.";
  }
  if (error?.response?.status === 403) return "You don't have permission to perform that action.";
  if (error?.response?.status === 404) return "The requested record could not be found.";
  return error?.message || fallback;
}

export default client;
