export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  /** true якщо телефон підтверджено через SMS OTP */
  phone_verified?: boolean;
  address?: string;
  /** @deprecated використовуй card_masked_pan + card_type */
  payment?: string;
  /** Маска картки — "**** **** **** 5353" (заповнюється бекендом після WayForPay callback) */
  card_masked_pan?: string;
  /** "Visa" | "MasterCard" | "Maestro" (заповнюється бекендом після WayForPay callback) */
  card_type?: string;
  admin: boolean;
}

export interface AuthPayload {
  token: string;
  user: UserInfo;
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
  hidden?: boolean;
}

export interface CartItem {
  id: number | null;
  name: string;
  price: number;
  image: string;
  description: string;
  quantity: number;
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

/**
 * Відповідь від /api/payment/wayforpay/init
 *
 * mock: true  → бекенд ще не підключений, фронтенд показує тестову форму
 * wayforpay   → бекенд готовий, фронтенд робить POST на WayForPay
 */
export type WayForPayInitResult =
  | { mock: true }
  | {
      mock?: false;
      wayforpay: {
        merchantAccount: string;
        merchantDomainName: string;
        authorizationCode: string; // HMAC-MD5 підпис — формується ТІЛЬКИ на бекенді
        orderReference: string;
        orderDate: number;
        amount: string;
        currency: string;
        productName: string[];
        productCount: number[];
        productPrice: string[];
        clientFirstName?: string;
        clientEmail?: string;
        serviceUrl: string; // URL webhook-у (бекенд)
        returnUrl: string;  // куди повернути юзера після WayForPay
        paymentSystems: string; // "card"
      };
    };
