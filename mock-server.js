import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const MOCK_TOKEN = "mock-jwt-token-123";

const users = [
  {
    id: 1,
    email: "test@test.com",
    password: "123456",
    name: "Тест Користувач",
    phone: "+380501234567",
    address: "м. Київ, вул. Хрещатик, 1",
    payment: "Visa •••• 4242",
    admin: false,
  },
];

const products = [
  {
    id: 1,
    name: "Піца Маргарита",
    description: "Класична піца з томатним соусом та моцарелою",
    weight: "400г",
    price: 189,
    image: "/images/goods/pizza.png",
    category: "Піца",
  },
  {
    id: 2,
    name: 'Суші сет "Токіо"',
    description: "24 роли з лососем, тунцем та авокадо",
    weight: "600г",
    price: 349,
    image: "/images/goods/sushi.webp",
    category: "Суші",
  },
  {
    id: 3,
    name: 'Котяче рагу "Неко"',
    description: "Фірмова страва шефа з овочами та спеціями",
    weight: "350г",
    price: 215,
    image: "/images/goods/neko-ark.png",
    category: "Гаряче",
  },
  {
    id: 4,
    name: "Піца Пепероні",
    description: "Гостра піца з пепероні, томатним соусом та сиром",
    weight: "420г",
    price: 219,
    image: "/images/goods/pizza.png",
    category: "Піца",
  },
  {
    id: 5,
    name: 'Суші сет "Осака"',
    description: "18 ролів з креветками, вугрем та огірком",
    weight: "480г",
    price: 289,
    image: "/images/goods/sushi.webp",
    category: "Суші",
  },
  {
    id: 6,
    name: "Піца Гавайська",
    description: "Ніжна піца з шинкою, ананасом та моцарелою",
    weight: "410г",
    price: 199,
    image: "/images/goods/pizza.png",
    category: "Піца",
  },
  {
    id: 7,
    name: 'Суші сет "Кіото"',
    description: "30 ролів асорті з різними видами риби та овочів",
    weight: "750г",
    price: 429,
    image: "/images/goods/sushi.webp",
    category: "Суші",
  },
  {
    id: 8,
    name: "Куряче рагу з грибами",
    description: "Соковита куряча грудка з печерицями та вершковим соусом",
    weight: "380г",
    price: 235,
    image: "/images/goods/neko-ark.png",
    category: "Гаряче",
  },
  {
    id: 9,
    name: "Піца Чотири сири",
    description:
      "Вишукана піца з моцарелою, пармезаном, горгонзолою та чеддером",
    weight: "400г",
    price: 245,
    image: "/images/goods/pizza.png",
    category: "Піца",
  },
  {
    id: 10,
    name: 'Суші сет "Саппоро"',
    description: "12 ролів з тунцем та соусом спайсі",
    weight: "360г",
    price: 259,
    image: "/images/goods/sushi.webp",
    category: "Суші",
  },
  {
    id: 11,
    name: "Овочеве рагу з тофу",
    description: "Легка страва з сезонних овочів та тофу в соусі теріякі",
    weight: "340г",
    price: 185,
    image: "/images/goods/neko-ark.png",
    category: "Гаряче",
  },
  {
    id: 12,
    name: "Піца Барбекю",
    description: "Димна піца з куркою, беконом та соусом барбекю",
    weight: "430г",
    price: 229,
    image: "/images/goods/pizza.png",
    category: "Піца",
  },
  {
    id: 13,
    name: 'Суші сет "Фуджі"',
    description: "36 ролів преміум з трюфельним соусом та ікрою",
    weight: "900г",
    price: 549,
    image: "/images/goods/sushi.webp",
    category: "Суші",
  },
];

const orders = [
  {
    id: 101,
    createdAt: "2025-03-10T14:32:00Z",
    status: "Доставлено",
    items: [
      { productId: 1, productName: "Піца Маргарита", quantity: 2, price: 189 },
      {
        productId: 2,
        productName: 'Суші сет "Токіо"',
        quantity: 1,
        price: 349,
      },
    ],
    total: 727,
  },
  {
    id: 102,
    createdAt: "2025-03-22T18:05:00Z",
    status: "В обробці",
    items: [
      {
        productId: 3,
        productName: 'Котяче рагу "Неко"',
        quantity: 1,
        price: 215,
      },
    ],
    total: 215,
  },
];

function getCurrentUser(req) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (token !== MOCK_TOKEN) return null;
  return users[0];
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user)
    return res.status(401).json({ error: "Невірний email або пароль" });
  const { password: _, ...safeUser } = user;
  res.json({ token: MOCK_TOKEN, user: safeUser });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return res.status(400).json({ error: "Email та пароль обовʼязкові" });
  if (users.find((u) => u.email === email)) {
    return res
      .status(409)
      .json({ error: "Користувач з таким email вже існує" });
  }
  const newUser = {
    id: users.length + 1,
    email,
    password,
    name: "",
    phone: "",
    address: "",
    payment: "",
    admin: false,
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token: MOCK_TOKEN, user: safeUser });
});

// POST /api/auth/google
app.post("/api/auth/google", (req, res) => {
  const { password: _, ...safeUser } = users[0];
  res.json({ token: MOCK_TOKEN, user: safeUser });
});

app.put("/api/auth/profile", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизовано" });
  const allowed = ["name", "email", "phone", "address"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.put("/api/auth/password", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизовано" });
  const { oldPassword, newPassword } = req.body ?? {};
  if (user.password !== oldPassword) {
    return res.status(400).json({ error: "Старий пароль невірний" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Новий пароль має бути не менше 6 символів" });
  }
  user.password = newPassword;
  res.status(204).end();
});

app.put("/api/auth/payment", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизовано" });
  user.payment = req.body.payment ?? "";
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.get("/api/products", (_req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Товар не знайдено" });
  res.json(product);
});

app.post("/api/products", (req, res) => {
  const user = getCurrentUser(req);
  if (!user?.admin)
    return res.status(403).json({ error: "Тільки для адміністраторів" });
  const newProduct = { id: products.length + 1, ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const user = getCurrentUser(req);
  if (!user?.admin)
    return res.status(403).json({ error: "Тільки для адміністраторів" });
  const idx = products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Товар не знайдено" });
  products[idx] = { ...products[idx], ...req.body };
  res.json(products[idx]);
});

app.delete("/api/products/:id", (req, res) => {
  const user = getCurrentUser(req);
  if (!user?.admin)
    return res.status(403).json({ error: "Тільки для адміністраторів" });
  const idx = products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Товар не знайдено" });
  products.splice(idx, 1);
  res.status(204).end();
});

app.get("/api/orders", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизовано" });
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизовано" });
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Кошик порожній" });
  }
  const newOrder = {
    id: orders.length + 101,
    createdAt: new Date().toISOString(),
    status: "В обробці",
    items: items.map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return {
        productId: i.productId,
        productName: product?.name ?? `Товар #${i.productId}`,
        quantity: i.quantity,
        price: product?.price ?? 0,
      };
    }),
    total: items.reduce((sum, i) => {
      const product = products.find((p) => p.id === i.productId);
      return sum + (product?.price ?? 0) * i.quantity;
    }, 0),
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`✅ Mock-сервер запущено: http://localhost:${PORT}`);
  console.log(`   Тестовий акаунт: test@test.com / 123456`);
  console.log(`   Токен: ${MOCK_TOKEN}`);
});
