# 🛠️ Come by Shop — Гайд для Backend Розробника

> Цей файл — єдине місце з усім що потрібно для реалізації бекенду.  
> Фронтенд **повністю готовий** і чекає на тебе. Просто реалізуй ендпоінти нижче.

---

## 📦 Що з себе являє проект

**Come by Shop** — це інтернет-магазин / кафе з доставкою. Є:

- Каталог товарів і меню
- Кошик і оформлення замовлень
- Особистий кабінет (профіль, адреса, телефон, картка)
- Адмін-панель (CRUD товарів)
- Авторизація через email+пароль і Google OAuth
- 2FA при вході з нового пристрою (через TurboSMS)
- Верифікація телефону через SMS OTP

**Стек фронтенду:** Next.js 15 (App Router, SSR), TypeScript, NextAuth.js v5, Zustand, TanStack Query

---

## 🌐 Як фронтенд спілкується з бекендом

```
NEXT_PUBLIC_API_URL=https://api.come-by-shop.com
```

Всі запити йдуть на цей BASE URL. Наприклад:

```
GET  https://api.come-by-shop.com/api/products
POST https://api.come-by-shop.com/api/auth/login
```

**Авторизація:** заголовок `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** завжди `application/json`  
**Формат помилки** — завжди такий:

```json
{ "error": "Текст помилки українською" }
```

---

## 🗄️ Схема бази даних

```sql
-- Користувачі
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,       -- bcrypt, НЕ plain text!
  name             VARCHAR(255),
  phone            VARCHAR(20),
  phone_verified   BOOLEAN DEFAULT false,
  address          TEXT,
  payment          VARCHAR(255),                -- legacy поле
  card_masked_pan  VARCHAR(20),                 -- "**** **** **** 5353" — тільки з WayForPay callback!
  card_type        VARCHAR(20),                 -- "Visa" / "MasterCard" — тільки з WayForPay callback!
  admin            BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Відомі пристрої (для 2FA)
CREATE TABLE user_devices (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id  VARCHAR(255) NOT NULL,             -- FingerprintJS visitorId
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- 2FA коди при логіні з нового пристрою
CREATE TABLE two_factor_codes (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  device_id     VARCHAR(255) NOT NULL,
  code          VARCHAR(6) NOT NULL,
  expires_at    TIMESTAMP NOT NULL,             -- NOW() + INTERVAL '10 minutes'
  attempts      INT DEFAULT 0
);

-- OTP коди для верифікації телефону
CREATE TABLE phone_otps (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone         VARCHAR(20) NOT NULL,
  code          VARCHAR(6) NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  attempts      INT DEFAULT 0,
  blocked_until TIMESTAMP
);

-- Запити на зміну email
CREATE TABLE pending_email_changes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  new_email  VARCHAR(255) NOT NULL,
  code       VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Токени для скидання пароля
CREATE TABLE password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) UNIQUE NOT NULL,     -- crypto.randomBytes(64).toString('hex')
  expires_at TIMESTAMP NOT NULL,               -- NOW() + INTERVAL '1 hour'
  used       BOOLEAN DEFAULT false
);

-- Товари
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  weight      VARCHAR(50),                     -- "250 мл", "350 г"
  price       DECIMAL(10, 2) NOT NULL,
  image       VARCHAR(500),                    -- Cloudinary URL
  image_name  VARCHAR(255),                    -- legacy, можна ігнорувати
  category    VARCHAR(100),                    -- "Напої", "Їжа", "Комбо", "Магазин"
  hidden      BOOLEAN DEFAULT false,           -- soft delete
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Замовлення
CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  status     VARCHAR(50) DEFAULT 'В обробці', -- "В обробці" / "Доставлено" / "Скасовано"
  total      DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Позиції замовлень (зберігаємо назву і ціну на момент замовлення!)
CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER,                        -- може бути NULL якщо товар видалено
  product_name VARCHAR(255) NOT NULL,          -- копія назви на момент замовлення
  quantity     INT NOT NULL CHECK (quantity > 0),
  price        DECIMAL(10, 2) NOT NULL         -- копія ціни на момент замовлення
);
```

---

## 🔐 Авторизація — як це працює

Фронтенд використовує **NextAuth.js v5**. Схема:

```
1. Юзер вводить email+пароль → фронтенд дзвонить POST /api/auth/login
2. Якщо deviceId невідомий → бекенд повертає { requires_2fa: true }
   Фронт відкриває TwoFactorModal і чекає підтвердження
3. Якщо deviceId відомий або 2FA пройдено → бекенд повертає { token, user }
4. NextAuth зберігає token в зашифрованій httpOnly cookie
5. Всі наступні захищені запити йдуть з заголовком Authorization: Bearer <token>
```

**FingerprintJS:** фронтенд генерує унікальний `deviceId` через `@fingerprintjs/fingerprintjs` і передає його при логіні. Бекенд перевіряє чи є цей `device_id` в таблиці `user_devices`.

**JWT токен** має містити мінімум: `{ sub: userId, exp: timestamp }`  
**TTL токена:** рекомендовано 30 днів (фронтенд налаштований на 30 × 24 × 60 × 60)

---

## 📋 Всі ендпоінти

---

### 🔐 АВТЕНТИФІКАЦІЯ

---

#### `POST /api/auth/register`

Реєстрація нового користувача.

**Що отримує бекенд:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Іван Петров"
}
```

**Що повертає при успіху `201`:**

```json
{ "success": true }
```

> ⚠️ Фронтенд після отримання `{ success: true }` автоматично викличе `POST /api/auth/login`. Токен тут не потрібен.

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Email і пароль обов'язкові" }` |
| `400` | `{ "error": "Пароль має бути не менше 6 символів" }` |
| `409` | `{ "error": "Користувач з таким email вже існує" }` |

**Логіка бекенду:**

```
1. Валідувати email формат (regex або бібліотека)
2. Перевірити унікальність email: SELECT id FROM users WHERE email = $1
3. Хешувати: bcrypt.hash(password, 12)
4. INSERT INTO users (email, password_hash, name)
5. Повернути { success: true }
```

---

#### `POST /api/auth/login`

Вхід користувача. Головний ендпоінт авторизації. Підтримує 2FA для нових пристроїв.

**Що отримує бекенд:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "abc123xyz"
}
```

> `deviceId` — генерується FingerprintJS на фронтенді. Може бути відсутнім якщо FingerprintJS не завантажився — у такому випадку вважати пристрій невідомим.

**Що повертає при успіху `200` (пристрій відомий):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "Іван Петров",
    "admin": false,
    "phone": "+380991234567",
    "phone_verified": true,
    "address": "м. Київ, вул. Хрещатик, 1",
    "payment": "card",
    "card_masked_pan": "**** **** **** 5353",
    "card_type": "Visa"
  }
}
```

**Що повертає при новому пристрої `200`:**

```json
{ "requires_2fa": true }
```

> Фронт відкриває `TwoFactorModal`. Бекенд при цьому відразу ж надсилає SMS з кодом на телефон юзера (або чекає на окремий виклик `/api/auth/2fa/send`).

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | `{ "error": "Невірний email або пароль" }` |

**Логіка бекенду:**

```
1. SELECT * FROM users WHERE email = $1
2. bcrypt.compare(password, user.password_hash)
3. Якщо не співпадає → 401
4. Якщо deviceId є → SELECT id FROM user_devices WHERE user_id=$1 AND device_id=$2
5. Якщо пристрій НЕ знайдено:
   → Повернути { requires_2fa: true }
   (опційно: відразу надіслати SMS — якщо не хочеш окремий /2fa/send)
6. Якщо пристрій відомий або deviceId відсутній:
   → Згенерувати JWT: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' })
   → Повернути { token, user }
```

---

#### `POST /api/auth/2fa/send`

Надіслати SMS з 2FA кодом на телефон юзера при логіні з нового пристрою.

**Що отримує бекенд:**

```json
{
  "email": "user@example.com",
  "deviceId": "abc123xyz"
}
```

**Що повертає при успіху `200`:**

