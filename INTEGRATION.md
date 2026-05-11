# Інтеграція — Come by Shop Security & UX Update

## Нові залежності

```bash
npm install @fingerprintjs/fingerprintjs react-countdown
```

---

## Файли та куди класти

### Zustand стор (Завдання 4)

```
store/verificationStore.ts   →   store/verificationStore.ts
```

Імпортуй у PhoneVerifyModal і TwoFactorModal (вже підключено).

---

### Хук (Завдання 2)

```
hooks/useFingerprint.ts   →   hooks/useFingerprint.ts
```

Використовується тільки в `app/login/page.tsx`.

---

### Схеми валідації

```
lib/schemas.ts   →   lib/schemas.ts   (замінює існуючий)
```

Додано `phoneSchema` і `otpSchema`.

---

### UI компоненти

```
components/ui/OtpInput.tsx      →   components/ui/OtpInput.tsx
components/ui/MaskedPhone.tsx   →   components/ui/MaskedPhone.tsx
components/ui/PhoneField.tsx    →   components/ui/PhoneField.tsx
```

#### Як використовувати PhoneField в акаунті:

```tsx
// app/account/page.tsx або components/AccountProfile.tsx
import PhoneField from "@/components/ui/PhoneField";
import { useAuthStore } from "@/store/authStore";

const { user, token, updateUser } = useAuthStore();

<PhoneField
  phone={user?.phone}
  token={token!}
  onSuccess={(updatedUser) => updateUser(updatedUser)}
/>;
```

---

### Базова модалка (Завдання 3 — drag bug fix)

```
components/modals/BaseModal.tsx   →   components/modals/BaseModal.tsx
```

Замінює `onClick={(e) => e.target === e.currentTarget && onClose()}` у всіх модалках.

**Дві поведінки:**

- `disableOutsideClick` — для форм з введенням (PhoneVerify, ChangeEmail, ConfirmPassword, TwoFactor)
- без проп — закриває по кліку на overlay (LoginRequired, OrderSuccess, ForgotPassword)

---

### Оновлені модалки (Завдання 3 — всі через BaseModal)

```
components/modals/PhoneVerifyModal.tsx      →   замінює існуючий
components/modals/TwoFactorModal.tsx        →   НОВИЙ файл
components/modals/ChangeEmailModal.tsx      →   замінює існуючий
components/modals/ConfirmPasswordModal.tsx  →   замінює існуючий
components/modals/ForgotPasswordModal.tsx   →   замінює існуючий
components/modals/LoginRequiredModal.tsx    →   замінює існуючий
components/modals/OrderSuccessModal.tsx     →   замінює існуючий
```

---

### Сторінка логіну (Завдання 2)

```
app/login/page.tsx   →   замінює існуючий
```

---

## Що потрібно від бекенд-дева

### 2FA при логіні (Завдання 2)

`POST /api/auth/login` приймає додаткове поле:

```json
{ "email": "...", "password": "...", "deviceId": "abc123" }
```

Якщо пристрій невідомий → відповідь:

```json
{ "requires_2fa": true }
```

Тоді фронт відкриває `TwoFactorModal`.

Нові ендпоінти:

```
POST /api/auth/2fa/send    { email, deviceId }  → { ok: true }
POST /api/auth/2fa/verify  { email, code, deviceId }  → { token }
```

### Верифікація телефону

```
POST /api/phone/send-otp    { phone: "+380XXXXXXXXX", token }  → { ok: true }
POST /api/phone/verify-otp  { phone, code, token }  → { ok: true, user: UserInfo }
```

OTP TTL: 120 секунд (або конфігурується).

---

## Швидка перевірка після інтеграції

- [ ] Логін з невідомого пристрою → відкривається TwoFactorModal
- [ ] Закрити TwoFactorModal → перезайти → кнопка "Продовжити підтвердження" з'являється
- [ ] Зміна телефону → отримати OTP → закрити модалку → відкрити знову → крок OTP (не починати спочатку)
- [ ] Виділяти текст в полі і відпустити мишку на overlay → модалка НЕ закривається
- [ ] У всіх модалках є хрестик у правому верхньому куті
- [ ] Таймер 60с → кнопка disabled → після 0 → кнопка активна → клік → таймер скидається
- [ ] Поточний телефон у профілі відображається як +380 ** \*** \*\* XX
