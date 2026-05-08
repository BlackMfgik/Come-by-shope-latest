## 📋 API Endpoints Documentation

### Come by Shop - Backend Integration Guide

---

## 🔐 **Authentication Endpoints**

### 1. **POST `/api/auth/register`**

**Реєстрація нового користувача**

- **Request:**

  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe" // optional
  }
  ```

- **Response (201):**

  ```json
  { "success": true }
  ```

- **Errors:**
  - `400` - "Email і пароль обов'язкові" або "Пароль має бути не менше 6 символів"
  - `409` - "Користувач з таким email вже існує"

- **Backend TODO:**
  - ✅ Валідувати email формат і унікальність
  - ✅ Хешувати пароль: `bcrypt.hash(password, 12)`
  - ✅ INSERT INTO users таблицю
  - ✅ Повернути `{ success: true }` — фронтенд автоматично викличе `signIn()`

---

### 2. **POST `/api/auth/login`**

**Вхід користувача**

- **Request:**

  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Response (200):**

  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "admin": false,
      "phone": "+380000000000",
      "phone_verified": true,
      "address": "вул. Приклад, 1",
      "payment": "card_last_4_digits",
      "card_masked_pan": "**** **** **** 5353",
      "card_type": "Visa"
    }
  }
  ```

- **Errors:**
  - `401` - "Невірний email або пароль"

- **Backend TODO:**
  - ✅ SELECT \* FROM users WHERE email = $1
  - ✅ bcrypt.compare(password, password_hash)
  - ✅ Генерувати JWT токен з user.id (залежність від вашого auth config)
  - ✅ Токен має використовуватись в Header: `Authorization: Bearer {token}`

---

### 3. **PUT `/api/auth/profile`**

**Оновлення профілю користувача**

- **Headers:** `Authorization: Bearer {token}` (обов'язково)

- **Request:**

  ```json
  {
    "name": "John Updated",
    "email": "newemail@example.com",
    "address": "вул. Нова, 5"
  }
  ```

- **Response (200):** Повертає оновлений юзер (як у login)

- **⚠️ ВАЖЛИВО:**
  - ❌ **НЕ дозволяти оновлювати `phone` через цей endpoint!**
  - 📱 Телефон оновлюється виключно через `/api/auth/phone/verify-otp` після SMS підтвердження

---

### 4. **PUT `/api/auth/password`**

**Зміна пароля**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "oldPassword": "старий_пароль",
    "newPassword": "новий_пароль"
  }
  ```

- **Response (204):** No content

- **Errors:**
  - `401` - "Unauthorized"
  - `400` - "Старий пароль невірний"

- **Backend TODO:**
  - ✅ bcrypt.compare(oldPassword, user.password_hash)
  - ✅ bcrypt.hash(newPassword, 12) та UPDATE БД
  - ⚠️ Логування спроб для безпеки

---

## 📱 **Phone Verification Endpoints**

### 5. **POST `/api/auth/phone/send-otp`**

**Відправити SMS код підтвердження**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "phone": "+380991234567"
  }
  ```

- **Response (200):**

  ```json
  {
    "success": true,
    "expiresIn": 300 // 5 хвилин в секундах
  }
  ```

- **Errors:**
  - `400` - "Невірний формат телефону"
  - `429` - "Забагато запитів" (rate-limit)