```json
{ "ok": true }
```

**Помилки:**
| Код | Коли |
|-----|------|
| `404` | `{ "error": "Користувача не знайдено" }` |
| `400` | `{ "error": "Телефон не верифіковано" }` |
| `429` | `{ "error": "Забагато запитів" }` |

**Логіка бекенду:**

```
1. SELECT id, phone FROM users WHERE email = $1
2. Якщо phone відсутній або phone_verified = false → 400
3. Згенерувати 6-значний код
4. INSERT INTO two_factor_codes (user_id, device_id, code, expires_at)
   expires_at = NOW() + INTERVAL '10 minutes'
   ON CONFLICT (user_id) DO UPDATE SET ...
5. Надіслати SMS через TurboSMS:
   "Ваш код входу Come by Shop: 123456. Дійсний 10 хвилин."
6. Повернути { ok: true }
```

---

#### `POST /api/auth/2fa/verify`

Підтвердити 2FA код і завершити логін. Після успіху — пристрій запам'ятовується.

**Що отримує бекенд:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "deviceId": "abc123xyz"
}
```

**Що повертає при успіху `200`:**

```json
{
  "token": "eyJ...",
  "user": { ...такий самий об'єкт як у /login... }
}
```

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Невірний або застарілий код" }` |
| `429` | `{ "error": "Забагато спроб" }` |

**Логіка бекенду:**

```
1. SELECT * FROM two_factor_codes WHERE user_id = (SELECT id FROM users WHERE email=$1)
2. Перевірити expires_at > NOW()
3. crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code))
4. Якщо невірний → INCREMENT attempts, якщо >= 5 → 429
5. Якщо вірний:
   DELETE FROM two_factor_codes WHERE user_id = $1
   INSERT INTO user_devices (user_id, device_id) ON CONFLICT DO NOTHING
6. Згенерувати JWT → повернути { token, user }
```

---

#### `POST /api/auth/google`

Вхід або реєстрація через Google OAuth.

**Що отримує бекенд:**

```json
{
  "email": "user@gmail.com",
  "name": "Іван Петров",
  "image": "https://lh3.googleusercontent.com/..."
}
```

> ⚠️ Фронтенд НЕ передає Google `idToken` — тільки вже витягнуті поля профілю (NextAuth робить верифікацію на своєму боці).

**Що повертає при успіху `200`:**

```json
{
  "token": "eyJ...",
  "user": { ...такий самий об'єкт як у /login... }
}
```

**Логіка бекенду:**

```
1. SELECT * FROM users WHERE email = $1
2. Якщо юзер існує → оновити name/image якщо потрібно → генерувати JWT → повернути
3. Якщо не існує → INSERT INTO users (email, name, password_hash='') → генерувати JWT → повернути
   ⚠️ password_hash встановити як порожній рядок або рандомний хеш — Google юзери не мають пароля
```

---

#### `GET /api/auth/me` 🔒

Отримати поточного авторизованого юзера за токеном.

**Заголовок:** `Authorization: Bearer <token>`

**Що повертає при успіху `200`:** повний об'єкт UserInfo (такий самий як у login).

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | Токен невалідний або прострочений |

> **Де використовується:** `app/admin/page.tsx` — для перевірки прав адміна на сервері при кожному заході на `/admin`. Має бути швидким.

---

#### `PUT /api/auth/profile` 🔒

Оновлення профілю користувача.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{
  "name": "Нове ім'я",
  "address": "м. Київ, вул. Нова, 5"
}
```

> ⚠️ **НЕ оновлювати поле `phone` через цей ендпоінт!** Телефон змінюється тільки через `/api/auth/phone/verify-otp` після SMS підтвердження.

**Що повертає при успіху `200`:** повний об'єкт UserInfo.

---

#### `PUT /api/auth/password` 🔒

Зміна пароля.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{
  "oldPassword": "старий_пароль",
  "newPassword": "новий_пароль_мінімум_6_символів"
}
```

**Що повертає при успіху:** `204 No Content`

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Старий пароль невірний" }` |
| `401` | Неавторизований |

---

#### `POST /api/auth/reset-password`

Запит на скидання пароля (форма "Забули пароль?").

**Що отримує бекенд:**

```json
{ "email": "user@example.com" }
```

**Що повертає при успіху `200`:**

```json
{ "ok": true }
```

> ⚠️ **Завжди повертати `200`** навіть якщо email не знайдено — не можна розкривати які emails є в базі.

**Логіка бекенду:**

```
1. SELECT id FROM users WHERE email = $1
2. Якщо не знайдено → повернути { ok: true } без дій
3. Згенерувати токен: crypto.randomBytes(64).toString('hex')
4. INSERT INTO password_reset_tokens (user_id, token, expires_at)
   expires_at = NOW() + INTERVAL '1 hour'
5. Відправити email (Resend / SendGrid):
   Тема: "Скидання пароля Come by Shop"
   Посилання: "https://come-by-shop.com/reset-password?token=<TOKEN>"
6. Повернути { ok: true }
```

---

#### `POST /api/auth/reset-password/confirm`

Встановити новий пароль після переходу за посиланням з email.

**Що отримує бекенд:**

```json
{
  "token": "abc123hex...",
  "newPassword": "новий_пароль"
}
```

**Що повертає при успіху `200`:**

```json
{ "ok": true }
```

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Посилання застаріло або невалідне" }` |

---

### 📱 ВЕРИФІКАЦІЯ ТЕЛЕФОНУ

---

#### `POST /api/auth/phone/send-otp` 🔒

Надіслати SMS з кодом підтвердження на телефон.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{ "phone": "+380991234567" }
```

> Формат завжди `+380XXXXXXXXX`

**Що повертає при успіху `200`:**

```json
{ "success": true, "expiresIn": 120 }
```

> `expiresIn` — скільки секунд діє код. Фронтенд показує таймер на 120 секунд (2 хвилини).

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Невірний формат телефону" }` |
| `429` | `{ "error": "Забагато запитів. Спробуйте через 10 хвилин" }` |

**Логіка бекенду:**

```
1. Перевірити формат: /^\+380\d{9}$/.test(phone)
2. Rate-limit: максимум 3 запити за 10 хвилин для цього user_id
3. Згенерувати 6-значний код
4. INSERT INTO phone_otps (user_id, phone, code, expires_at)
   ON CONFLICT (user_id) DO UPDATE SET phone=..., code=..., expires_at=NOW() + INTERVAL '2 minutes', attempts=0
5. Відправити SMS через TurboSMS:
   "Ваш код підтвердження Come by Shop: 123456. Дійсний 2 хвилини."
6. Повернути { success: true, expiresIn: 120 }
```

**ENV потрібні:** `TURBOSMS_TOKEN`, `TURBOSMS_SENDER=ComeBySHOP`

---

#### `POST /api/auth/phone/verify-otp` 🔒

Підтвердити телефон за допомогою коду з SMS.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{
  "phone": "+380991234567",
  "code": "123456"
}
```

**Що повертає при успіху `200`:** повний об'єкт UserInfo з `phone_verified: true`

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Невірний або застарілий код" }` |
| `429` | `{ "error": "Забагато невдалих спроб. Заблоковано на 30 хвилин" }` |

**Логіка бекенду:**

```
1. SELECT * FROM phone_otps WHERE user_id = $1 AND phone = $2
2. Якщо не знайдено → 400
3. Якщо blocked_until > NOW() → 429
4. Перевірити expires_at > NOW()
5. crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code))
6. Якщо невірний → INCREMENT attempts, якщо >= 5 → SET blocked_until = NOW() + INTERVAL '30 minutes' → 429
7. Якщо вірний:
   DELETE FROM phone_otps WHERE user_id = $1
   UPDATE users SET phone=$2, phone_verified=true, updated_at=NOW() WHERE id=$1
8. SELECT * FROM users WHERE id=$1 → повернути UserInfo
```

---

### 📧 ЗМІНА EMAIL

---

#### `POST /api/auth/change-email/request` 🔒

Запит на зміну email — надіслати код підтвердження на новий email.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{ "newEmail": "newemail@example.com" }
```

**Що повертає при успіху `200`:**

```json
{ "ok": true }
```

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Цей email вже використовується" }` |

**Логіка бекенду:**

```
1. Перевірити унікальність: SELECT id FROM users WHERE email = $1
2. Згенерувати 6-значний код
3. INSERT INTO pending_email_changes (user_id, new_email, code, expires_at)
   expires_at = NOW() + INTERVAL '10 minutes'
   ON CONFLICT (user_id) DO UPDATE SET ...
4. Відправити email на newEmail:
   "Ваш код для зміни email: 123456. Дійсний 10 хвилин."
5. Повернути { ok: true }
```

---

#### `POST /api/auth/change-email/confirm` 🔒

Підтвердити зміну email кодом.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{
  "newEmail": "newemail@example.com",
  "code": "123456"
}
```

**Що повертає при успіху `200`:** повний об'єкт UserInfo з оновленим email.

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Немає активного запиту зміни email" }` |
| `400` | `{ "error": "Код застарів" }` |
| `400` | `{ "error": "Невірний код" }` |

---

### 💳 ОПЛАТА

---

#### `PUT /api/auth/payment` 🔒

Зберегти legacy поле payment (спосіб оплати).

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{ "payment": "card" }
```

> ⚠️ **Ніколи не приймати `card_masked_pan` або `card_type` від фронтенду!** Ці поля встановлюються ТІЛЬКИ через WayForPay callback.

**Що повертає при успіху `200`:** повний об'єкт UserInfo.

---

#### `POST /api/payment/wayforpay/init` 🔒

Ініціалізація сесії WayForPay для збереження картки.

**Заголовок:** `Authorization: Bearer <token>`

**Нічого не отримує** (порожнє тіло).

**Що повертає при успіху `200`:**

```json
{
  "wayforpay": {
    "merchantAccount": "come_by_shop",
    "merchantDomainName": "come-by-shop.com",
    "authorizationCode": "HMAC_MD5_ПІДПИС",
    "orderReference": "WFP_42_1715166000000",
    "orderDate": 1715166000,
    "amount": "1",
    "currency": "UAH",
    "productName": ["Верифікація картки"],
    "productCount": [1],
    "productPrice": ["1"],
    "serviceUrl": "https://api.come-by-shop.com/api/payment/wayforpay/callback",
    "returnUrl": "https://come-by-shop.com/account",
    "paymentSystems": "card"
  }
}
```

> 🔐 `authorizationCode` — це HMAC-MD5 підпис. Формується ТІЛЬКИ на бекенді з `WAYFORPAY_SECRET_KEY`. Ніколи не передавати секретний ключ на фронтенд!

---

#### `POST /api/payment/wayforpay/callback`

Webhook від WayForPay після успішного платежу. **Не потребує JWT** — захищається HMAC підписом від WayForPay.

**Логіка бекенду:**

```
1. Перевірити merchantSignature (HMAC-MD5 від WayForPay)
2. Якщо transactionStatus === 'Approved':
   Витягти userId з orderReference (формат: WFP_<userId>_<timestamp>)
   UPDATE users SET
     card_masked_pan = formatMaskedPan(cardPan),  -- "4111 **** **** 1111"
     card_type = cardType,
     payment = 'card',
     updated_at = NOW()
   WHERE id = userId
3. Повернути підписану відповідь WayForPay
```

---

### 🛍️ ТОВАРИ

---

#### `GET /api/products`

Отримати список товарів.

**Query параметри (опціонально):**

```
?category=Напої    — фільтр по категорії
?hidden=false      — за замовчуванням не повертати приховані
```

**Що повертає `200`:**

```json
[
  {
    "id": 1,
    "name": "Кава Americano",
    "description": "Класична чорна кава",
    "weight": "250 мл",
    "price": 65,
    "image": "https://res.cloudinary.com/dk9yjgta3/image/upload/...",
    "imageName": "coffee_americano",
    "category": "Напої",
    "hidden": false
  }
]
```

> Рекомендовано: кешування відповіді на 60 секунд (Redis або in-memory)

---

#### `GET /api/products/:id`

Отримати один товар за ID.

**Помилки:**
| Код | Коли |
|-----|------|
| `404` | `{ "error": "Товар не знайдено" }` |

---

#### `GET /api/categories`

Отримати список доступних категорій.

**Що повертає `200`:**

```json
["Напої", "Їжа", "Комбо", "Магазин"]
```

> Кешування на 5 хвилин (рідко змінюється)

---

#### `POST /api/products` 🔒 👑

Створити новий товар (тільки admin).

**Заголовок:** `Authorization: Bearer <admin_token>`

**Що отримує бекенд:**

```json
{
  "name": "Латте",
  "description": "Кава з молоком",
  "weight": "300 мл",
  "price": 75,
  "category": "Напої",
  "image": "https://res.cloudinary.com/dk9yjgta3/image/upload/q_auto/f_auto/latte.png",
  "imageName": "latte"
}
```

> Зображення завантажується фронтом через `/api/upload` на Cloudinary — бекенд отримує готовий URL.

**Що повертає при успіху `201`:** створений об'єкт Product з полем `id`.

---

#### `PUT /api/products/:id` 🔒 👑

Повністю оновити товар (тільки admin).

**Що повертає при успіху `200`:** оновлений об'єкт Product.

---

#### `PATCH /api/products/:id` 🔒 👑

Приховати або показати товар (soft delete).

**Що отримує бекенд:**

```json
{ "hidden": true }
```

**Що повертає при успіху `200`:** оновлений об'єкт Product.

---

#### `DELETE /api/products/:id` 🔒 👑

Видалити товар назавжди.

**Що повертає при успіху:** `204 No Content`

> ⚠️ Рекомендовано використовувати `PATCH { hidden: true }` — щоб зберегти назви/ціни в старих замовленнях.

---

### 📦 ЗАМОВЛЕННЯ

---

#### `GET /api/orders` 🔒

Отримати всі замовлення поточного користувача.

**Заголовок:** `Authorization: Bearer <token>`

**Що повертає `200`:**

```json
[
  {
    "id": 101,
    "createdAt": "2024-05-08T10:30:00Z",
    "status": "В обробці",
    "total": 195,
    "items": [
      {
        "productId": 1,
        "productName": "Кава Americano",
        "quantity": 2,
        "price": 65
      }
    ]
  }
]
```

---

#### `POST /api/orders` 🔒

Створити нове замовлення.

**Заголовок:** `Authorization: Bearer <token>`

**Що отримує бекенд:**

```json
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ]
}
```

**Що повертає при успіху `201`:** повний об'єкт замовлення.

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Замовлення порожнє" }` |
| `400` | `{ "error": "Товар з id=5 не знайдено" }` |

