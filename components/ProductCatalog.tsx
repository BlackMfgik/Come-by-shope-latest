"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  apiGetProducts,
  apiGetProduct,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
} from "@/lib/api";
import type { Product } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  initialProducts: Product[];
  searchQuery?: string;
  category?: string;
}

export default function ProductCatalog({
  initialProducts,
  searchQuery = "",
  category,
}: Props) {
  const { user, token } = useAuthStore();
  const { addItem } = useCartStore();

  // Ініціалізуємо зі SSR-даних — жодного useEffect на старті!
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setEditingId(null);
      } else {
        await apiCreateProduct(payload, token);
      }
      setAdminForm({
        name: "",
        description: "",
        weight: "",
        price: "",
        imageName: "",
      });
      await loadProducts();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Помилка при збереженні товару",
      );
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
      document
        .getElementById("admin-panel")
        ?.scrollIntoView({ behavior: "smooth" });
    } catch {
      alert("Не вдалося завантажити товар");
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm("Видалити товар?")) return;
    try {
      await apiDeleteProduct(id, token);
      await loadProducts();
    } catch {
      alert("Не вдалося видалити товар");
    }
  }

  const isAdmin = user?.admin;

  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });

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
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <input
              id="admin-product-description"
              placeholder="Опис товару"
              value={adminForm.description}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <input
              id="admin-product-weight"
              type="text"
              placeholder="Вага"
              value={adminForm.weight}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, weight: e.target.value }))
              }
            />
            <input
              id="admin-product-price"
              type="number"
              step="0.01"
              placeholder="Ціна"
              required
              value={adminForm.price}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, price: e.target.value }))
              }
            />
            <input
              id="admin-product-image"
              type="text"
              placeholder="Назва зображення (без формату)"
              value={adminForm.imageName}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, imageName: e.target.value }))
              }
            />
            <button className="add-btn" type="submit">
              {editingId != null ? "Зберегти зміни" : "Додати товар"}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setAdminForm({
                    name: "",
                    description: "",
                    weight: "",
                    price: "",
                    imageName: "",
                  });
                }}
                style={{ marginLeft: 8 }}
              >
                Скасувати
              </button>
            )}
          </form>
        </section>
      )}

      <section className="catalog" id="catalog">
        {loading && (
          <p style={{ textAlign: "center", opacity: 0.7 }}>Завантаження...</p>
        )}
        {error && <p className="error-wrap">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.7 }}>
            Товарів поки немає
          </p>
        )}
        {filtered.map((p) => (
          <div className="product-card" data-id={p.id} key={p.id}>
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
                  onClick={() =>
                    addItem(
                      p.name,
                      p.price,
                      p.image || "/images/no-image.png",
                      p.description || "",
                      p.id,
                    )
                  }
                >
                  <span>+</span> Додати
                </button>
              </div>
              {isAdmin && (
                <div className="admin-controls admin-only">
                  <button
                    className="admin-controls-btn admin-edit-btn"
                    type="button"
                    title="Редагувати"
                    onClick={() => handleEdit(p.id)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="admin-controls-btn admin-delete-btn"
                    type="button"
                    title="Видалити"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