- **Backend TODO (CRITICAL):**
  - ✅ **Підключити TurboSMS** (https://turbosms.ua)
  - ✅ Валідувати формат телефону (+380XXXXXXXXX)
  - ✅ Згенерувати 6-значний код: `Math.floor(100000 + Math.random() * 900000)`
  - ✅ Зберегти в **ОКРЕМІЙ таблиці** `phone_otps`:
    ```sql
    INSERT INTO phone_otps (user_id, phone, code, expires_at)
    VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
    ON CONFLICT (user_id) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '5 minutes'
    ```
  - ✅ Відправити SMS:
    ```bash
    POST https://api.turbosms.ua/message/send
    Headers: { Authorization: "Bearer {TURBOSMS_TOKEN}" }
    Body: {
      "recipients": ["+380991234567"],
      "sms": {
        "sender": "ComeBySHOP",
        "text": "Ваш код підтвердження Come by Shop: 123456. Дійсний 5 хвилин."
      }
    }
    ```
  - ✅ Rate-limit: **не більше 3 запитів за 10 хвилин** на один телефон
  - ✅ ENV variables потрібні:
    ```
    TURBOSMS_TOKEN=your_token_here
    TURBOSMS_SENDER=ComeBySHOP
    ```

---

### 6. **POST `/api/auth/phone/verify-otp`**

**Підтвердити телефон через OTP код**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "phone": "+380991234567",
    "code": "123456"
  }
  ```

- **Response (200):** Повертає оновлений юзер з `phone_verified: true`

- **Errors:**
  - `400` - "Невірний або застарілий код"
  - `429` - "Забагато спроб" (5+ невдалих спроб = блокування на 30 хв)

- **Backend TODO:**
  - ✅ SELECT FROM phone_otps WHERE user_id = $1 AND phone = $2
  - ✅ Перевірити:
    - Запис існує
    - `expires_at > NOW()`
    - Код співпадає (використовувати `crypto.timingSafeEqual()` для безпеки!)
  - ✅ Лічильник спроб: якщо > 5 → заблокувати на 30 хв
  - ✅ **Видалити OTP запис** (one-time use):
    ```sql
    DELETE FROM phone_otps WHERE user_id = $1
    ```
  - ✅ Оновити користувача:
    ```sql
    UPDATE users SET phone = $1, phone_verified = true WHERE id = $2
    ```

---

## 📧 **Email Change Endpoints**

### 7. **POST `/api/auth/change-email/request`**

**Запит на зміну email**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "newEmail": "newemail@example.com"
  }
  ```

- **Response (200):**

  ```json
  { "ok": true }
  ```

- **Errors:**
  - `400` - "Цей email вже використовується"

- **Backend TODO:**
  - ✅ Перевірити унікальність нового email
  - ✅ Згенерувати 6-значний код
  - ✅ Зберегти в таблиці `pending_email_changes` з TTL 10 хвилин
  - ✅ Відправити email з кодом (за допомогою SendGrid/Resend/Mailgun):
    ```
    Ваш код для зміни email: 123456
    Дійсний 10 хвилин
    ```
  - ✅ Логування для аудиту

---

### 8. **POST `/api/auth/change-email/confirm`**

