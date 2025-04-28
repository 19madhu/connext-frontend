import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true, // Keep this if you also use cookies
});

// ✅ Add interceptor to attach the JWT token dynamically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Always get the latest token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);