> ⚠️ Ціни беруться з БД, НЕ від фронтенду — захист від маніпуляцій!  
> ⚠️ Обов'язково в транзакції (BEGIN/COMMIT) — щоб не було часткових замовлень.

---

## 🔑 Зведена таблиця ендпоінтів

| Метод | Ендпоінт                   | Auth | Admin | Опис                  |
| ----- | -------------------------- | :--: | :---: | --------------------- |
| POST  | `/api/auth/register`       |      |       | Реєстрація            |
| POST  | `/api/auth/login`          |      |       | Логін (з 2FA логікою) |
| POST  | `/api/auth/2fa/send`       |      |       | Надіслати 2FA SMS     |
| POST  | `/api/auth/2fa/verify`     |      |       | Підтвердити 2FA       |
| POST  | `/api/auth/google`         |      |       | Google OAuth          |
| GET   | `/api/auth/me`             |  🔒  |       | Поточний юзер         |
| PUT   | `/api/auth/profile`        |  🔒  |       | Оновити профіль       |
| PUT   | `/api/auth/password`       |  🔒  |       | Змінити пароль        |
| POST  | `/api/auth/reset-password` |      |       | Запит скидання пароля |

POST /api/auth/password-change/request — перевіряє старий пароль, надсилає SMS
POST /api/auth/password-change/confirm — перевіряє OTP, зберігає новий пароль
| POST | `/api/auth/reset-password/confirm` | | | Підтвердити скидання |
| POST | `/api/auth/phone/send-otp` | 🔒 | | Надіслати SMS код |
| POST | `/api/auth/phone/verify-otp` | 🔒 | | Верифікувати телефон |
| POST | `/api/auth/change-email/request` | 🔒 | | Запит зміни email |
| POST | `/api/auth/change-email/confirm` | 🔒 | | Підтвердити зміну email |
| PUT | `/api/auth/payment` | 🔒 | | Оновити спосіб оплати |
| POST | `/api/payment/wayforpay/init` | 🔒 | | Ініціалізація WayForPay |
| POST | `/api/payment/wayforpay/callback` | — | | Webhook від WayForPay |
| GET | `/api/products` | | | Список товарів |
| GET | `/api/products/:id` | | | Один товар |
| POST | `/api/products` | 🔒 | 👑 | Створити товар |
| PUT | `/api/products/:id` | 🔒 | 👑 | Оновити товар |
| PATCH | `/api/products/:id` | 🔒 | 👑 | Приховати/показати товар |
| DELETE | `/api/products/:id` | 🔒 | 👑 | Видалити товар |
| GET | `/api/categories` | | | Список категорій |
| GET | `/api/orders` | 🔒 | | Мої замовлення |
| POST | `/api/orders` | 🔒 | | Створити замовлення |

