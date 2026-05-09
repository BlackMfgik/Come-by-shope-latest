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

**Стек фронтенду:** Next.js 14 (App Router, SSR), TypeScript, NextAuth.js, Zustand, TanStack Query

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

Фронтенд використовує **NextAuth.js**. Схема:

```
1. Юзер вводить email+пароль → фронтенд дзвонить POST /api/auth/login
2. Бекенд перевіряє → повертає { token, user }
3. NextAuth зберігає token в зашифрованій httpOnly cookie
4. Всі наступні захищені запити йдуть з заголовком Authorization: Bearer <token>
```

**JWT токен** має містити мінімум: `{ sub: userId, exp: timestamp }`  
**TTL токена:** рекомендовано 30 днів (фронтенд налаштований на 30 _ 24 _ 60 \* 60)

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

Вхід користувача. Головний ендпоінт авторизації.

**Що отримує бекенд:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Що повертає при успіху `200`:**

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

> 📌 Поля `card_masked_pan` і `card_type` можуть бути `null` якщо картка не додана.

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | `{ "error": "Невірний email або пароль" }` |

**Логіка бекенду:**

```
1. SELECT * FROM users WHERE email = $1
2. bcrypt.compare(password, user.password_hash)
3. Якщо не співпадає → 401
4. Згенерувати JWT: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' })
5. Повернути { token, user }
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

**Що повертає при успіху `200`:**

```json
{
  "id": 42,
  "email": "user@example.com",
  "name": "Іван Петров",
  "admin": false,
  ...решта полів UserInfo...
}
```

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | Токен невалідний або прострочений |

**Де використовується:** `app/admin/page.tsx` — для перевірки прав адміна на сервері при кожному заході на `/admin`.

**Логіка бекенду:**

```
1. Розкодувати JWT: jwt.verify(token, JWT_SECRET) → отримати userId
2. SELECT * FROM users WHERE id = $1
3. Повернути UserInfo
```

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

**Що повертає при успіху `200`:** повний об'єкт UserInfo (такий самий як у login).

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | Неавторизований |

**Логіка бекенду:**

```
1. Отримати userId з JWT
2. Дозволені поля для оновлення: name, address (НЕ phone, НЕ email, НЕ admin)
3. UPDATE users SET name=$1, address=$2, updated_at=NOW() WHERE id=$3
4. SELECT * FROM users WHERE id=$3 → повернути UserInfo
```

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

**Що повертає при успіху:** `204 No Content` (порожня відповідь)

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Старий пароль невірний" }` |
| `401` | Неавторизований |

**Логіка бекенду:**

```
1. Отримати userId з JWT
2. SELECT password_hash FROM users WHERE id = $1
3. bcrypt.compare(oldPassword, password_hash)
4. Якщо не співпадає → 400
5. bcrypt.hash(newPassword, 12)
6. UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2
7. Повернути 204
```

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
5. Відправити email (SendGrid / Resend / Mailgun):
   Тема: "Скидання пароля Come by Shop"
   Текст: "Перейдіть за посиланням для скидання пароля:
           https://come-by-shop.com/reset-password?token=<TOKEN>
           Посилання дійсне 1 годину."
6. Повернути { ok: true }
```

**ENV потрібні:** `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`

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

**Логіка бекенду:**

```
1. SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false
2. Перевірити expires_at > NOW()
3. bcrypt.hash(newPassword, 12)
4. UPDATE users SET password_hash=$1 WHERE id = reset_token.user_id
5. UPDATE password_reset_tokens SET used = true WHERE id = $1
6. Повернути { ok: true }
```

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
{ "success": true, "expiresIn": 300 }
```

> `expiresIn` — скільки секунд діє код (фронтенд показує таймер)

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Невірний формат телефону" }` |
| `429` | `{ "error": "Забагато запитів. Спробуйте через 10 хвилин" }` |

**Логіка бекенду:**

