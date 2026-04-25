"use client";

import { X, Package } from "lucide-react";
import type { Order } from "@/types";

interface Props {
  order: Order;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "#f59e0b" },
  processing: { label: "Обробляється", color: "var(--accent)" },
  shipped: { label: "Відправлено", color: "#3b82f6" },
  delivered: { label: "Доставлено", color: "var(--accent)" },
  cancelled: { label: "Скасовано", color: "var(--red, #e53935)" },
  Доставлено: { label: "Доставлено", color: "var(--accent)" },
};

export default function OrderDetailsModal({ order, onClose }: Props) {
  const status = STATUS_MAP[order.status] ?? {
    label: order.status,
    color: "var(--text-2)",
  };
  const date = new Date(order.createdAt).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Package size={20} color="var(--accent)" />
          <h3 id="modal-title" style={{ margin: 0 }}>
            Замовлення #{order.id}
          </h3>
        </div>
        <p
          style={{
            color: "var(--text-2)",
            fontSize: "0.83rem",
            margin: "4px 0 16px",
          }}
        >
          {date}
        </p>

        <div className="order-modal-card">
          <div className="order-modal-row">
            <span className="label">Статус</span>
            <span
              style={{
                color: status.color,
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          role="list"
        >
          {order.items.map((item, i) => (
            <div key={i} className="order-detail-item" role="listitem">
              <div>
                <p className="order-detail-name">{item.productName}</p>
                <p className="order-detail-qty">× {item.quantity}</p>
              </div>
              <span className="order-detail-price">
                {(item.price * item.quantity).toFixed(2)} ₴
              </span>
            </div>
          ))}
        </div>

        <div className="order-modal-card" style={{ marginTop: 12 }}>
          <div className="order-modal-row order-modal-row-total">
            <span className="label">Загальна сума</span>
            <span className="value price">{order.total.toFixed(2)} ₴</span>
          </div>
        </div>

        <div className="modal-buttons" style={{ marginTop: 8 }}>
          <button className="order-btn secondary" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
