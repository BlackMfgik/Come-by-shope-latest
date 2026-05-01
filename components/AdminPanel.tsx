"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
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
import { Pencil, Trash2, Eye, EyeOff, Plus, X } from "lucide-react";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

const EMPTY_FORM = {
  name: "",
  description: "",
  weight: "",
  price: "",
  imageName: "",
  category: "",
  customCategory: "",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "0.5px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)",
  fontSize: 14,
};

function ActionBtn({
  onClick,
  children,
  title,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        border: `0.5px solid ${danger ? "#FCEBEB" : "var(--color-border-secondary)"}`,
        background: "transparent",
        color: danger ? "#A32D2D" : "var(--color-text-secondary)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function AdminPanel() {
  // ── всі хуки ПЕРЕД будь-якими умовними return ──
  const { user, token, _hasHydrated } = useAuthStore();
  const { toast } = useToastStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [products]);

  const isNewCategory = form.category === "__new__";
  const effectiveCategory = isNewCategory ? form.customCategory : form.category;

  useEffect(() => {
    if (_hasHydrated && user?.admin) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, user?.admin]);

  // ── умовні return ПІСЛЯ хуків ──
  if (!_hasHydrated) return null;
  if (!user?.admin) return null;

  async function load() {
    setLoading(true);
    try {
      setProducts(await apiGetProducts());
    } catch {
      toast("Не вдалося завантажити товари", "error");
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
      await load();
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
      await load();
    } catch {
      toast("Не вдалося видалити товар", "error");
    }
  }

  async function handleToggle(p: Product) {
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
  }

  const f =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* ── Форма ── */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "2rem",
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
          {editingId != null && (
            <button
              onClick={() => {
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
                border: "0.5px solid var(--color-border-secondary)",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
              }}
            >
              <X size={14} /> Скасувати
            </button>
          )}
        </div>

        <form id="admin-product-form" onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={labelStyle}>Назва товару *</label>
              <input
                placeholder="Наприклад: Суші-бокс"
                required
                value={form.name}
                onChange={f("name")}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    fontWeight: 400,
                  }}
                >
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
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "1.25rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "var(--color-text-primary)",
              color: "var(--color-background-primary)",
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
        </form>
      </div>

      {/* ── Таблиця товарів ── */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Товари</h2>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {products.length} позицій
          </span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: 14,
            }}
          >
            Завантаження...
          </div>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Фото", "Назва", "Категорія", "Ціна", "Статус", "Дії"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontWeight: 500,
                        color: "var(--color-text-secondary)",
                        borderBottom:
                          "0.5px solid var(--color-border-tertiary)",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                    opacity: p.hidden ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    <img
                      src={p.image || "/images/no-image.png"}
                      alt={p.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {p.category ? (
                      <span
                        style={{
                          background: "var(--color-background-secondary)",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 11,
                        }}
                      >
                        {p.category}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {Number(p.price).toFixed(2)} ₴
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: p.hidden
                          ? "var(--color-background-secondary)"
                          : "#EAF3DE",
                        color: p.hidden
                          ? "var(--color-text-secondary)"
                          : "#3B6D11",
                      }}
                    >
                      {p.hidden ? "Приховано" : "Видимий"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionBtn
                        onClick={() => handleEdit(p.id)}
                        title="Редагувати"
                      >
                        <Pencil size={14} />
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => handleToggle(p)}
                        title={p.hidden ? "Показати" : "Приховати"}
                      >
                        {p.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => setDeleteTarget(p)}
                        title="Видалити"
                        danger
                      >
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirmed(deleteTarget.id)}
        />
      )}
    </div>
  );
}
