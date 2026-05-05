import type {
  AuthPayload,
  UserInfo,
  Product,
  Order,
  OrderItem,
  WayForPayInitResult,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

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
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
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
  name: string,
): Promise<AuthPayload> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  return handleResponse<AuthPayload>(res);
}

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
      /* ignore */
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

// ─── Телефон — OTP верифікація ────────────────────────────────────────────────

/**
 * Крок 1: надіслати OTP на номер телефону
 *
 * TODO [BACKEND]:
 * - Згенерувати 6-значний код
 * - Зберегти в БД: { userId, phone, code, expiresAt: now+5хв }
 * - Відправити через TurboSMS API:
 *   POST https://api.turbosms.ua/message/send
 *   Body: { recipients: [phone], sms: { sender: "ComeBySHOP", text: `Ваш код: ${code}` } }
 * - Повернути { success: true, expiresIn: 300 }
 *
 * MOCK: завжди повертає success, код "123456" — дивись в консолі Next.js
 */
export async function apiSendPhoneOtp(
  phone: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/phone/send-otp`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      if (d?.error) msg = d.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

/**
 * Крок 2: підтвердити OTP код
 *
 * TODO [BACKEND]:
 * - Знайти OTP запис в БД по userId + phone
 * - Перевірити code та expiresAt
 * - Видалити OTP запис (one-time use)
 * - Оновити user: phone = phone, phone_verified = true
 * - Повернути оновлений UserInfo
 *
 * MOCK: перевіряє чи code === "123456", потім зберігає телефон
 */
export async function apiVerifyPhoneOtp(
  phone: string,
  code: string,
  token: string,
): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/auth/phone/verify-otp`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ phone, code }),
  });
  return handleResponse<UserInfo>(res);
}

// ─── WayForPay ────────────────────────────────────────────────────────────────

/**
 * Ініціалізація WayForPay сесії для збереження картки
 *
 * TODO [BACKEND]:
 * - Сгенерувати orderReference (унікальний ID транзакції)
 * - Побудувати об'єкт запиту до WayForPay
 * - Підписати HMAC-MD5 із секретним ключем (ТІЛЬКИ на бекенді, не фронтенді!)
 * - Повернути підписані параметри для форми
 * - Сума: 1 UAH (мінімальний платіж для збереження картки)
 * - serviceType: "AUTO" або "REGULAR" для отримання recToken
 *
 * MOCK: повертає { mock: true } — фронтенд показує тестову форму
 */
export async function apiInitWayForPay(
  token: string,
): Promise<WayForPayInitResult> {
  const res = await fetch(`${BASE}/api/payment/wayforpay/init`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse<WayForPayInitResult>(res);
}

/**
 * Зберегти дані картки після успішного WayForPay платежу (mock-режим)
 * В реальному режимі картка зберігається через webhook /api/payment/wayforpay/callback
 *
 * TODO [BACKEND]: цей endpoint не потрібен в продакшн — можна видалити
 * після підключення реального WayForPay callback
 */
export async function apiSaveCardMock(
  card: { masked_pan: string; card_type: string },
  token: string,
): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/auth/payment`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      payment: `${card.card_type} ${card.masked_pan}`,
      card_masked_pan: card.masked_pan,
      card_type: card.card_type,
    }),
  });
  return handleResponse<UserInfo>(res);
}

// ─── Email change ─────────────────────────────────────────────────────────────

export async function apiRequestEmailChange(
  newEmail: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/change-email/request`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ newEmail }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      if (d?.error) msg = d.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

export async function apiConfirmEmailChange(
  newEmail: string,
  code: string,
  token: string,
): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/auth/change-email/confirm`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ newEmail, code }),
  });
  return handleResponse<UserInfo>(res);
}

// ─── Products ─────────────────────────────────────────────────────────────────

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

export async function apiToggleProductVisibility(
  id: number,
  hidden: boolean,
  token: string,
): Promise<Product> {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ hidden }),
  });
  return handleResponse<Product>(res);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

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
