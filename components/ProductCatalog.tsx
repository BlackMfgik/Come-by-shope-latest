"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import {
  apiGetProducts,
  apiGetProduct,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiToggleProductVisibility,
} from "@/lib/api";
import type { Product } from "@/types";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProductQuickViewModal from "@/components/modals/ProductQuickViewModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const PAGE_SIZE = 8;

interface Props {
  initialProducts: Product[];
  searchQuery?: string;
  category?: string;
  limit?: number;
}

export default function ProductCatalog({
  initialProducts,
  searchQuery = "",
  category,
  limit,
}: Props) {
  const { user, token } = useAuthStore();
  const { addItem } = useCartStore();
  const { toast } = useToastStore();

  // Task 11: load all products on mount to fix pagination
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(category ?? "");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  // Task 9: overlay per card
  const [overlayProductId, setOverlayProductId] = useState<number | null>(null);

  // Task 11: load full product list on mount (fixes pagination slicing bug)
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory]);

  // Derive unique categories from products
  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [products]);

  const [adminForm, setAdminForm] = useState({
    name: "",
    description: "",
    weight: "",
    price: "",
    imageName: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetProducts();
      setProducts(data);
    } catch {
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const payload = {
      name: adminForm.name,
      description: adminForm.description,
      weight: adminForm.weight,
      price: parseFloat(adminForm.price),
      imageName: adminForm.imageName,
    };
    try {
      if (editingId != null) {
        await apiUpdateProduct(editingId, payload, token);
        toast("Товар оновлено ✓");
        setEditingId(null);
      } else {
        await apiCreateProduct(payload, token);
        toast("Товар додано ✓");
      }
      setAdminForm({ name: "", description: "", weight: "", price: "", imageName: "" });
      await loadProducts();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Помилка при збереженні товару", "error");
    }
  }

  async function handleEdit(id: number) {
    try {
      const p = await apiGetProduct(id);
      setAdminForm({
        name: p.name,
        description: p.description ?? "",
        weight: p.weight ?? "",
        price: String(p.price),
        imageName: p.imageName ?? "",
      });
      setEditingId(id);
      document.getElementById("admin-panel")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      toast("Не вдалося завантажити товар", "error");
    }
  }

  async function handleDeleteConfirmed(id: number) {
    if (!token) return;
    try {
      await apiDeleteProduct(id, token);
      toast("Товар видалено", "success");
      await loadProducts();
    } catch {
      toast("Не вдалося видалити товар", "error");
    }
  }

  // Task 9: toggle visibility
  async function handleToggleVisibility(p: Product) {
    if (!token) return;
    const newHidden = !p.hidden;
    try {
      const updated = await apiToggleProductVisibility(p.id, newHidden, token);
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      toast(newHidden ? "Товар приховано 👁️" : "Товар показано 👁️");
    } catch {
      toast("Не вдалося змінити видимість", "error");
    }
    setOverlayProductId(null);
  }

  const isAdmin = user?.admin;

  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered
    .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    .slice(0, limit ?? undefined);

  function scrollToTop() {
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToPage(p: number) {
    setPage(p);
    scrollToTop();
  }

  return (
    <>
      {isAdmin && (
        <section id="admin-panel" className="admin-panel">
          <form id="admin-product-form" onSubmit={handleAdminSubmit}>
            <input
              id="admin-product-name"
              type="text"
              placeholder="Назва товару"
              required
              value={adminForm.name}
              onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              id="admin-product-description"
              placeholder="Опис товару"
              value={adminForm.description}
              onChange={(e) => setAdminForm((f) => ({ ...f, description: e.target.value }))}
            />
            <input
              id="admin-product-weight"
              type="text"
              placeholder="Вага"
              value={adminForm.weight}
              onChange={(e) => setAdminForm((f) => ({ ...f, weight: e.target.value }))}
            />
            <input
              id="admin-product-price"
              type="number"
              step="0.01"
              placeholder="Ціна"
              required
              value={adminForm.price}
              onChange={(e) => setAdminForm((f) => ({ ...f, price: e.target.value }))}
            />
            <input
              id="admin-product-image"
              type="text"
              placeholder="Назва зображення (без формату)"
              value={adminForm.imageName}
              onChange={(e) => setAdminForm((f) => ({ ...f, imageName: e.target.value }))}
            />
            <button className="add-btn" type="submit">
              {editingId != null ? "Зберегти зміни" : "Додати товар"}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setAdminForm({ name: "", description: "", weight: "", price: "", imageName: "" });
                }}
                style={{ marginLeft: 8 }}
              >
                Скасувати
              </button>
            )}
          </form>
        </section>
      )}

      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      <section className="catalog" id="catalog">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && error && <p className="error-wrap">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1" }}>
            <EmptyState
              title={searchQuery ? "Нічого не знайдено" : "Товарів поки немає"}
              subtitle={
                searchQuery
                  ? `За запитом «${searchQuery}» нічого не знайдено`
                  : "Поверніться пізніше — скоро буде більше~"
              }
            />
          </div>
        )}

        {!loading &&
          paginated.map((p) => {
            const isHidden = p.hidden === true;
            const showOverlay = isAdmin && overlayProductId === p.id;

            return (
              <div
                className={`product-card${isHidden && !isAdmin ? " product-card--hidden" : ""}`}
                data-id={p.id}
                key={p.id}
                style={{ position: "relative", cursor: "pointer" }}
                onClick={() => {
                  if (isAdmin) {
                    setOverlayProductId(overlayProductId === p.id ? null : p.id);
                  } else {
                    setQuickViewProduct(p);
                  }
                }}
              >
                {/* Task 9: "unavailable" badge for hidden products (non-admin) */}
                {isHidden && !isAdmin && (
                  <div className="product-hidden-badge">Немає в наявності</div>
                )}

                <div className="product-img">
                  <img src={p.image || "/images/no-image.png"} alt={p.name} />
                </div>
                <div className="product-info">
                  <div>
                    <b>{p.name}</b>
                    <div className="product-weight">{p.weight}</div>
                  </div>
                  <div className="product-bottom">
                    <span className="product-price">
                      {Number(p.price).toFixed(2)} ₴
                    </span>
                    <button
                      className="add-btn"
                      style={isHidden && !isAdmin ? { pointerEvents: "none", opacity: 0.4 } : undefined}
                      disabled={isHidden && !isAdmin}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdmin) return; // admin click handled by card
                        addItem(
                          p.name,
                          p.price,
                          p.image || "/images/no-image.png",
                          p.description || "",
                          p.id,
                        );
                        toast(`${p.name} додано до кошика 🛒`);
                      }}
                    >
                      <span>+</span> Додати
                    </button>
                  </div>
                </div>

                {/* Task 9: Admin overlay */}
                {showOverlay && (
                  <div
                    className="admin-card-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setOverlayProductId(null);
                    }}
                  >
                    <button
                      className="admin-overlay-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverlayProductId(null);
                        handleEdit(p.id);
                      }}
                    >
                      ✏️ Змінити
                    </button>
                    <button
                      className="admin-overlay-btn admin-overlay-btn--danger"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverlayProductId(null);
                        setDeleteTarget(p);
                      }}
                    >
                      🗑️ Видалити
                    </button>
                    <button
                      className="admin-overlay-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(p);
                      }}
                    >
                      {isHidden ? <><Eye size={14} /> Показати</> : <><EyeOff size={14} /> Приховати</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </section>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Попередня сторінка"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn${p === safePage ? " active" : ""}`}
              onClick={() => goToPage(p)}
              aria-label={`Сторінка ${p}`}
              aria-current={p === safePage ? "page" : undefined}
            >
              {p}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Наступна сторінка"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="pagination-info">
          Показано {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} з {filtered.length}{" "}
          товарів
        </p>
      )}

      {!isAdmin && quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirmed(deleteTarget.id)}
        />
      )}
    </>
  );
}
