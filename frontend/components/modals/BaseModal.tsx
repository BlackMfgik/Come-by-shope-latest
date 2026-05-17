"use client";

/**
 * components/modals/BaseModal.tsx
 *
 * Базовий компонент для всіх модалок.
 *
 * Виправляє баг: якщо юзер починає виділяти текст у полі вводу всередині
 * модалки і відпускає мишку на оверлеї — модалка НЕ закривається.
 * Закриття по кліку на overlay спрацьовує ТІЛЬКИ якщо onMouseDown і onMouseUp
 * обидва відбулися на самому overlay.
 *
 * Props:
 *  onClose            — функція закриття
 *  disableOutsideClick — якщо true, клік на overlay не закриває (для форм)
 *  maxWidth           — ширина модалки (default: 420)
 *  children           — вміст
 */
import { useRef } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  onClose: () => void;
  disableOutsideClick?: boolean;
  maxWidth?: number;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}

export default function BaseModal({
  onClose,
  disableOutsideClick = false,
  maxWidth = 420,
  children,
  "aria-labelledby": labelledBy,
}: BaseModalProps) {
  // Відстежуємо чи mousedown відбувся на overlay (не на контенті)
  const mouseDownOnOverlay = useRef(false);

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    mouseDownOnOverlay.current = e.target === e.currentTarget;
  }

  function handleOverlayMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (
      !disableOutsideClick &&
      mouseDownOnOverlay.current &&
      e.target === e.currentTarget
    ) {
      onClose();
    }
    mouseDownOnOverlay.current = false;
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="modal-content" style={{ maxWidth }}>
        {/* Хрестик закриття */}
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Закрити"
          type="button"
        >
          <X size={16} />
        </button>

        {children}
      </div>
    </div>
  );
}
