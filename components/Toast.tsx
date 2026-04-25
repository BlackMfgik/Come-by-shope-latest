"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store/toastStore";

const ICONS = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

function ToastBubble({ item }: { item: ToastItem }) {
  const { dismiss } = useToastStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`toast toast-${item.type}${visible ? " toast-visible" : ""}`}
    >
      <span className="toast-icon">{ICONS[item.type]}</span>
      <span className="toast-message">{item.message}</span>
      <button
        className="toast-close"
        onClick={() => dismiss(item.id)}
        aria-label="Закрити"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useToastStore();
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastBubble key={t.id} item={t} />
      ))}
    </div>
  );
}
