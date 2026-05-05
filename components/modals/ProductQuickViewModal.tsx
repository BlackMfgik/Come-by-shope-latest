"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import type { Product } from "@/types";

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <div
      className="lightbox-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="lightbox-controls">
        <button
          className="lightbox-btn"
          onClick={() => setZoomed((z) => !z)}
          aria-label="Масштаб"
        >
          {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
        </button>
        <button className="lightbox-btn" onClick={onClose} aria-label="Закрити">
          <X size={18} />
        </button>
      </div>
      <div
        className={`lightbox-img-wrap${zoomed ? " lightbox-zoomed" : ""}`}
        onClick={() => setZoomed((z) => !z)}
      >
        <img src={src} alt={alt} draggable={false} />
      </div>
    </div>
  );
}

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductQuickViewModal({ product, onClose }: Props) {
  const { addItem } = useCartStore();
  const [lightbox, setLightbox] = useState(false);
  const imgSrc = product.image || "/images/no-image.png";

  function handleAdd() {
    addItem(
      product.name,
      product.price,
      imgSrc,
      product.description || "",
      product.id,
    );
    toast.success(`${product.name} додано до кошика 🛒`);
    onClose();
  }

  return (
    <>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qv-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-content quick-view-content">
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Закрити"
          >
            <X size={16} />
          </button>
          <div className="quick-view-grid">
            <div
              className="quick-view-img"
              onClick={() => setLightbox(true)}
              role="button"
              tabIndex={0}
              aria-label="Збільшити фото"
            >
              <img src={imgSrc} alt={product.name} />
              <span className="quick-view-zoom-hint">
                <Maximize2 size={16} />
              </span>
            </div>
            <div className="quick-view-info">
              <h3 id="qv-title" className="quick-view-name">
                {product.name}
              </h3>
              {product.weight && (
                <span className="quick-view-weight">{product.weight}</span>
              )}
              {product.description && (
                <p className="quick-view-desc">{product.description}</p>
              )}
              <div className="quick-view-footer">
                <span className="quick-view-price">
                  {Number(product.price).toFixed(2)} ₴
                </span>
                <button className="add-btn" onClick={handleAdd}>
                  <span>+</span> Додати
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lightbox && (
        <Lightbox
          src={imgSrc}
          alt={product.name}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}
