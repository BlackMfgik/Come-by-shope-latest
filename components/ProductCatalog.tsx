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
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProductQuickViewModal from "@/components/modals/ProductQuickViewModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const PAGE_SIZE = 8;

const EMPTY_FORM = {
  name: "",
  description: "",
  weight: "",
  price: "",
  imageName: "",
  category: "",
  customCategory: "",
};

interface Props {
  initialProducts: Product[];
  searchQuery?: string;
  category?: string;
  limit?: number;
  hideFilter?: boolean;
}

export default function ProductCatalog({
  initialProducts,
  searchQuery = "",
  category,
  limit,
  hideFilter = false,
}: Props) {
  const { user, token } = useAuthStore();
  const { addItem } = useCartStore();
  const { toast } = useToastStore();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(category ?? "");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [overlayProductId, setOverlayProductId] = useState<number | null>(null);

  // Admin form
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const isAdmin = user?.admin ?? false;
  const isNewCategory = form.category === "__new__";
  const effectiveCategory = isNewCategory ? form.customCategory : form.category;

  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      setProducts(await apiGetProducts());
    } catch {
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      weight: form.weight,
      price: parseFloat(form.price),
      imageName: form.imageName,
      category: effectiveCategory,
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
      setForm(EMPTY_FORM);
      setAdminOpen(false);
      await loadProducts();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Помилка при збереженні",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: number) {
    try {
      const p = await apiGetProduct(id);
      setForm({
        name: p.name,
        description: p.description ?? "",
        weight: p.weight ?? "",
        price: String(p.price),
        imageName: p.imageName ?? "",
        category: p.category ?? "",
        customCategory: "",
      });
      setEditingId(id);
      setAdminOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast("Не вдалося завантажити товар", "error");
    }
  }

  async function handleDeleteConfirmed(id: number) {
    if (!token) return;
    try {
      await apiDeleteProduct(id, token);
      toast("Товар видалено");
      await loadProducts();
    } catch {
      toast("Не вдалося видалити товар", "error");
    }
  }

  async function handleToggleVisibility(p: Product) {
    if (!token) return;
    try {
      const updated = await apiToggleProductVisibility(p.id, !p.hidden, token);
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? updated : item)),
      );
      toast(p.hidden ? "Товар показано" : "Товар приховано");
    } catch {
      toast("Не вдалося змінити видимість", "error");
    }
    setOverlayProductId(null);
  }

  const f =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const filtered = products.filter((p) => {
    if (!isAdmin && p.hidden) return false;
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

  function goToPage(p: number) {
    setPage(p);
    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: "0.5px solid var(--border-2)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-2)",
  };

  return (
    <>
      {/* ── Адмін форма ── */}
      {isAdmin && (
        <div
          style={{
            marginTop: "calc(80px * var(--scale))",
            maxWidth: 900,
            margin: "calc(80px * var(--scale)) auto 0",
            padding: "0 calc(24px * var(--scale))",
          }}
        >
          {/* Кнопка відкрити/закрити */}
          {!adminOpen && (
            <button
              onClick={() => {
                setAdminOpen(true);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
                border: "1.5px solid var(--accent)",
                background: "transparent",
                color: "var(--accent)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              <Plus size={16} /> Додати товар
            </button>
          )}

          {adminOpen && (
            <div
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 16,
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
                  {editingId != null ? "Редагування товару" : "Новий товар"}
                </h2>
                <button
                  onClick={() => {
                    setAdminOpen(false);
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "0.5px solid var(--border-2)",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-2)",
                  }}
                >
                  <X size={14} /> Скасувати
                </button>
              </div>

              <form id="admin-product-form" onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label style={labelStyle}>Назва товару *</label>
                    <input
                      placeholder="Наприклад: Суші-бокс"
                      required
                      value={form.name}
                      onChange={f("name")}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label style={labelStyle}>Категорія</label>
                    <select
                      value={form.category}
                      onChange={f("category")}
                      style={inputStyle}
                    >
                      <option value="">— без категорії —</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__">+ Нова категорія...</option>
                    </select>
                  </div>

                  {isNewCategory && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        gridColumn: "2",
                      }}
                    >
                      <label style={labelStyle}>Назва нової категорії</label>
                      <input
                        placeholder="Введи назву"
                        value={form.customCategory}
                        onChange={f("customCategory")}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      gridColumn: "1 / -1",
                    }}
                  >
                    <label style={labelStyle}>Опис</label>
                    <textarea
                      placeholder="Короткий опис товару"
                      value={form.description}
                      onChange={f("description")}
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label style={labelStyle}>Ціна (₴) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={form.price}
                      onChange={f("price")}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <label style={labelStyle}>Вага / об'єм</label>
                    <input
                      placeholder="Наприклад: 300г"
                      value={form.weight}
                      onChange={f("weight")}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      gridColumn: "1 / -1",
                    }}
                  >
                    <label style={labelStyle}>
                      Назва зображення{" "}
                      <span style={{ fontWeight: 400, color: "var(--text-2)" }}>
                        (без розширення)
                      </span>
                    </label>
                    <input
                      placeholder="sushi-box-1"
                      value={form.imageName}
                      onChange={f("imageName")}
                      style={inputStyle}
                    />
                  </div>

                  {/* Кнопка всередині grid — займає обидві колонки, знизу */}
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 4,
                    }}
                  >
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Plus size={16} />
                      {saving
                        ? "Зберігаємо..."
                        : editingId != null
                          ? "Зберегти зміни"
                          : "Додати товар"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Фільтр категорій ── */}
      {!hideFilter && categories.length > 0 && (
        <div
          style={
            isAdmin ? undefined : { marginTop: "calc(80px * var(--scale))" }
          }
        >
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>
      )}

      {/* ── Каталог ── */}
      <section
        className="catalog"
        id="catalog"
        style={
          (!hideFilter && categories.length > 0) || isAdmin
            ? { marginTop: 0 }
            : undefined
        }
      >
        {loading &&
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

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
                className="product-card"
                data-id={p.id}
                key={p.id}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  opacity: isHidden && isAdmin ? 0.55 : 1,
                }}
                onClick={() => {
                  if (isAdmin) {
                    setOverlayProductId(
                      overlayProductId === p.id ? null : p.id,
                    );
                  } else {
                    setQuickViewProduct(p);
                  }
                }}
              >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdmin) return;
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

                {/* Admin overlay */}
                {showOverlay && (
                  <div
                    className="admin-card-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget)
                        setOverlayProductId(null);
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
                      <Pencil size={14} /> Змінити
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
                      <Trash2 size={14} /> Видалити
                    </button>
                    <button
                      className="admin-overlay-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(p);
                      }}
                    >
                      {isHidden ? (
                        <>
                          <Eye size={14} /> Показати
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Приховати
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </section>

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
