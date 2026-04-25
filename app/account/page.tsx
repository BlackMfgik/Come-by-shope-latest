"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import {
  apiUpdateProfile,
  apiChangePassword,
  apiUpdatePayment,
  apiGetMyOrders,
} from "@/lib/api";
import type { Order } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/ui/EmptyState";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";
import ConfirmPasswordModal from "@/components/modals/ConfirmPasswordModal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import {
  User,
  Mail,
  Phone,
  Lock,
  CreditCard,
  MapPin,
  LogOut,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Pencil,
  Package,
  ClipboardList,
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

// ─── EditModal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  field: Field;
  currentValue: string;
  onSave: (val: string, extra?: { old: string; newPass: string }) => void;
  onClose: () => void;
  onForgotPassword?: () => void;
}

function EditModal({ field, currentValue, onSave, onClose, onForgotPassword }: EditModalProps) {
  const [val, setVal] = useState(currentValue);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [err, setErr] = useState("");
  const editContainerRef = useRef<HTMLDivElement>(null);

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

        <div ref={editContainerRef}>
          {field === "address" ? (
            <div id="modal-row-single">
              <AddressAutocomplete
                value={val}
                onChange={setVal}
                placeholder="Введіть адресу доставки"
                id="modal-address-input"
                className="modal-input"
              />
            </div>
          ) : field !== "password" ? (
            <div id="modal-row-single">
              <input
                id="modal-input"
                className="modal-input"
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={(e) => {
                  if (!editContainerRef.current?.contains(e.relatedTarget as Node)) {
                    // don't close, user is still inside modal
                  }
                }}
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
            <button
              id="modal-forgot"
              className="modal-forgot forgot-link"
              type="button"
              aria-label="Забули пароль?"
              style={{ marginTop: 8, display: "block" }}
              onClick={() => {
                onClose();
                onForgotPassword?.();
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              Забули пароль?
            </button>
          )}

          <div className="modal-buttons">
            <button
              id="modal-cancel"
              className="btn btn-secondary"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClose}
            >
              Скасувати
            </button>
            <button
              id="modal-save"
              className="btn btn-primary"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
            >
              Зберегти
            </button>
          </div>
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
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  useEffect(() => {
    apiGetMyOrders(token)
      .then((data) => setOrders(data))
      .catch(() => setError("Не вдалося завантажити замовлення"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <EmptyState
        icon={<ClipboardList size={36} strokeWidth={1.5} />}
        title="Завантаження замовлень…"
      />
    );

  if (error) return <p style={{ color: "var(--red, #e53935)" }}>{error}</p>;

  if (orders.length === 0)
    return (
      <EmptyState
        icon={<ShoppingBag size={36} strokeWidth={1.5} />}
        title="Замовлень поки немає"
        subtitle="Оформіть перше замовлення в магазині~"
      />
    );

  return (
    <div className="orders-list">
      {orders.map((order) => {
        const isDelivered =
          order.status === "Доставлено" || order.status === "delivered";
        const isOpen = openOrderId === order.id;

        return (
          <div
            key={order.id}
            className={`order-card${isOpen ? " open" : ""}`}
          >
            <button
              className="order-card-header"
              onClick={() => setOpenOrderId(isOpen ? null : order.id)}
              aria-expanded={isOpen}
              aria-label={`Деталі замовлення #${order.id}`}
            >
              <div className="order-card-left">
                <span className="order-number">Замовлення #{order.id}</span>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleString("uk-UA")}
                </span>
              </div>
              <div className="order-card-right">
                <span
                  className="order-status"
                  style={{ background: isDelivered ? "#27ae60" : "#e67e22" }}
                >
                  {order.status}
                </span>
                <span className="order-total-preview">
                  {order.total.toFixed(2)} ₴
                </span>
                <span className={`order-chevron${isOpen ? " rotated" : ""}`}>
                  <ChevronDown size={18} />
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="order-card-body">
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <span className="order-item-name">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="order-item-price">
                        {(item.price * item.quantity).toFixed(2)} ₴
                      </span>
                    </div>
                  ))}
                </div>
                <div className="order-summary-row">
                  <span>Разом:</span>
                  <span>{order.total.toFixed(2)} ₴</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span
                    className="order-status"
                    style={{
                      background: isDelivered ? "#27ae60" : "#e67e22",
                      display: "inline-block",
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AccountItem ──────────────────────────────────────────────────────────────

interface AccountItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  field: Field;
  onEdit: (f: Field) => void;
  isArrow?: boolean;
}

function AccountItem({
  icon,
  label,
  value,
  field,
  onEdit,
  isArrow,
}: AccountItemProps) {
  return (
    <div
      className="account-item"
      onClick={() => onEdit(field)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onEdit(field)}
      aria-label={`Редагувати ${label}`}
    >
      <div className="item-info">
        <span className="account-item-icon">{icon}</span>
        <div>
          <strong>{label}</strong>
          {value && <p>{value}</p>}
        </div>
      </div>
      <span className="account-item-icon" style={{ color: "var(--text-3)" }}>
        {isArrow ? <ChevronRight size={18} /> : <Pencil size={16} />}
      </span>
    </div>
  );
}

// ─── AccountPage ──────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, token, saveAuth, logout, _hasHydrated } = useAuthStore();
  const { toast } = useToastStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [editField, setEditField] = useState<Field | null>(null);

  // Task 2 — change email modal
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  // Task 3 — confirm password before payment edit
  const [confirmPwOpen, setConfirmPwOpen] = useState(false);
  // Task 5 — forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [displayAddress, setDisplayAddress] = useState("");
  const [displayPayment, setDisplayPayment] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.push("/login");
    } else {
      setDisplayName(user.name ?? "");
      setDisplayEmail(user.email ?? "");
      setDisplayPhone(user.phone ?? "");
      setDisplayAddress(user.address ?? "");
      setDisplayPayment(user.payment ?? "");
    }
  }, [user, router, _hasHydrated]);

  if (!_hasHydrated) return null;
  if (!user) return null;

  // Task 3 — masked payment display
  function maskedPayment(raw: string): string {
    if (!raw) return "Не вказано";
    // If already masked or has last 4 digits
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 4) {
      return "**** **** **** " + digits.slice(-4);
    }
    return raw;
  }

  function getCurrentValue(field: Field): string {
    switch (field) {
      case "name": return displayName;
      case "email": return displayEmail;
      case "phone": return displayPhone;
      case "address": return displayAddress;
      case "payment": return displayPayment;
      case "password": return "";
    }
  }

  // Task 6 — clicking any field dispatches to correct handler
  function handleEditField(field: Field) {
    if (field === "email") {
      // Task 2 — open ChangeEmailModal instead of inline
      setChangeEmailOpen(true);
    } else if (field === "payment") {
      // Task 3 — confirm password before editing payment
      setConfirmPwOpen(true);
    } else {
      setEditField(field);
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
        toast("Пароль змінено успішно");
      } else if (field === "payment" && token) {
        const updated = await apiUpdatePayment(val, token);
        setDisplayPayment(val);
        saveAuth(token, updated);
        toast("Платіжні дані збережено");
      } else if (
        token &&
        (field === "name" || field === "phone" || field === "address")
      ) {
        const updated = await apiUpdateProfile({ [field]: val }, token);
        saveAuth(token, updated);
        if (field === "name") setDisplayName(val);
        if (field === "phone") setDisplayPhone(val);
        if (field === "address") setDisplayAddress(val);
        toast("Профіль оновлено");
      }
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Помилка при збереженні",
        "error",
      );
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
              <span className="account-item-icon">
                <User size={18} />
              </span>
              <span>Обліковий запис</span>
            </li>
            <li
              id="orders-tab"
              className={tab === "orders" ? "active" : ""}
              onClick={() => setTab("orders")}
            >
              <span className="account-item-icon">
                <Package size={18} />
              </span>
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
                  icon={<User size={18} />}
                  label="Ім'я"
                  value={displayName}
                  field="name"
                  onEdit={handleEditField}
                />
                <AccountItem
                  icon={<Mail size={18} />}
                  label="Адреса ел. пошти"
                  value={displayEmail}
                  field="email"
                  onEdit={handleEditField}
                />
                <AccountItem
                  icon={<Phone size={18} />}
                  label="Номер телефону"
                  value={displayPhone}
                  field="phone"
                  onEdit={handleEditField}
                />
                <AccountItem
                  icon={<Lock size={18} />}
                  label="Змінити пароль"
                  value=""
                  field="password"
                  onEdit={handleEditField}
                  isArrow
                />
                <AccountItem
                  icon={<CreditCard size={18} />}
                  label="Способи оплати"
                  value={maskedPayment(displayPayment)}
                  field="payment"
                  onEdit={handleEditField}
                  isArrow
                />
                <AccountItem
                  icon={<MapPin size={18} />}
                  label="Адреса"
                  value={displayAddress}
                  field="address"
                  onEdit={handleEditField}
                  isArrow
                />

                <div
                  className="account-item logout-item"
                  onClick={() => { logout(); router.push("/login"); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && (logout(), router.push("/login"))}
                  aria-label="Вийти з акаунту"
                >
                  <div className="item-info">
                    <span className="account-item-icon">
                      <LogOut size={18} />
                    </span>
                    <div>
                      <strong>Вийти з акаунту</strong>
                    </div>
                  </div>
                  <span className="account-item-icon" style={{ color: "var(--text-3)" }}>
                    <ChevronRight size={18} />
                  </span>
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

      {/* Task 4 fix: only non-email/payment fields use EditModal with blur fix */}
      {editField && (
        <EditModal
          field={editField}
          currentValue={getCurrentValue(editField)}
          onSave={(val, extra) => handleSave(editField, val, extra)}
          onClose={() => setEditField(null)}
          onForgotPassword={() => setForgotOpen(true)}
        />
      )}

      {/* Task 2 — change email modal */}
      {changeEmailOpen && token && (
        <ChangeEmailModal
          token={token}
          onClose={() => {
            setChangeEmailOpen(false);
            // Refresh email from store
            if (user) setDisplayEmail(user.email ?? "");
          }}
        />
      )}

      {/* Task 3 — confirm password before payment edit */}
      {confirmPwOpen && token && (
        <ConfirmPasswordModal
          token={token}
          onSuccess={() => {
            setConfirmPwOpen(false);
            setEditField("payment");
          }}
          onClose={() => setConfirmPwOpen(false)}
        />
      )}

      {/* Task 5 — forgot password modal */}
      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}

      <Footer />
    </>
  );
}