```
1. Перевірити формат: /^\+380\d{9}$/.test(phone)
2. Rate-limit: максимум 3 запити за 10 хвилин для цього user_id
   SELECT attempts FROM phone_otps WHERE user_id = $1 → якщо > 3 → 429
3. Згенерувати 6-значний код: Math.floor(100000 + Math.random() * 900000).toString()
4. Зберегти або оновити:
   INSERT INTO phone_otps (user_id, phone, code, expires_at)
   VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
   ON CONFLICT (user_id) DO UPDATE SET
     phone=EXCLUDED.phone, code=EXCLUDED.code,
     expires_at=EXCLUDED.expires_at, attempts=0
5. Відправити SMS через TurboSMS API:
   POST https://api.turbosms.ua/message/send
   Headers: { Authorization: "Bearer <TURBOSMS_TOKEN>" }
   Body: {
     "recipients": ["+380991234567"],
     "sms": {
       "sender": "<TURBOSMS_SENDER>",
       "text": "Ваш код підтвердження Come by Shop: 123456. Дійсний 5 хвилин."
     }
   }
6. Повернути { success: true, expiresIn: 300 }
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
4. Перевірити expires_at > NOW() → якщо прострочено → 400
5. Перевірити код (ОБОВ'ЯЗКОВО через безпечне порівняння):
   crypto.timingSafeEqual(Buffer.from(otp.code), Buffer.from(code))
6. Якщо невірний → INCREMENT attempts, якщо attempts >= 5 → SET blocked_until = NOW() + INTERVAL '30 minutes' → 429
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
   Тема: "Підтвердження зміни email — Come by Shop"
   Текст: "Ваш код для зміни email: 123456. Дійсний 10 хвилин."
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

**Логіка бекенду:**

```
1. SELECT * FROM pending_email_changes WHERE user_id = $1 AND new_email = $2
2. Перевірити expires_at > NOW()
3. Перевірити code === otp.code
4. UPDATE users SET email=$1, updated_at=NOW() WHERE id=$2
5. DELETE FROM pending_email_changes WHERE user_id = $1
6. SELECT * FROM users WHERE id=$2 → повернути UserInfo
```

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
    "orderReference": "ORDER_20240508_123456",
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

**Логіка бекенду:**

```
1. Отримати userId з JWT
2. Згенерувати унікальний orderReference (наприклад: `WFP_${userId}_${Date.now()}`)
3. Сформувати рядок для підпису:
   merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
4. HMAC-MD5 підпис: crypto.createHmac('md5', WAYFORPAY_SECRET_KEY).update(signString).digest('hex')
5. Повернути всі поля для JS-форми WayForPay
```

**ENV потрібні:** `WAYFORPAY_MERCHANT_ACCOUNT`, `WAYFORPAY_SECRET_KEY`, `WAYFORPAY_DOMAIN`

---

#### `POST /api/payment/wayforpay/callback`

Webhook від WayForPay після успішного платежу. **Не потребує JWT** — захищається HMAC підписом від WayForPay.

**Що отримує бекенд** (від WayForPay, не від фронтенду):

```json
{
  "merchantAccount": "come_by_shop",
  "orderReference": "WFP_42_1715166000000",
  "transactionStatus": "Approved",
  "cardPan": "411111****1111",
  "cardType": "Visa",
  "recToken": "...",
  "merchantSignature": "HMAC_MD5_від_WayForPay"
}
```

**Що повертає бекенд WayForPay** `200`:

```json
{
  "orderReference": "WFP_42_1715166000000",
  "status": "accept",
  "time": 1715166000,
  "signature": "HMAC_MD5_підпис_бекенду"
}
```

**Логіка бекенду:**

```
1. Перевірити merchantSignature (HMAC-MD5 від WayForPay)
2. Якщо transactionStatus === 'Approved':
   Витягти userId з orderReference
   UPDATE users SET
     card_masked_pan = formatMaskedPan(cardPan),  -- "4111 **** **** 1111"
     card_type = cardType,                          -- "Visa"
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
?hidden=false      — за замовчуванням не повертати приховані (hidden=false)
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

**Логіка бекенду:**

```sql
SELECT id, name, description, weight, price, image, image_name as "imageName", category, hidden
FROM products
WHERE hidden = false
  AND ($1::text IS NULL OR category = $1)
ORDER BY id ASC
```

