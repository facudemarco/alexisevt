import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get("access_token");
  
  // 1. Armamos los headers base (incluyendo el token si existe)
  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  // 2. LA MAGIA: Si el body NO es un archivo (FormData), forzamos JSON.
  // Si es un archivo, eliminamos el Content-Type y dejamos que el navegador haga su trabajo.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  } else {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const isLoginEndpoint = endpoint.includes("/auth/login");
    if (response.status === 401 && !isLoginEndpoint) {
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