🔒 — потрібен `Authorization: Bearer <token>`  
👑 — тільки для користувачів з `admin: true`

---

## 🌍 Зовнішні сервіси

### TurboSMS (SMS для OTP і 2FA)

```
Сайт: https://turbosms.ua
API:  POST https://api.turbosms.ua/message/send
Headers: { Authorization: "Bearer <TURBOSMS_TOKEN>" }
Body: {
  "recipients": ["+380991234567"],
  "sms": {
    "sender": "ComeBySHOP",
    "text": "Ваш код: 123456"
  }
}
ENV:  TURBOSMS_TOKEN=...
      TURBOSMS_SENDER=ComeBySHOP
```

Використовується в: `POST /api/auth/phone/send-otp`, `POST /api/auth/2fa/send`

### WayForPay (платежі і збереження картки)

```
Сайт: https://wayforpay.com
ENV:  WAYFORPAY_MERCHANT_ACCOUNT=...
      WAYFORPAY_SECRET_KEY=...
      WAYFORPAY_DOMAIN=come-by-shop.com
```

Використовується в: `POST /api/payment/wayforpay/init` та callback

### Email провайдер (скидання пароля, зміна email)

```
Рекомендовано: Resend (resend.com) або SendGrid
ENV:  EMAIL_PROVIDER_API_KEY=...
      EMAIL_FROM_ADDRESS=noreply@come-by-shop.com
```