> Рекомендовано: кешування відповіді на 60 секунд (Redis або in-memory)

---

#### `GET /api/products/:id`

Отримати один товар за ID.

**Що повертає `200`:** один об'єкт Product (такий самий формат як вище).

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

**Логіка бекенду:**

```sql
SELECT DISTINCT category FROM products
WHERE hidden = false AND category IS NOT NULL
ORDER BY category ASC
```

> Кешування на 5 хвилин (рідко змінюється)

---

#### `POST /api/products` 🔒 👑 (тільки admin)

Створити новий товар.

**Заголовок:** `Authorization: Bearer <admin_token>`

**Що отримує бекенд:**

```json
{
  "name": "Латте",
  "description": "Кава з молоком",
  "weight": "300 мл",
  "price": 75,
  "category": "Напої",
  "image": "https://res.cloudinary.com/.../latte.png",
  "imageName": "latte"
}
```

**Що повертає при успіху `201`:** створений об'єкт Product з полем `id`.

**Помилки:**
| Код | Коли |
|-----|------|
| `401` | Неавторизований або не адмін |
| `400` | Не передано обов'язкові поля (`name`, `price`) |

**Логіка бекенду:**

```
1. Перевірити user.admin === true (отримати з JWT)
2. Валідувати: name і price обов'язкові
3. INSERT INTO products (...) RETURNING *
4. Повернути 201 + новий товар
```

---

#### `PUT /api/products/:id` 🔒 👑 (тільки admin)

Повністю оновити товар.

**Заголовок:** `Authorization: Bearer <admin_token>`

**Що отримує бекенд:** ті ж поля що й при створенні (всі).

**Що повертає при успіху `200`:** оновлений об'єкт Product.

---

#### `PATCH /api/products/:id` 🔒 👑 (тільки admin)

Частково оновити товар (приховати або показати).

**Заголовок:** `Authorization: Bearer <admin_token>`

**Що отримує бекенд:**

```json
{ "hidden": true }
```

або

```json
{ "hidden": false }
```

**Що повертає при успіху `200`:** оновлений об'єкт Product.

> Це "м'яке видалення" — товар не видаляється з БД, лише ховається від покупців. Зберігає цілісність старих замовлень.

---

#### `DELETE /api/products/:id` 🔒 👑 (тільки admin)

Видалити товар назавжди.

**Заголовок:** `Authorization: Bearer <admin_token>`

**Що повертає при успіху:** `204 No Content`

> ⚠️ Рекомендовано використовувати `PATCH { hidden: true }` замість DELETE — щоб зберегти назви/ціни в старих замовленнях.

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
      },
      {
        "productId": 3,
        "productName": "Круасан",
        "quantity": 1,
        "price": 65
      }
    ]
  }
]
```

**Логіка бекенду:**

```sql
SELECT
  o.id,
  o.created_at as "createdAt",
  o.status,
  o.total,
  json_agg(json_build_object(
    'productId', oi.product_id,
    'productName', oi.product_name,
    'quantity', oi.quantity,
    'price', oi.price
  )) as items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC
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

**Що повертає при успіху `201`:** повний об'єкт замовлення (такий самий формат як у GET /api/orders).

**Помилки:**
| Код | Коли |
|-----|------|
| `400` | `{ "error": "Замовлення порожнє" }` |
| `400` | `{ "error": "Товар з id=5 не знайдено" }` |
| `401` | Неавторизований |

**Логіка бекенду (в транзакції!):**

```
BEGIN TRANSACTION
1. Перевірити items.length > 0
2. Для кожного item: SELECT id, price, name FROM products WHERE id=$1 AND hidden=false
3. Розрахувати total = sum(product.price * item.quantity)
4. INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'В обробці') RETURNING id
5. INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
   VALUES ... (декілька рядків)
COMMIT
6. Повернути 201 + повний об'єкт замовлення
```

> ⚠️ Ціни беруться з БД, НЕ від фронтенду — захист від маніпуляцій з цінами!  
> ⚠️ Використовувати транзакцію — щоб не було часткових замовлень при помилці.

---

