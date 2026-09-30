export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  return response;
};