Використовується в: `POST /api/auth/reset-password`, `POST /api/auth/change-email/request`

### Cloudinary (зображення товарів)

```
Фронтенд завантажує зображення через Next.js API route /api/upload напряму на Cloudinary.
Бекенд отримує вже готовий URL у полі image при POST/PUT /api/products.
Cloud name: dk9yjgta3
```

---

## 🔧 Environment Variables

```env
# ─── База даних ───────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/come_by_shop

# ─── JWT ──────────────────────────────────────────────────
JWT_SECRET=мінімум_32_символи_рандомний_рядок

# ─── CORS ─────────────────────────────────────────────────
ALLOWED_ORIGIN=https://come-by-shop.com

# ─── TurboSMS ─────────────────────────────────────────────
TURBOSMS_TOKEN=
TURBOSMS_SENDER=ComeBySHOP

# ─── WayForPay ────────────────────────────────────────────
WAYFORPAY_MERCHANT_ACCOUNT=
WAYFORPAY_SECRET_KEY=
WAYFORPAY_DOMAIN=come-by-shop.com

# ─── Email ────────────────────────────────────────────────
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=noreply@come-by-shop.com
```

---

## 🛡️ Безпека — обов'язковий чекліст

```
Паролі
  ✅ bcrypt з salt rounds = 12 (НЕ MD5, НЕ SHA1, НЕ plain text!)
  ✅ Мінімальна довжина пароля: 6 символів

JWT Токени
  ✅ Підписувати з JWT_SECRET (мінімум 32 символи, рандомний)
  ✅ TTL: 30 днів

OTP коди (телефон, email, 2FA)
  ✅ Порівнювати через crypto.timingSafeEqual() — захист від timing attacks
  ✅ Один раз використання — видаляти після успішної верифікації
  ✅ TTL: 2 хв для SMS OTP, 10 хв для 2FA, 10 хв для email

Rate Limiting
  ✅ POST /api/auth/login: 10 спроб / хв на IP
  ✅ POST /api/auth/2fa/send: 3 запити / 10 хв на user_id
  ✅ POST /api/auth/2fa/verify: 5 спроб → заблокувати
  ✅ POST /api/auth/phone/send-otp: 3 запити / 10 хв на user_id
  ✅ POST /api/auth/phone/verify-otp: 5 спроб → блок на 30 хв
  ✅ POST /api/auth/reset-password: 3 запити / 15 хв на IP

CORS
  ✅ Дозволити тільки https://come-by-shop.com (не *)
  ✅ Credentials: true

SQL Ін'єкції
  ✅ Завжди parameterized queries ($1, $2, ...) — ніколи string concatenation

Картки
  ✅ card_masked_pan і card_type — тільки з верифікованого WayForPay callback
  ✅ Перевіряти HMAC підпис від WayForPay перед записом в БД
  ✅ Ніколи не логувати повні номери карток

Транзакції
  ✅ POST /api/orders — обов'язково в транзакції (BEGIN/COMMIT)
  ✅ Ціни в замовленнях беруться з БД, не від фронтенду
```