## 🔑 Зведена таблиця ендпоінтів

| Метод  | Ендпоінт                           | Auth | Admin | Опис                    |
| ------ | ---------------------------------- | :--: | :---: | ----------------------- |
| POST   | `/api/auth/register`               |      |       | Реєстрація              |
| POST   | `/api/auth/login`                  |      |       | Логін                   |
| POST   | `/api/auth/google`                 |      |       | Google OAuth            |
| GET    | `/api/auth/me`                     |  🔒  |       | Поточний юзер           |
| PUT    | `/api/auth/profile`                |  🔒  |       | Оновити профіль         |
| PUT    | `/api/auth/password`               |  🔒  |       | Змінити пароль          |
| POST   | `/api/auth/reset-password`         |      |       | Запит скидання пароля   |
| POST   | `/api/auth/reset-password/confirm` |      |       | Підтвердити скидання    |
| POST   | `/api/auth/phone/send-otp`         |  🔒  |       | Надіслати SMS код       |
| POST   | `/api/auth/phone/verify-otp`       |  🔒  |       | Верифікувати телефон    |
| POST   | `/api/auth/change-email/request`   |  🔒  |       | Запит зміни email       |
| POST   | `/api/auth/change-email/confirm`   |  🔒  |       | Підтвердити зміну email |
| PUT    | `/api/auth/payment`                |  🔒  |       | Оновити спосіб оплати   |
| POST   | `/api/payment/wayforpay/init`      |  🔒  |       | Ініціалізація WayForPay |
| POST   | `/api/payment/wayforpay/callback`  |  —   |       | Webhook від WayForPay   |
| GET    | `/api/products`                    |      |       | Список товарів          |
| GET    | `/api/products/:id`                |      |       | Один товар              |
| POST   | `/api/products`                    |  🔒  |  👑   | Створити товар          |
| PUT    | `/api/products/:id`                |  🔒  |  👑   | Оновити товар           |
| PATCH  | `/api/products/:id`                |  🔒  |  👑   | Приховати/показати      |
| DELETE | `/api/products/:id`                |  🔒  |  👑   | Видалити товар          |
| GET    | `/api/categories`                  |      |       | Список категорій        |
| GET    | `/api/orders`                      |  🔒  |       | Мої замовлення          |
| POST   | `/api/orders`                      |  🔒  |       | Створити замовлення     |

🔒 — потрібен `Authorization: Bearer <token>`  
👑 — тільки для користувачів з `admin: true`

---

## 🌍 Зовнішні сервіси

### TurboSMS (SMS для OTP)

```
Сайт: https://turbosms.ua
API:  POST https://api.turbosms.ua/message/send
ENV:  TURBOSMS_TOKEN=...
      TURBOSMS_SENDER=ComeBySHOP
```

Використовується в: `POST /api/auth/phone/send-otp`

### WayForPay (платежі)

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
Фронтенд сам завантажує зображення через Next.js API route /api/upload
Бекенд отримує вже готовий Cloudinary URL в полі image при POST/PUT /api/products
```

---

## 🔧 Environment Variables

```env
# ─── База даних ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/come_by_shop

# ─── JWT ─────────────────────────────────────────────────
JWT_SECRET=мінімум_32_символи_рандомний_рядок

# ─── CORS ────────────────────────────────────────────────
ALLOWED_ORIGIN=https://come-by-shop.com

# ─── TurboSMS ────────────────────────────────────────────
TURBOSMS_TOKEN=
TURBOSMS_SENDER=ComeBySHOP

# ─── WayForPay ───────────────────────────────────────────
WAYFORPAY_MERCHANT_ACCOUNT=
WAYFORPAY_SECRET_KEY=
WAYFORPAY_DOMAIN=come-by-shop.com

# ─── Email ───────────────────────────────────────────────
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=noreply@come-by-shop.com
```

---

## 🛡️ Безпека — обов'язковий чекліст

```
Паролі
  ✅ bcrypt з salt rounds = 12 (НЕ MD5, НЕ SHA1, НЕ plain text!)
  ✅ Мінімальна довжина пароля: 6 символів (перевіряється і на фронті, і на бекенді)

