export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  payment?: string;
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
