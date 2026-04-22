"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  apiUpdateProfile,
  apiChangePassword,
  apiUpdatePayment,
  apiGetMyOrders,
} from "@/lib/api";
import type { Order } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User,
  Package,
  Mail,
  Phone,
  Lock,
  CreditCard,
  MapPin,
  LogOut,
  ChevronRight,
  Pencil,
  type LucideIcon,
} from "lucide-react";

type Tab = "profile" | "orders";
type Field = "name" | "email" | "phone" | "password" | "payment" | "address";

const FIELD_LABELS: Record<Field, string> = {
  name: "Редагувати ім'я",
  email: "Редагувати ел. пошту",
  phone: "Редагувати номер телефону",
  password: "Змінити пароль",
  payment: "Редагувати способи оплати",
  address: "Редагувати адресу",
};

// ─── EditModal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  field: Field;
  currentValue: string;
  onSave: (val: string, extra?: { old: string; newPass: string }) => void;
  onClose: () => void;
}

function EditModal({ field, currentValue, onSave, onClose }: EditModalProps) {
  const [val, setVal] = useState(currentValue);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [err, setErr] = useState("");

  function handleSave() {
    setErr("");
    if (field === "password") {
      if (!oldPw || !newPw || !confPw) {
        setErr("Всі поля пароля повинні бути заповнені.");
        return;
      }
      if (newPw !== confPw) {
        setErr("Новий пароль та підтвердження не співпадають.");
        return;
      }
      onSave("••••••••", { old: oldPw, newPass: newPw });
    } else {
      onSave(val.trim());
    }
  }

  return (
    <div
      id="edit-modal"
      className="modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="document">
        <button className="modal-close" aria-label="Закрити" onClick={onClose}>
          &times;
        </button>
        <h3 id="modal-title">{FIELD_LABELS[field]}</h3>

        {field !== "password" ? (
          <div id="modal-row-single">
            <input
              id="modal-input"
              className="modal-input"
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        ) : (
          <div id="modal-row-password">
            <input
              id="modal-old"
              className="modal-input"
              type="password"
              placeholder="Старий пароль"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
            />
            <input
              id="modal-new"
              className="modal-input"
              type="password"
              placeholder="Новий пароль"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <input
              id="modal-confirm"
              className="modal-input"
              type="password"
              placeholder="Повторіть новий пароль"
              value={confPw}
              onChange={(e) => setConfPw(e.target.value)}
            />
            {err && (
              <div
                id="modal-error"
                style={{ color: "#c0392b", fontSize: "0.95rem", marginTop: 6 }}
              >
                {err}
              </div>
            )}
          </div>
        )}

        {field === "password" && (
          <a
            id="modal-forgot"
            className="modal-forgot"
            href="/login"
            aria-label="Забули пароль?"
          >
            Забули пароль?
          </a>
        )}

        <div className="modal-buttons">
          <button
            id="modal-cancel"
            className="btn btn-secondary"
            type="button"
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            id="modal-save"
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OrderHistory ─────────────────────────────────────────────────────────────

function OrderHistory({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGetMyOrders(token)
      .then((data) => setOrders(data))
      .catch(() => setError("Не вдалося завантажити замовлення"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (orders.length === 0) return <p>У вас поки немає замовлень.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {orders.map((order) => (
        <div
          key={order.id}
          className="account-card"
          style={{ padding: "1rem 1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <strong>Замовлення #{order.id}</strong>
            <span
              style={{
                background:
                  order.status === "Доставлено" ? "#27ae60" : "#e67e22",
                color: "#fff",
                borderRadius: "1rem",
                padding: "0.15rem 0.75rem",
                fontSize: "0.85rem",
              }}
            >
              {order.status}
            </span>
          </div>
          <p
            style={{
              color: "#888",
              fontSize: "0.85rem",
              marginBottom: "0.75rem",
            }}
          >
            {new Date(order.createdAt).toLocaleString("uk-UA")}
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {order.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.95rem",
                }}
              >
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{(item.price * item.quantity).toFixed(2)} ₴</span>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #eee",
              marginTop: "0.75rem",
              paddingTop: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 600,
            }}
          >
            <span>Сума</span>
            <span>{order.total.toFixed(2)} ₴</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AccountItem ──────────────────────────────────────────────────────────────

interface AccountItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  field: Field;
  onEdit: (f: Field) => void;
  isArrow?: boolean;
}

function AccountItem({
  icon: Icon,
  label,
  value,
  field,
  onEdit,
  isArrow,
}: AccountItemProps) {
  return (
    <div className="account-item">
      <div className="item-info">
        <Icon size={24} />
        <div>
          <strong>{label}</strong>
          {value && <p>{value}</p>}
        </div>
      </div>
      <button
        className="edit-btn"
        data-field={field}
        aria-label={`Редагувати ${label}`}
        onClick={() => onEdit(field)}
      >
        {isArrow ? <ChevronRight size={20} /> : <Pencil size={20} />}
      </button>
    </div>
  );
}

// ─── AccountPage ──────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, token, saveAuth, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [editField, setEditField] = useState<Field | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [displayAddress, setDisplayAddress] = useState("");
  const [displayPayment, setDisplayPayment] = useState("");
  const [displayPassword] = useState("");

  // Захист маршруту — редирект якщо не авторизований
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setDisplayName(user.name ?? "");
      setDisplayEmail(user.email ?? "");
      setDisplayPhone(user.phone ?? "");
      setDisplayAddress(user.address ?? "");
      setDisplayPayment(user.payment ?? "");
    }
  }, [user, router]);

  if (!user) return null;

  function getCurrentValue(field: Field): string {
    switch (field) {
      case "name":
        return displayName;
      case "email":
        return displayEmail;
      case "phone":
        return displayPhone;
      case "address":
        return displayAddress;
      case "payment":
        return displayPayment;
      case "password":
        return "";
    }
  }

  async function handleSave(
    field: Field,
    val: string,
    extra?: { old: string; newPass: string },
  ) {
    try {
      if (field === "password" && extra && token) {
        await apiChangePassword(extra.old, extra.newPass, token);
      } else if (field === "payment" && token) {
        const updated = await apiUpdatePayment(val, token);
        setDisplayPayment(val);
        saveAuth(token, updated);
      } else if (
        token &&
        (field === "name" ||
          field === "email" ||
          field === "phone" ||
          field === "address")
      ) {
        const updated = await apiUpdateProfile({ [field]: val }, token);
        saveAuth(token, updated);
        if (field === "name") setDisplayName(val);
        if (field === "email") setDisplayEmail(val);
        if (field === "phone") setDisplayPhone(val);
        if (field === "address") setDisplayAddress(val);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Помилка при збереженні");
    }
    setEditField(null);
  }

  return (
    <>
      <Header />
      <main className="account-page">
        <aside className="account-sidebar">
          <ul>
            <li
              id="profile-tab"
              className={tab === "profile" ? "active" : ""}
              onClick={() => setTab("profile")}
            >
              <User size={20} />
              <span>Обліковий запис</span>
            </li>
            <li
              id="orders-tab"
              className={tab === "orders" ? "active" : ""}
              onClick={() => setTab("orders")}
            >
              <Package size={20} />
              <span>Замовлення</span>
            </li>
          </ul>
        </aside>

        <section className="account-content">
          {tab === "profile" && (
            <div id="profile-content">
              <h1>Обліковий запис</h1>
              <div className="account-card">
                <AccountItem
                  icon={User}
                  label="Ім'я"
                  value={displayName}
                  field="name"
                  onEdit={setEditField}
                />
                <AccountItem
                  icon={Mail}
                  label="Адреса ел. пошти"
                  value={displayEmail}
                  field="email"
                  onEdit={setEditField}
                />
                <AccountItem
                  icon={Phone}
                  label="Номер телефону"
                  value={displayPhone}
                  field="phone"
                  onEdit={setEditField}
                />
                <AccountItem
                  icon={Lock}
                  label="Змінити пароль"
                  value={displayPassword}
                  field="password"
                  onEdit={setEditField}
                  isArrow
                />
                <AccountItem
                  icon={CreditCard}
                  label="Способи оплати"
                  value={displayPayment}
                  field="payment"
                  onEdit={setEditField}
                  isArrow
                />
                <AccountItem
                  icon={MapPin}
                  label="Адреса"
                  value={displayAddress}
                  field="address"
                  onEdit={setEditField}
                  isArrow
                />
                <div className="account-item logout-item">
                  <div className="item-info">
                    <LogOut size={24} />
                    <div>
                      <strong>Вийти з акаунту</strong>
                    </div>
                  </div>
                  <button
                    className="edit-btn"
                    id="logout-btn"
                    aria-label="Вийти з акаунту"
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div id="orders-content">
              <h1>Ваші замовлення</h1>
              <OrderHistory token={token!} />
            </div>
          )}
        </section>
      </main>

      {editField && (
        <EditModal
          field={editField}
          currentValue={getCurrentValue(editField)}
          onSave={(val, extra) => handleSave(editField, val, extra)}
          onClose={() => setEditField(null)}
        />
      )}

      <Footer />
    </>
  );
}
