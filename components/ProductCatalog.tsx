"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useSearchStore } from "@/store/searchStore.ts";
import { toast } from "sonner";
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

// ─── Fuzzy search ────────────────────────────────────────────────────────────

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function fuzzyWindowMatch(text: string, q: string): boolean {
  if (q.length < 3) return false;
  for (let len = Math.max(2, q.length - 1); len <= q.length + 1; len++) {
    for (let i = 0; i <= text.length - len; i++) {
      if (editDistance(text.slice(i, i + len), q) <= 1) return true;
    }
  }
  return false;
}

function scoreProduct(p: Product, query: string): number {
  if (!query.trim()) return 1;
  const q = query.toLowerCase().trim();
  const name = (p.name ?? "").toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  const cat = (p.category ?? "").toLowerCase();
  if (name.includes(q)) return 1.0;
  if (desc.includes(q) || cat.includes(q)) return 0.85;
  const combined = name + " " + desc + " " + cat;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => combined.includes(w))) return 0.75;
  if (!q.includes(" ") && fuzzyWindowMatch(name, q)) return 0.55;
  return 0;
}

function fuzzyFilter(items: Product[], query: string): Product[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreProduct(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

// ─── Константи ───────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialProducts: Product[];
  searchQuery?: string;
  category?: string;
  limit?: number;
  hideFilter?: boolean;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function ProductCatalog({
  initialProducts,
  searchQuery = "",
  category,
  limit,
  hideFilter = false,
}: Props) {
  const { user, token } = useAuthStore();
  const { addItem } = useCartStore();
  const { liveQuery } = useSearchStore();
  const queryClient = useQueryClient();

  const effectiveQuery = liveQuery || searchQuery;
  const isAdmin = user?.admin ?? false;

  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(category ?? "");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [overlayProductId, setOverlayProductId] = useState<number | null>(null);

  // Admin form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const isNewCategory = form.category === "__new__";
  const effectiveCategory = isNewCategory ? form.customCategory : form.category;

  // ─── TanStack Query: завантаження товарів ─────────────────────────────────

  const {
    data: products = initialProducts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: apiGetProducts,
    // SSR initialData — не перезавантажує якщо дані свіжі
    initialData: initialProducts,
    // Перевіряти свіжість кожні 60 сек
    staleTime: 60_000,
  });

  // Скидати сторінку при зміні пошуку / категорії
  useMemo(() => {
    setPage(1);
  }, [effectiveQuery, activeCategory]);

  // ─── TanStack Query: мутації ──────────────────────────────────────────────

  /** Після будь-якої мутації — інвалідувати кеш продуктів */
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["products"] });

  const createMutation = useMutation({
    mutationFn: (payload: Omit<Product, "id">) =>
      apiCreateProduct(payload, token!),
    onSuccess: () => {
      toast.success("Товар додано ✓");
      setForm(EMPTY_FORM);
      setAdminOpen(false);
      invalidate();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Помилка при збереженні"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Product> }) =>
      apiUpdateProduct(id, payload, token!),
    onSuccess: () => {
      toast.success("Товар оновлено ✓");
      setForm(EMPTY_FORM);
      setEditingId(null);
      setAdminOpen(false);
      invalidate();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Помилка при збереженні"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteProduct(id, token!),
    onSuccess: () => {
      toast.success("Товар видалено");
      invalidate();
    },
    onError: () => toast.error("Не вдалося видалити товар"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) =>
      apiToggleProductVisibility(id, hidden, token!),
    // Оптимістичне оновлення — відразу показуємо зміну в UI без очікування сервера
    onMutate: async ({ id, hidden }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const prev = queryClient.getQueryData<Product[]>(["products"]);
      queryClient.setQueryData<Product[]>(["products"], (old = []) =>
        old.map((p) => (p.id === id ? { ...p, hidden } : p)),
      );
      return { prev };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Product[]>(["products"], (old = []) =>
        old.map((p) => (p.id === updated.id ? updated : p)),
      );
      toast.success(updated.hidden ? "Товар приховано" : "Товар показано");
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["products"], ctx.prev);
      toast.error("Не вдалося змінити видимість");
    },
    onSettled: () => setOverlayProductId(null),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      weight: form.weight,
      price: parseFloat(form.price),
      imageName: form.imageName,
      category: effectiveCategory,
    };
    if (editingId != null) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload as Omit<Product, "id">);
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
      toast.error("Не вдалося завантажити товар");
    }
  }

  const f =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ─── Фільтрація і пагінація ───────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [products]);

  const categoryFiltered = products.filter((p) => {
    if (!isAdmin && p.hidden) return false;
    return !activeCategory || p.category === activeCategory;
  });

  const filtered = fuzzyFilter(categoryFiltered, effectiveQuery);
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

  // ─── Стилі ────────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

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
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
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
        {/* Skeleton при завантаженні */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Помилка */}
        {!isLoading && isError && (
          <p className="error-wrap">Не вдалося завантажити товари</p>
        )}

        {/* Порожній стан */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1" }}>
            <EmptyState
              title={
                effectiveQuery ? "Нічого не знайдено" : "Товарів поки немає"
              }
              subtitle={
                effectiveQuery
                  ? `За запитом «${effectiveQuery}» нічого не знайдено`
                  : "Поверніться пізніше — скоро буде більше~"
              }
            />
          </div>
        )}

        {/* Картки товарів */}
        {!isLoading &&
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
                  <img src={p.image || "/images/no-image.jpeg"} alt={p.name} />
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
                          p.image || "/images/no-image.jpeg",
                          p.description || "",
                          p.id,
                        );
                        toast.success(`${p.name} додано до кошика 🛒`);
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
                        toggleMutation.mutate({ id: p.id, hidden: !p.hidden });
                      }}
                      disabled={toggleMutation.isPending}
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

      {/* Пагінація */}
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
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
