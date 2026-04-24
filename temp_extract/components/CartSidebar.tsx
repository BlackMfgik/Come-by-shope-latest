"use client";

import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { apiCreateOrder } from "@/lib/api";
import OrderModal from "./OrderModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: Props) {
  const { items, updateQty, removeItem, total, clearCart } = useCartStore();
  const { token, user } = useAuthStore();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".icons-shopping")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  async function handleConfirmOrder() {
    if (!token) {
      alert("Спочатку увійдіть у свій акаунт");
      return;
    }
    const validItems = items
      .filter((i) => i.id != null && i.quantity > 0)
      .map((i) => ({ productId: i.id!, quantity: i.quantity }));
    if (!validItems.length) {
      alert("Ваш кошик порожній");
      return;
    }
    try {
      await apiCreateOrder(validItems, token);
      clearCart();
      setOrderModalOpen(false);
      onClose();
      alert("Дякуємо за замовлення!");
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Помилка при збереженні товару",
      );
    }
  }

  return (
    <>
      <div
        ref={sidebarRef}
        className={`cart-sidebar${isOpen ? " active" : ""}`}
        id="cart-sidebar"
      >
        <div className="cart-header">
          <h2>Моя корзина</h2>
          <button id="close-cart" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="cart-content">
          {items.length === 0 ? (
            <p>Ваша корзина поки що пуста</p>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.name}>
                <img src={item.image} alt={item.name} width={45} height={45} />
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <br />
                  <span>
                    {item.price.toFixed(2)} ₴ × {item.quantity}
                  </span>
                </div>
                <div className="cart-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.name, -1)}
                  >
                    −
                  </button>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.name, 1)}
                  >
                    +
                  </button>
                  <button
                    className="remove-item"
                    onClick={() => removeItem(item.name)}
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-total">
            <div className="cart-summary">
              <strong>Загальна сума:</strong>
              <span>{total.toFixed(2)} ₴</span>
            </div>
          </div>
        )}

        <div className="cart-footer">
          <button
            id="checkout-btn"
            disabled={items.length === 0}
            className={items.length === 0 ? "checkout-disabled" : ""}
            onClick={() => setOrderModalOpen(true)}
          >
            Оформити замовлення
          </button>
        </div>
      </div>

      {orderModalOpen && (
        <OrderModal
          address={user?.address || "Адресу буде уточнено по телефону"}
          total={total}
          onCancel={() => setOrderModalOpen(false)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </>
  );
}
