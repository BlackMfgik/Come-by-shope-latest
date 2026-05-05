"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { apiUpdateProfile, apiChangePassword, apiGetMyOrders } from "@/lib/api";
import type { Order, UserInfo } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/ui/EmptyState";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import ChangeEmailModal from "@/components/modals/ChangeEmailModal";
import ConfirmPasswordModal from "@/components/modals/ConfirmPasswordModal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import PhoneVerifyModal from "@/components/modals/PhoneVerifyModal";
import PaymentCardModal from "@/components/modals/PaymentCardModal";
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
  CheckCircle2,
  AlertCircle,
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
  saving?: boolean;
}

function EditModal({
  field,
  currentValue,
  onSave,
  onClose,
  onForgotPassword,
  saving,
}: EditModalProps) {
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
            disabled={saving}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSave}
          >
            {saving ? "Зберігаємо…" : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OrderHistory ─────────────────────────────────────────────────────────────

function OrderHistory({ token }: { token: string }) {
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  // TanStack Query — кешує замовлення, не перезавантажує при переключенні табів
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders", token],
    queryFn: () => apiGetMyOrders(token),
    staleTime: 30_000,
  });

  if (isLoading)
    return (
      <EmptyState
        icon={<ClipboardList size={36} strokeWidth={1.5} />}
        title="Завантаження замовлень…"
      />
    );
  if (isError)
    return (
      <p style={{ color: "var(--red, #e53935)" }}>
        Не вдалося завантажити замовлення
      </p>
    );
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
          <div key={order.id} className={`order-card${isOpen ? " open" : ""}`}>
            <button
              className="order-card-header"
              onClick={() => setOpenOrderId(isOpen ? null : order.id)}
              aria-expanded={isOpen}
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
  value?: string;
  badge?: React.ReactNode;
  field: Field;
  onEdit: (f: Field) => void;
  isArrow?: boolean;
}

