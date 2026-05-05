export interface DBUser {
  id: number;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  /** true якщо телефон підтверджено через SMS OTP */
  phone_verified?: boolean;
  /**
   * TODO [BACKEND]: зберігати OTP в окремій таблиці з TTL, не в user
   * Тут — лише для мок-режиму
   */
  phone_otp?: string;
  phone_otp_expires?: number; // Unix timestamp ms
  address?: string;
  payment?: string;
  /** Маска картки — "**** **** **** 5353" */
  card_masked_pan?: string;
  /** "Visa" | "MasterCard" | "Maestro" */
  card_type?: string;
  admin: boolean;
}

export interface DBProduct {
  id: number;
  name: string;
  description?: string;
  weight?: string;
  price: number;
  image?: string;
  imageName?: string;
  category?: string;
}

export interface DBOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface DBOrder {
  id: number;
  userId: number;
  createdAt: string;
  status: string;
  items: DBOrderItem[];
  total: number;
}

const CATEGORIES = [
  "Напої",
  "Снеки",
  "Кондитерські",
  "Свіже",
  "Заморожене",
  "Соуси",
  "Меню",
  "Комбо",
];

function seedProducts(): DBProduct[] {
  const items: DBProduct[] = [
    {
      id: 1,
      name: "Кава Americano",
      description: "Класична чорна кава",
      weight: "250 мл",
      price: 65,
      category: "Напої",
    },
    {
      id: 2,
      name: "Капучіно",
      description: "Кава з молочною піною",
      weight: "300 мл",
      price: 79,
      category: "Напої",
    },
    {
      id: 3,
      name: "Лате",
      description: "Ніжний кавовий напій",
      weight: "350 мл",
      price: 85,
      category: "Напої",
    },
    {
      id: 4,
      name: "Фраппе шоколадний",
      description: "Холодний шоколадний напій зі збитими вершками",
      weight: "400 мл",
      price: 99,
      category: "Напої",
    },
    {
      id: 5,
      name: "Смузі Полуниця-Банан",
      description: "Свіжий фруктовий смузі",
      weight: "300 мл",
      price: 89,
      category: "Напої",
    },
    {
      id: 21,
      name: "Сендвіч BLT",
      description: "Бекон, салат, томат на тостовому хлібі",
      weight: "220 г",
      price: 119,
      category: "Снеки",
    },
    {
      id: 41,
      name: "Тірамісу класичний",
      description: "Маскарпоне, савоярді, кава",
      weight: "120 г",
      price: 89,
      category: "Кондитерські",
    },
    {
      id: 61,
      name: "Салат Цезар з куркою",
      description: "Ромен, гриль-курка, пармезан, сухарики",
      weight: "280 г",
      price: 145,
      category: "Свіже",
    },
    {
      id: 81,
      name: "Морозиво Ваніль",
      description: "Класичне вершкове морозиво",
      weight: "90 г",
      price: 49,
      category: "Заморожене",
    },
    {
      id: 91,
      name: "Цезар соус авторський",
      description: "Домашній соус Цезар",
      weight: "80 г",
      price: 35,
      category: "Соуси",
    },
    {
      id: 121,
      name: "Піца Маргарита",
      description: "Томатний соус, моцарела, свіжий базилік",
      weight: "400 г",
      price: 189,
      category: "Меню",
    },
    {
      id: 131,
      name: "Комбо Сімейний",
      description: "2 піци + 4 напої + 2 десерти",
      weight: "2.4 кг",
      price: 549,
      category: "Комбо",
    },
  ];
  return items;
}

class MockDatabase {
  users: DBUser[] = [
    {
      id: 1,
      email: "admin@comeby.ua",
      password: "admin123",
      name: "Адмін Come by",
      phone: "+380991234567",
      phone_verified: true,
      address: "вул. Хрещатик 1, Київ",
      payment: "Visa **** 4242",
      card_masked_pan: "**** **** **** 4242",
      card_type: "Visa",
      admin: true,
    },
    {
      id: 2,
      email: "user@comeby.ua",
      password: "user123",
      name: "Тестовий Користувач",
      phone: "+380501234567",
      phone_verified: false,
      address: "вул. Лесі Українки 10, Київ",
      payment: "Mastercard **** 5353",
      card_masked_pan: "**** **** **** 5353",
      card_type: "MasterCard",
      admin: false,
    },
  ];

  products: DBProduct[] = seedProducts();

  orders: DBOrder[] = [
    {
      id: 1,
      userId: 2,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: "Доставлено",
      items: [
        { productId: 1, productName: "Кава Americano", quantity: 2, price: 65 },
        {
          productId: 41,
          productName: "Круасан масляний",
          quantity: 1,
          price: 55,
        },
      ],
      total: 185,
    },
    {
      id: 2,
      userId: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: "В обробці",
      items: [
        {
          productId: 61,
          productName: "Салат Цезар з куркою",
          quantity: 1,
          price: 145,
        },
        { productId: 2, productName: "Чай матча лате", quantity: 1, price: 95 },
      ],
      total: 240,
    },
  ];

  sessions: Map<string, number> = new Map();

  _nextUserId = 3;
  _nextOrderId = 3;
  _nextProductId = 137;

  generateToken(userId: number): string {
    const token = `mock_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.sessions.set(token, userId);
    return token;
  }

  getUserFromToken(token: string): DBUser | null {
    const userId = this.sessions.get(token);
    if (userId) return this.users.find((u) => u.id === userId) ?? null;
    if (token.startsWith("mock_")) {
      const id = parseInt(token.split("_")[1]);
      if (!isNaN(id)) {
        const user = this.users.find((u) => u.id === id);
        if (user) {
          this.sessions.set(token, user.id);
          return user;
        }
      }
    }
    return null;
  }

  /**
   * TODO [BACKEND]: замінити на генерацію реального OTP і відправку через TurboSMS
   * Зберігати OTP в окремій таблиці з TTL 5 хв, не в user-об'єкті
   */
  generateOtp(userId: number): string {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return "";
    // 🚧 МОК: завжди "123456"
    // TODO [BACKEND]: const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code = "123456";
    user.phone_otp = code;
    user.phone_otp_expires = Date.now() + 5 * 60 * 1000;
    console.log(`[MOCK OTP] user=${userId} code=${code}`); // лише для дев
    return code;
  }

  /**
   * TODO [BACKEND]: перевіряти OTP з БД, враховувати TTL і кількість спроб
   */
  verifyOtp(userId: number, code: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user || !user.phone_otp || !user.phone_otp_expires) return false;
    if (Date.now() > user.phone_otp_expires) return false;
    return user.phone_otp === code;
  }

  clearOtp(userId: number) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.phone_otp = undefined;
      user.phone_otp_expires = undefined;
    }
  }

  toPublicUser(u: DBUser) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      phone_verified: u.phone_verified ?? false,
      address: u.address,
      payment: u.payment,
      card_masked_pan: u.card_masked_pan,
      card_type: u.card_type,
      admin: u.admin,
    };
  }
}

const globalForMock = globalThis as typeof globalThis & {
  _mockDb?: MockDatabase;
};
if (!globalForMock._mockDb) globalForMock._mockDb = new MockDatabase();
export const db = globalForMock._mockDb;
