import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { apiCreateOrder } from "../api";
import OrderModal from "./OrderModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: Props) {
  const { items, updateQty, removeItem, total, clearCart } = useCart();
  const { token, user } = useAuth();
  const [orderModalOpen, setOrderModalOpen] = useState(false);

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