function AccountItem({
  icon,
  label,
  value,
  badge,
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <strong>{label}</strong>
            {badge}
          </div>
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [editField, setEditField] = useState<Field | null>(null);

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [confirmPwOpen, setConfirmPwOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [displayPhoneVerified, setDisplayPhoneVerified] = useState(false);
  const [displayAddress, setDisplayAddress] = useState("");
  const [displayCardMasked, setDisplayCardMasked] = useState("");
  const [displayCardType, setDisplayCardType] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setDisplayName(user.name ?? "");
    setDisplayEmail(user.email ?? "");
    setDisplayPhone(user.phone ?? "");
    setDisplayPhoneVerified(user.phone_verified ?? false);
    setDisplayAddress(user.address ?? "");
    setDisplayCardMasked(user.card_masked_pan ?? user.payment ?? "");
    setDisplayCardType(user.card_type ?? "");
  }, [user, router, _hasHydrated]);

  if (!_hasHydrated || !user) return null;

  // ─── TanStack Query: мутації профілю ─────────────────────────────────────

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserInfo>) => apiUpdateProfile(data, token!),
    onSuccess: (updated) => {
      saveAuth(token!, updated);
      setDisplayName(updated.name ?? "");
      setDisplayAddress(updated.address ?? "");
      toast.success("Профіль оновлено");
      setEditField(null);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Помилка при збереженні"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => apiChangePassword(oldPassword, newPassword, token!),
    onSuccess: () => {
      toast.success("Пароль змінено успішно");
      setEditField(null);
    },
    onError: (err: Error) => toast.error(err.message || "Невірний пароль"),
  });

  function handleEditField(field: Field) {
    if (field === "email") {
      setChangeEmailOpen(true);
    } else if (field === "phone") {
      setPhoneModalOpen(true);
    } else if (field === "payment") {
      setConfirmPwOpen(true);
    } else {
      setEditField(field);
    }
  }

  function handleSave(
    field: Field,
    val: string,
    extra?: { old: string; newPass: string },
  ) {
    if (field === "password" && extra) {
      changePasswordMutation.mutate({
        oldPassword: extra.old,
        newPassword: extra.newPass,
      });
    } else if (field === "name" || field === "address") {
      updateProfileMutation.mutate({ [field]: val });
    }
  }

  function cardDisplay(): string {
    if (!displayCardMasked) return "Не додано";
    const type = displayCardType ? `${displayCardType} ` : "";
    return `${type}${displayCardMasked}`;
  }

  const isSaving =
    updateProfileMutation.isPending || changePasswordMutation.isPending;

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
                  value={displayPhone || "Не вказано"}
                  field="phone"
                  onEdit={handleEditField}
                  badge={
                    displayPhone ? (
                      displayPhoneVerified ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.72rem",
                            color: "var(--accent, #009956)",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} /> Верифіковано
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.72rem",
                            color: "#e67e22",
                            fontWeight: 600,
                          }}
                        >
                          <AlertCircle size={12} /> Не верифіковано
                        </span>
                      )
                    ) : null
                  }
                />
                <AccountItem
                  icon={<Lock size={18} />}
                  label="Змінити пароль"
                  field="password"
                  onEdit={handleEditField}
                  isArrow
                />
                <AccountItem
                  icon={<CreditCard size={18} />}
                  label="Спосіб оплати"
                  value={cardDisplay()}
                  field="payment"
                  onEdit={handleEditField}
                  isArrow
                />
                <AccountItem
                  icon={<MapPin size={18} />}
                  label="Адреса"
                  value={displayAddress || "Не вказано"}
                  field="address"
                  onEdit={handleEditField}
                  isArrow
                />

                <div
                  className="account-item logout-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    logout();
                    document.cookie = "token=; path=/; max-age=0";
                    router.push("/login");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (logout(), router.push("/login"))
                  }
                >
                  <div className="item-info">
                    <span className="account-item-icon">
                      <LogOut size={18} />
                    </span>
                    <div>
                      <strong>Вийти з акаунту</strong>
                    </div>
                  </div>
                  <span
                    className="account-item-icon"
                    style={{ color: "var(--text-3)" }}
                  >
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

      {editField && (
        <EditModal
          field={editField}
          currentValue={
            editField === "name"
              ? displayName
              : editField === "address"
                ? displayAddress
                : ""
          }
          onSave={(val, extra) => handleSave(editField, val, extra)}
          onClose={() => setEditField(null)}
          onForgotPassword={() => setForgotOpen(true)}
          saving={isSaving}
        />
      )}

      {changeEmailOpen && token && (
        <ChangeEmailModal
          token={token}
          onClose={() => {
            setChangeEmailOpen(false);
            if (user) setDisplayEmail(user.email ?? "");
          }}
        />
      )}

      {confirmPwOpen && token && (
        <ConfirmPasswordModal
          token={token}
          onSuccess={() => {
            setConfirmPwOpen(false);
            setPaymentModalOpen(true);
          }}
          onClose={() => setConfirmPwOpen(false)}
        />
      )}

      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}

      {phoneModalOpen && token && (
        <PhoneVerifyModal
          token={token}
          currentPhone={displayPhone}
          onSuccess={(updatedUser) => {
            saveAuth(token, updatedUser);
            setDisplayPhone(updatedUser.phone ?? "");
            setDisplayPhoneVerified(updatedUser.phone_verified ?? false);
            setPhoneModalOpen(false);
            toast.success("Телефон підтверджено ✓");
          }}
          onClose={() => setPhoneModalOpen(false)}
        />
      )}

      {paymentModalOpen && token && (
        <PaymentCardModal
          token={token}
          onSuccess={(updatedUser) => {
            saveAuth(token, updatedUser);
            setDisplayCardMasked(
              updatedUser.card_masked_pan ?? updatedUser.payment ?? "",
            );
            setDisplayCardType(updatedUser.card_type ?? "");
            setPaymentModalOpen(false);
            toast.success("Картку збережено ✓");
          }}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}

      <Footer />
    </>
  );
}
