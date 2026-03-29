import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  id: number | null;
  name: string;
  price: number;
  image: string;
  description: string;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  addItem: (name: string, price: number, image: string, description: string, id: number | null) => void;
  updateQty: (name: string, delta: number) => void;
  removeItem: (name: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartCtx>({} as CartCtx);

function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem('cartItems') ?? '[]'); } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  function persist(next: CartItem[]) {
    setItems(next);
    try { localStorage.setItem('cartItems', JSON.stringify(next)); } catch {}
  }

  function addItem(name: string, price: number, image: string, description: string, id: number | null) {
    setItems(prev => {
      const copy = [...prev];
      const existing = copy.find(i => (id != null ? i.id === id : i.name === name));
      if (existing) { existing.quantity++; }
      else { copy.push({ id, name, price, image, description, quantity: 1 }); }
      try { localStorage.setItem('cartItems', JSON.stringify(copy)); } catch {}
      return copy;
    });
  }

  function updateQty(name: string, delta: number) {
    setItems(prev => {
      let copy = prev.map(i => i.name === name ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
      try { localStorage.setItem('cartItems', JSON.stringify(copy)); } catch {}
      return copy;
    });
  }

  function removeItem(name: string) {
    persist(items.filter(i => i.name !== name));
  }

  function clearCart() {
    persist([]);
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, total }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