**Підтвердити зміну email**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "newEmail": "newemail@example.com",
    "code": "123456"
  }
  ```

- **Response (200):** Повертає оновлений юзер з новим email

- **Errors:**
  - `400` - "Немає активного запиту зміни email"
  - `400` - "Код застарів"
  - `400` - "Невірний код"

- **Backend TODO:**
  - ✅ Знайти запис в `pending_email_changes` за user_id
  - ✅ Перевірити TTL та код
  - ✅ Оновити email в таблиці `users`
  - ✅ Видалити запис з `pending_email_changes`

---

## 💳 **Payment Endpoints**

### 9. **PUT `/api/auth/payment`**

**Зберегти дані платежу**

- **Headers:** `Authorization: Bearer {token}`

- **Request (для legacy):**

  ```json
  {
    "payment": "card_data_or_method"
  }
  ```

- **Response (200):** Повертає оновлений юзер

- **⚠️ ВАЖЛИВО - Security Best Practices:**
  - ❌ **НЕ приймати `card_masked_pan` або `card_type` напряму від фронтенду!**
  - 💳 Ці поля повинні встановлюватись **виключно через WayForPay callback** (`/api/payment/wayforpay/callback`)
  - 🔐 Никогда не зберігати full credit card details - лише masked PAN
  - ✅ Валідувати дані платежу

- **Backend TODO:**
  - ✅ Приймати тільки `payment` поле
  - ✅ Блокувати пряме оновлення `card_masked_pan` та `card_type`
  - ✅ Реалізувати WayForPay интеграцію для отримання платіжних даних

---

## 🛍️ **Product Endpoints**

### 10. **GET `/api/products`**

**Отримати список всіх товарів**

- **Query params (optional):**

  ```
  ?category=Напої&hidden=false
  ```

- **Response (200):**

  ```json
  [
    {
      "id": 1,
      "name": "Кава Americano",
      "description": "Класична чорна кава",
      "weight": "250 мл",
      "price": 65,
      "image": "https://res.cloudinary.com/...",
      "imageName": "coffee_americano",
      "category": "Напої"
    }
  ]
  ```

- **Backend TODO:**
  - ✅ SELECT \* FROM products WHERE hidden = false (за замовчуванням)
  - ✅ Підтримувати фільтрацію по категорії
  - ✅ Кешування на 5-10 хвилин для оптимізації

---

### 11. **GET `/api/products/:id`**

**Отримати товар за ID**

- **Response (200):** Один товар (див. формат вище)

- **Errors:**
  - `404` - "Not found"

---

### 12. **POST `/api/products`** ⚙️ **(Admin only)**

**Створити новий товар**

- **Headers:**
  - `Authorization: Bearer {admin_token}`

- **Request:**

  ```json
  {
    "name": "Нова кава",
    "description": "Опис товару",
    "weight": "350 мл",
    "price": 85,
    "category": "Напої",
    "imageUrl": "https://res.cloudinary.com/.../image.png",
    "imageName": "coffee_name" // legacy, мож не передавати
  }
  ```

- **Response (201):** Новостворений товар

- **Errors:**
  - `401` - "Unauthorized" (не админ)

- **Backend TODO:**
  - ✅ Перевірити права адміністратора
  - ✅ Валідувати вхідні дані
  - ✅ INSERT INTO products
  - ✅ Валідувати URL зображення (Cloudinary)

---

### 13. **PUT `/api/products/:id`** ⚙️ **(Admin only)**

**Повністю оновити товар**

- **Headers:** `Authorization: Bearer {admin_token}`

- **Request:** Ті ж поля, що й при створенні

- **Response (200):** Оновлений товар

---

### 14. **PATCH `/api/products/:id`** ⚙️ **(Admin only)**

**Частково оновити товар (приховати/показати)**

- **Headers:** `Authorization: Bearer {admin_token}`

- **Request:**

  ```json
  {
    "hidden": true // чи false
  }
  ```

- **Response (200):** Оновлений товар

- **Backend TODO:**
  - ✅ Підтримувати поле `hidden` для м'якого видалення
  - ✅ GET /api/products повинен фільтрувати `hidden = false` за замовчуванням

---

### 15. **DELETE `/api/products/:id`** ⚙️ **(Admin only)**

**Видалити товар**

- **Headers:** `Authorization: Bearer {admin_token}`

- **Response (204):** No content

- **⚠️ Consideration:**
  - Краще використовувати PATCH з `hidden: true` для м'якого видалення
  - Це дозволить зберегти дані в замовленнях

---

## 📦 **Order Endpoints**

### 16. **GET `/api/orders`**

**Отримати всі замовлення користувача**

- **Headers:** `Authorization: Bearer {token}`

- **Response (200):**

  ```json
  [
    {
      "id": 1,
      "userId": 5,
      "createdAt": "2024-05-08T10:30:00Z",
      "status": "В обробці",
      "items": [
        {
          "productId": 1,
          "productName": "Кава Americano",
          "quantity": 2,
          "price": 65
        }
      ],
      "total": 130
    }
  ]
  ```

- **Notes:**
  - Сортування: найновіші спочатку
  - Тільки замовлення поточного користувача

---

### 17. **POST `/api/orders`**

**Створити нове замовлення**

- **Headers:** `Authorization: Bearer {token}`

- **Request:**

  ```json
  {
    "items": [
      {
        "productId": 1,
        "quantity": 2
      },
      {
        "productId": 3,
        "quantity": 1
      }
    ]
  }
  ```

- **Response (201):**

  ```json
  {
    "id": 123,
    "userId": 5,
    "createdAt": "2024-05-08T10:30:00Z",
    "status": "В обробці",
    "items": [...],
    "total": 200
  }
  ```

- **Errors:**
  - `400` - "Замовлення порожнє"
  - `401` - "Unauthorized"

- **Backend TODO:**
  - ✅ Валідувати що кожен productId існує
  - ✅ Отримати актуальні ціни з таблиці products
  - ✅ Розрахувати total
  - ✅ INSERT INTO orders та order_items
  - ✅ Отримати inventory statuses і перевірити наявність
  - ✅ Відправити email-підтвердження користувачу
  - ✅ Інтеграція з WayForPay для оплати (якщо потрібно)

---

## 🔑 **NextAuth Integration**

### **GET/POST `/api/auth/[...nextauth]`**

Це вибудована конфігурація NextAuth.js для управління сесіями.

- **Провайдери:**
  - `credentials` (email/password через `/api/auth/login`)
  - Можна додати Google, GitHub тощо

- **Backend TODO:**
  - ✅ Налаштувати NEXTAUTH_SECRET в .env.local
  - ✅ Встановити NEXTAUTH_URL (production URL)
  - ✅ Реалізувати callback для отримання user + token з бази

---

## 🛡️ **Security Checklist for Backend Developer**

- [ ] **Passwords:** Хешувати bcrypt з salt ≥ 12
- [ ] **Tokens:** JWT з коротким TTL (15 хв) + refresh tokens
- [ ] **Rate-limiting:** IP-based + user-based для auth endpoints
- [ ] **CORS:** Налаштувати для HTTPS тільки
- [ ] **Email validation:** Перевірити format перед збереженням
- [ ] **Phone validation:** +380XXXXXXXXX формат
- [ ] **OTP:** `crypto.timingSafeEqual()` для порівняння
- [ ] **Card data:** Никогда не логувати full PAN, лише masked
- [ ] **SQL Injection:** Використовувати parameterized queries
- [ ] **Input validation:** На кожному endpoint'і
- [ ] **Logging:** Логувати всі спроби auth, видалення товарів, зміни платежів
- [ ] **Transactions:** Замовлення та платежі мають бути atomic

---

## 📊 **Database Schema (Reference)**

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  address TEXT,
  payment VARCHAR(255),
  card_masked_pan VARCHAR(20), -- "**** **** **** 5353"
  card_type VARCHAR(20), -- "Visa", "MasterCard"
  admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Phone OTPs (separate table!)
CREATE TABLE phone_otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  blocked_until TIMESTAMP
);

-- Pending Email Changes
CREATE TABLE pending_email_changes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  new_email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500), -- Cloudinary URL
  image_name VARCHAR(255),
  category VARCHAR(100),
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50), -- "В обробці", "Доставлено", "Скасовано"
  total DECIMAL(10, 2) NOT NULL
);

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER,
  product_name VARCHAR(255),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);
```

---

## 🚀 **Frontend Expectations**

Фронтенд передбачає:

1. **JWT токен** в `Authorization` Header: `Bearer {token}`
2. **Consistency:** Одні й ті ж поля в response як зазначено вище
3. **Error format:**
   ```json
   { "error": "Error message" }
   ```
4. **Status codes:** 200, 201, 204, 400, 401, 404, 409, 429
5. **CORS headers** для cross-origin запитів
6. **Rate limiting** для auth endpoints

---

## 📝 **Deployment Checklist**

- [ ] Усі TODO зі статусом ✅ реалізовані
- [ ] ENV variables встановлені (TURBOSMS_TOKEN, NEXTAUTH_SECRET, тощо)
- [ ] Тести написані для всіх endpoints
- [ ] Database міграції готові
- [ ] HTTPS налаштований
- [ ] Логування налаштовано
- [ ] Backups налаштовані
- [ ] Monitoring/alerting активовані

---

**Contact:** Якщо у розробника є питання по конкретному endpoint'у, див. коментарі в коді або цей документ.
