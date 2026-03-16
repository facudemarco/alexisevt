import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get("access_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      Cookies.remove("access_token");
      Cookies.remove("user_role");
      if (typeof window !== "undefined") {
         window.location.href = "/admin/login";
      }
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Error API: ${response.statusText}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
