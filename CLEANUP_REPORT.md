## ✅ Звіт про видалення Mock Backend

**Дата:** 8 травня 2026  
**Проект:** Come by Shop - Latest SSR

---

## 🗑️ Видалено

### Папки та файли:

- ✅ **`app/api/`** — вся папка з mock endpoints
  - `auth/` — всі auth маршрути
  - `orders/route.ts` — замовлення
  - `products/` — товари
- ✅ **`lib/mockDb.ts`** — in-memory база даних
- ✅ **`lib/pendingEmailChanges.ts`** — зберігання тимчасових email змін

### Файли оновлені:

- ✅ **`auth.ts`** — замінено mock auth на реальні API запити
  - Credentials provider тепер викликає `/api/auth/login`
  - Google provider викликає `/api/auth/google`
- ✅ **`app/page.tsx`** — видалено mock DB fallback
- ✅ **`app/shop/page.tsx`** — видалено mock DB fallback
- ✅ **`app/menu/page.tsx`** — видалено mock DB fallback
- ✅ **`app/combo/page.tsx`** — видалено mock DB fallback
- ✅ **`app/admin/page.tsx`** — видалено mock DB fallback

---

## 📋 Наступні кроки для бекенд розробника

### 1️⃣ Реалізувати ці endpoints на реальному backend'і:

Див. **`BACKEND_API_GUIDE.md`** для повної документації. Основні endpoint'и:

```
🔐 AUTHENTICATION
  POST   /api/auth/register           — реєстрація користувача
  POST   /api/auth/login              — вхід (поверне JWT token)
  POST   /api/auth/google             — вхід через Google
  PUT    /api/auth/profile            — оновлення профілю
  PUT    /api/auth/password           — зміна пароля

📱 PHONE VERIFICATION
  POST   /api/auth/phone/send-otp     — відправити OTP на SMS
  POST   /api/auth/phone/verify-otp   — підтвердити телефон кодом

📧 EMAIL CHANGE
  POST   /api/auth/change-email/request  — запит на зміну email
  POST   /api/auth/change-email/confirm  — підтвердити зміну email

💳 PAYMENT
  PUT    /api/auth/payment            — зберегти дані платежу

🛍️  PRODUCTS
  GET    /api/products                — список всіх товарів
  GET    /api/products/:id            — один товар
  POST   /api/products                — створити (admin)
  PUT    /api/products/:id            — оновити (admin)
  PATCH  /api/products/:id            — прихований/видимий (admin)
  DELETE /api/products/:id            — видалити (admin)

📦 ORDERS
  GET    /api/orders                  — замовлення користувача
  POST   /api/orders                  — створити замовлення
```

### 2️⃣ Налаштування環境 переменних

Додайте в `.env.local`:

```env
# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3000  # Змініть на реальний URL в продакшн

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (якщо будете використовувати)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# SMS (TurboSMS для OTP)
TURBOSMS_TOKEN=your_turbosms_token
TURBOSMS_SENDER=ComeBySHOP

# Email service (для зміни email)
# (SendGrid/Resend/Mailgun на ваш вибір)
```

### 3️⃣ Security Best Practices

Див. `BACKEND_API_GUIDE.md` - розділ **🛡️ Security Checklist**

Найважливіше:

- ✅ Хешувати паролі bcrypt (salt ≥ 12)
- ✅ Генерувати JWT токени з коротким TTL
- ✅ Rate-limiting для auth endpoints
- ✅ Використовувати `crypto.timingSafeEqual()` для OTP порівняння
- ✅ Никогда не логувати full credit card details
- ✅ SQL Injection prevention (parameterized queries)

### 4️⃣ Database Schema

Див. `BACKEND_API_GUIDE.md` - розділ **📊 Database Schema (Reference)**

Основні таблиці:

- `users` — користувачі
- `phone_otps` — OTP коди для телефонів **(окрема таблиця!)**
- `pending_email_changes` — тимчасові запити на зміну email
- `products` — товари
- `orders` — замовлення
- `order_items` — товари в замовленні

### 5️⃣ Тестування

Після реалізації endpoints:

```bash
# Регістрація
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Логін
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Отримати товари
curl http://localhost:3000/api/products

# Отримати замовлення (потрібен token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/orders
```

---

## 📊 Архітектура Flow

```
┌─────────────────┐
│  Frontend SSR   │
│  (Next.js 15)   │
└────────┬────────┘
         │ HTTP запити з JWT токеном
         │
         ▼
┌──────────────────────────────┐
│  Real Backend (Node/Python)  │
│  Endpoints: /api/*           │
│  Database: PostgreSQL/MySQL  │
└──────────────────────────────┘
```

---

## 🔗 Integration Points

### Frontend очікує:

1. **JWT токени** в Header: `Authorization: Bearer {token}`
2. **Consistent JSON responses:**
   ```json
   { "error": "message" }
   { "token": "...", "user": {...} }
   ```
3. **HTTP Status codes:**
   - `200` — успіх
   - `201` — створено
   - `204` — успіх без контенту
   - `400` — невірні дані
   - `401` — unauthorized
   - `404` — не знайдено
   - `409` — конфлікт (email вже існує)
   - `429` — rate limit

### CORS налаштування:

Backend має дозволити запити з фронтенд domain:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📚 Документація

- **BACKEND_API_GUIDE.md** — повна документація всіх endpoints
- **package.json** — залежності (没有mock backend залежностей)
- **auth.ts** — конфігурація NextAuth (оновлено для реального backend)

---

## ❓ Питання для бекенд розробника?

Якщо потрібна додаткова інформація:

1. Запитайте деталі конкретного endpoint'у в `BACKEND_API_GUIDE.md`
2. Всі коментарі `TODO [BACKEND]:` в гайді показують точні дії
3. SQL schema готовий для копіювання
4. All security best practices задокументовані

---

## 🎉 Готово!

Mock backend повністю видалено. Фронтенд готовий до підключення реального backend'у.

**Коли backend розробник закінчить:**

1. Скопіюйте реальний API URL в `NEXT_PUBLIC_API_URL`
2. Запустіть `npm run dev`
3. Перевірте всі endpoint'и

---

**Next.js 15 + TypeScript готові до production!** 🚀
