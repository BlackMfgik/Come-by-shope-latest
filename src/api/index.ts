const BASE = import.meta.env.VITE_API_URL ?? "";

function authHeaders(token?: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      if (d?.error) msg = d.error;
    } catch {
      /* ignore JSON parse error, use HTTP status message */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface AuthPayload {
  token: string;
  user: UserInfo;
}
export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  payment?: string;
  admin: boolean;
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthPayload> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthPayload>(res);
}

export async function apiRegister(
  email: string,
  password: string,
): Promise<AuthPayload> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthPayload>(res);
}

/**
 * Google OAuth — викликається після того, як Google повертає id_token.
 * Бекенд верифікує токен і повертає власний JWT + дані користувача.
 *
 * Як отримати googleIdToken на фронтенді:
 *   1. Завантажити Google Identity Services: https://accounts.google.com/gsi/client
 *   2. google.accounts.id.initialize({ client_id: VITE_GOOGLE_CLIENT_ID, callback })
 *   3. У callback отримає response.credential — це і є googleIdToken.
 */
export async function apiGoogleLogin(
  googleIdToken: string,
): Promise<AuthPayload> {
  const res = await fetch(`${BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: googleIdToken }),
  });
  return handleResponse<AuthPayload>(res);
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  weight?: string;
  price: number;
  image?: string;
  imageName?: string;
  category?: string;
}

export async function apiGetProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/api/products`, {
    headers: { Accept: "application/json" },
  });
  return handleResponse<Product[]>(res);
}

export async function apiGetProduct(id: number): Promise<Product> {
  const res = await fetch(`${BASE}/api/products/${id}`);
  return handleResponse<Product>(res);
}

export async function apiCreateProduct(
  data: Omit<Product, "id">,
  token: string,
): Promise<Product> {
  const res = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

export async function apiUpdateProduct(
  id: number,
  data: Partial<Product>,
  token: string,
): Promise<Product> {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

export async function apiDeleteProduct(
  id: number,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface Order {
  id: number;
  createdAt: string;
  status: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export async function apiCreateOrder(
  items: OrderItem[],
  token: string,
): Promise<unknown> {
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
}

export async function apiGetMyOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/api/orders`, {
    headers: authHeaders(token),
  });
  return handleResponse<Order[]>(res);
}

export async function apiUpdateProfile(
  data: Partial<UserInfo>,
  token: string,
): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/auth/profile`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<UserInfo>(res);
}

export async function apiChangePassword(
  oldPassword: string,
  newPassword: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/password`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      if (d?.error) msg = d.error;
    } catch {
      /* ignore JSON parse error, use HTTP status message */
    }
    throw new Error(msg);
  }
}

export async function apiUpdatePayment(
  payment: string,
  token: string,
): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/auth/payment`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ payment }),
  });
  return handleResponse<UserInfo>(res);
}
