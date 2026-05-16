declare module "*.css";

// WayForPay widget — завантажується через next/script в layout.tsx
interface WayforpayWidgetOptions {
  merchantAccount: string;
  merchantDomainName: string;
  authorizationCode: string;
  orderReference: string;
  orderDate: number;
  amount: string;
  currency: string;
  productName: string[];
  productCount: number[];
  productPrice: string[];
  serviceUrl?: string;
  returnUrl?: string;
  paymentSystems?: string;
  straightWidget?: boolean;
}

interface WayforpayInstance {
  run(options: WayforpayWidgetOptions): void;
}

interface WayforpayConstructor {
  new (): WayforpayInstance;
}

interface Window {
  Wayforpay?: WayforpayConstructor;
}