---

## ✅ Порядок реалізації (рекомендований)

```
  □ POST /api/auth/register
  □ POST /api/auth/login  (без 2FA спочатку)
  □ GET  /api/auth/me
  □ POST /api/auth/google
  □ GET  /api/products
  □ GET  /api/categories
  □ POST /api/products    (admin)
  □ PUT  /api/products/:id (admin)
  □ PATCH /api/products/:id (admin)
  □ DELETE /api/products/:id (admin)
  □ PUT  /api/auth/profile
  □ PUT  /api/auth/password
  □ GET  /api/orders
  □ POST /api/orders
  □ POST /api/auth/phone/send-otp     (TurboSMS)
  □ POST /api/auth/phone/verify-otp
  □ POST /api/auth/2fa/send           (TurboSMS)
  □ POST /api/auth/2fa/verify
  □ Додати deviceId логіку в POST /api/auth/login
  □ POST /api/auth/reset-password     (Email)
  □ POST /api/auth/reset-password/confirm
  □ POST /api/auth/change-email/request  (Email)
  □ POST /api/auth/change-email/confirm
  □ PUT  /api/auth/payment
  □ POST /api/payment/wayforpay/init  (WayForPay)
  □ POST /api/payment/wayforpay/callback
```

---

## ⚠️ Критичні контракти для фронтенду

**`POST /api/auth/login`** — відповідь має бути точно `{ token, user }` або `{ requires_2fa: true }`. Фронт зберігає token в Zustand persist і передає в кожен захищений запит.

**`GET /api/auth/me`** — блокує рендер `/admin` сторінки. Має повертати `UserInfo` з полем `admin: boolean`. Має бути швидким.

**Нормалізовані помилки** — завжди `{ "error": "текст" }`. Фронт парсить саме цей формат у `lib/api.ts`. Якщо формат інший — весь error handling зламається.

**`GET /api/products`** — фронт очікує масив навіть якщо він порожній (`[]`), ніколи не `null`.

**`POST /api/orders`** — ціни НЕ приймати від фронтенду. Тільки `productId` і `quantity`.

**CORS** — дозволити тільки домен фронту. Не `*`.
