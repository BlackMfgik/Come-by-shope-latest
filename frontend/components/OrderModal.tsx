"use client";

interface Props {
  address: string;
  cardMaskedPan: string;
  cardType?: string;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function OrderModal({
  address,
  cardMaskedPan,
  cardType,
  total,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="order-modal-backdrop is-open"
      id="order-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="order-modal">
        <div className="order-modal-header">
          <h2>Підтвердження замовлення</h2>
          <p>Перевір дані перед оформленням.</p>
        </div>

        <div className="order-modal-card">
          <div className="order-modal-row">
            <span className="label">Адреса доставки</span>
            <span className="value" id="order-address">
              {address}
            </span>
          </div>

          <div className="order-modal-row">
            <span className="label">Спосіб оплати</span>
            <span className="value" id="order-card">
              {cardType ? `${cardType} ` : ""}
              {cardMaskedPan}
            </span>
          </div>

          <div className="order-modal-row order-modal-row-total">
            <span className="label">Сума до сплати</span>
            <span className="value price" id="order-total">
              {total.toFixed(2)} ₴
            </span>
          </div>
        </div>

        <div className="order-modal-footer">
          <button className="order-btn secondary" onClick={onCancel}>
            Скасувати
          </button>
          <button className="order-btn primary" onClick={onConfirm}>
            Підтвердити
          </button>
        </div>
      </div>
    </div>
  );
}
