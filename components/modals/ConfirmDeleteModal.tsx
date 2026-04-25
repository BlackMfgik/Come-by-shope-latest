"use client";

import { X, Trash2 } from "lucide-react";

interface Props {
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({ productName, onClose, onConfirm }: Props) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 360, textAlign: "center" }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        <div className="modal-icon-wrap modal-icon-danger">
          <Trash2 size={28} color="var(--red, #e53935)" />
        </div>

        <h3 id="modal-title" style={{ margin: 0 }}>Видалити товар?</h3>
        <p className="modal-subtitle">
          «{productName}» буде видалено назавжди. Цю дію не можна скасувати.
        </p>

        <div className="modal-buttons">
          <button className="order-btn primary order-btn-danger" onClick={handleConfirm}>
            Так, видалити
          </button>
          <button className="order-btn secondary" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