JWT Токени
  ✅ Підписувати з JWT_SECRET (мінімум 32 символи, рандомний)
  ✅ TTL: 30 днів (або менше якщо хочеш + refresh tokens)

OTP коди
  ✅ Порівнювати через crypto.timingSafeEqual() — захист від timing attacks
  ✅ Один раз використання — видаляти після успішної верифікації
  ✅ TTL: 5 хвилин для SMS, 10 хвилин для email

Rate Limiting
  ✅ POST /api/auth/phone/send-otp: 3 запити / 10 хв на user_id
  ✅ POST /api/auth/phone/verify-otp: 5 спроб → блок на 30 хв
  ✅ POST /api/auth/reset-password: 3 запити / 15 хв на IP
  ✅ POST /api/auth/login: 10 спроб / хв на IP (захист від brute force)

CORS
  ✅ Дозволити тільки https://come-by-shop.com (не *)
  ✅ Credentials: true (для cookie)

SQL Ін'єкції
  ✅ Завжди parameterized queries ($1, $2, ...) — ніколи string concatenation

Картки
  ✅ Ніколи не логувати повні номери карток
  ✅ card_masked_pan і card_type — тільки з верифікованого WayForPay callback
  ✅ Перевіряти HMAC підпис від WayForPay перед записом в БД

Транзакції
  ✅ POST /api/orders — обов'язково в транзакції (BEGIN/COMMIT)
  ✅ Ціни в замовленнях беруться з БД, не від фронтенду
```

---

## ✅ Порядок реалізації (рекомендований)

```
Тиждень 1 — Базовий auth і продукти:
  □ POST /api/auth/register
  □ POST /api/auth/login
  □ GET  /api/auth/me
  □ GET  /api/products
  □ POST /api/products (admin)
  □ PUT  /api/products/:id (admin)
  □ PATCH /api/products/:id (admin)
  □ DELETE /api/products/:id (admin)
  □ GET  /api/categories

Тиждень 2 — Профіль і замовлення:
  □ PUT /api/auth/profile
  □ PUT /api/auth/password
  □ GET /api/orders
  □ POST /api/orders
  □ POST /api/auth/google

Тиждень 3 — Зовнішні сервіси:
  □ POST /api/auth/phone/send-otp     (TurboSMS)
  □ POST /api/auth/phone/verify-otp
  □ POST /api/auth/reset-password     (Email)
  □ POST /api/auth/reset-password/confirm
  □ POST /api/auth/change-email/request  (Email)
  □ POST /api/auth/change-email/confirm
  □ PUT  /api/auth/payment
  □ POST /api/payment/wayforpay/init  (WayForPay)
  □ POST /api/payment/wayforpay/callback
```

API контракти які критичні для фронту:
POST /api/auth/login і POST /api/auth/google — відповідь має бути точно { token: string, user: UserInfo }. Фронт зберігає token в Zustand persist і передає в кожен захищений запит як Authorization: Bearer.
GET /api/auth/me — цей ендпоінт блокує рендер /admin сторінки. Він має бути швидким (не робити важких запитів). Повертати UserInfo з полем admin: boolean.
Змінні середовища:
Додати API_URL (приватна) окремо від NEXT_PUBLIC_API_URL. Фронт буде використовувати приватну для Server Components.
Нормалізовані помилки:
Завжди { "error": "текст помилки" } — фронт вже парсить саме цей формат у lib/api.ts. Якщо формат інший — весь error handling зламається.
Rate limiting:
Обов'язково на POST /api/auth/login — мінімум 5 спроб / хвилину по IP. Фронт не має захисту від брутфорсу.
WayForPay:
authorizationCode (HMAC-MD5 підпис) — формується тільки на бекенді, приватним ключем мерчанта. Фронт лише отримує готовий об'єкт і POST-ить на WayForPay. Це вже закоментовано в types/index.ts.
CORS:
Дозволити тільки домен фронту. Не \*.
httpOnly cookie token:
Бекенд має встановлювати його при логіні. Фронт читає його в Server Components через cookies() з next/headers — це вже реалізовано в app/admin/page.tsx.
