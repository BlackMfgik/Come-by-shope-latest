"use client";

import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { apiCreateOrder } from "@/lib/api";
import { useToastStore } from "@/store/toastStore";
import { ShoppingCart } from "lucide-react";
import OrderModal from "./OrderModal";
import LoginRequiredModal from "./modals/LoginRequiredModal";
import OrderSuccessModal from "./modals/OrderSuccessModal";
import EmptyState from "./ui/EmptyState";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: Props) {
  const { items, updateQty, removeItem, total, clearCart } = useCartStore();
  const { token, user } = useAuthStore();
  const { toast } = useToastStore();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [successTotal, setSuccessTotal] = useState(0);
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
      setOrderModalOpen(false);
      setLoginModalOpen(true);
      return;
    }
    const validItems = items
      .filter((i) => i.id != null && i.quantity > 0)
      .map((i) => ({ productId: i.id!, quantity: i.quantity }));
    if (!validItems.length) {
      toast("Кошик порожній", "info");
      return;
    }
    try {
      await apiCreateOrder(validItems, token);
      const orderTotal = total;
      clearCart();
      setOrderModalOpen(false);
      onClose();
      setSuccessTotal(orderTotal);
      setSuccessModal(true);
    } catch (err: unknown) {
      toast(
        err instanceof Error
          ? err.message
          : "Помилка при оформленні замовлення",
        "error",
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
            <EmptyState
              icon={<ShoppingCart size={36} strokeWidth={1.5} />}
              title="Кошик порожній"
              subtitle="Додайте щось смачненьке~"
            />
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.name}>
                {/* ✕ Remove — top-right corner, far from + */}
                <button
                  className="remove-item"
                  onClick={() => removeItem(item.name)}
                  aria-label="Видалити товар"
                >
                  ✕
                </button>

                <img src={item.image} alt={item.name} width={48} height={48} />

                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <span className="cart-item-price">
                    {item.price.toFixed(2)} ₴
                  </span>

                  {/* Qty controls — spatially separated from remove */}
                  <div className="cart-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.name, -1)}
                      aria-label="Зменшити кількість"
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn qty-btn--plus"
                      onClick={() => updateQty(item.name, 1)}
                      aria-label="Збільшити кількість"
                    >
                      +
                    </button>
                  </div>
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

      {loginModalOpen && (
        <LoginRequiredModal onClose={() => setLoginModalOpen(false)} />
      )}

      {successModal && (
        <OrderSuccessModal
          total={successTotal}
          onClose={() => setSuccessModal(false)}
        />
      )}
    </>
  );
}
