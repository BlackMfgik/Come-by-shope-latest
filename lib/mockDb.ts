export interface DBUser {
  id: number;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
  payment?: string;
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
      id: 6,
      name: "Свіжовичавлений апельсиновий сік",
      description: "100% натуральний апельсиновий сік",
      weight: "250 мл",
      price: 75,
      category: "Напої",
    },
    {
      id: 7,
      name: "Лимонад домашній",
      description: "Освіжаючий лимонад з м'ятою",
      weight: "400 мл",
      price: 69,
      category: "Напої",
    },
    {
      id: 8,
      name: "Чай матча лате",
      description: "Японський зелений чай зі збитим молоком",
      weight: "300 мл",
      price: 95,
      category: "Напої",
    },
    {
      id: 9,
      name: "Гарячий шоколад",
      description: "Насичений гарячий шоколад",
      weight: "250 мл",
      price: 89,
      category: "Напої",
    },
    {
      id: 10,
      name: "Молочний коктейль Ваніль",
      description: "Класичний молочний коктейль",
      weight: "400 мл",
      price: 92,
      category: "Напої",
    },
    {
      id: 11,
      name: "Ромашковий чай",
      description: "Заспокійливий трав'яний чай",
      weight: "300 мл",
      price: 55,
      category: "Напої",
    },
    {
      id: 12,
      name: "Імбирний лимонад",
      description: "Пряний лимонад з імбиром та медом",
      weight: "350 мл",
      price: 79,
      category: "Напої",
    },
    {
      id: 13,
      name: "Кокосовий лате",
      description: "Кава з кокосовим молоком",
      weight: "300 мл",
      price: 99,
      category: "Напої",
    },
    {
      id: 14,
      name: "Смузі Манго-Маракуя",
      description: "Тропічний фруктовий смузі",
      weight: "300 мл",
      price: 94,
      category: "Напої",
    },
    {
      id: 15,
      name: "Зелений смузі Детокс",
      description: "Шпинат, огірок, яблуко, лимон",
      weight: "350 мл",
      price: 87,
      category: "Напої",
    },
    {
      id: 16,
      name: "Чорний чай зі спеціями",
      description: "Масала чай",
      weight: "300 мл",
      price: 62,
      category: "Напої",
    },
    {
      id: 17,
      name: "Кава рафа",
      description: "Вершки, ваніль і еспресо",
      weight: "250 мл",
      price: 105,
      category: "Напої",
    },
    {
      id: 18,
      name: "Тропічний фреш",
      description: "Ананас, апельсин, манго",
      weight: "300 мл",
      price: 92,
      category: "Напої",
    },
    {
      id: 19,
      name: "Кефір з ягодами",
      description: "Пробіотичний напій з лісовими ягодами",
      weight: "250 мл",
      price: 72,
      category: "Напої",
    },
    {
      id: 20,
      name: "Кавун-малина сорбет",
      description: "Освіжаючий ягідний напій",
      weight: "350 мл",
      price: 85,
      category: "Напої",
    },

    // Снеки
    {
      id: 21,
      name: "Сендвіч BLT",
      description: "Бекон, салат, томат на тостовому хлібі",
      weight: "220 г",
      price: 119,
      category: "Снеки",
    },
    {
      id: 22,
      name: "Клаб-сендвіч з куркою",
      description: "Куряче філе, сир, томат, майонез",
      weight: "280 г",
      price: 139,
      category: "Снеки",
    },
    {
      id: 23,
      name: "Хот-дог класичний",
      description: "Сосиска, гірчиця, кетчуп, маринований огірок",
      weight: "180 г",
      price: 85,
      category: "Снеки",
    },
    {
      id: 24,
      name: "Чіпси картопляні Original",
      description: "Хрусткі класичні чіпси",
      weight: "130 г",
      price: 49,
      category: "Снеки",
    },
    {
      id: 25,
      name: "Попкорн солоно-карамельний",
      description: "Двокольоровий попкорн",
      weight: "80 г",
      price: 45,
      category: "Снеки",
    },
    {
      id: 26,
      name: "Нагетси курячі (8 шт)",
      description: "Хрусткі нагетси з соусом BBQ",
      weight: "200 г",
      price: 109,
      category: "Снеки",
    },
    {
      id: 27,
      name: "Картопля по-селянськи",
      description: "Хрустка картопля зі спеціями",
      weight: "250 г",
      price: 79,
      category: "Снеки",
    },
    {
      id: 28,
      name: "Крейкери з сиром",
      description: "Хрусткі крекери з вершковим сиром",
      weight: "100 г",
      price: 65,
      category: "Снеки",
    },
    {
      id: 29,
      name: "Суші ролл Каліфорнія (8 шт)",
      description: "Краб, авокадо, огірок, ікра",
      weight: "280 г",
      price: 155,
      category: "Снеки",
    },
    {
      id: 30,
      name: "Начос з соусом",
      description: "Кукурудзяні чіпси з сальсою та гуакамоле",
      weight: "200 г",
      price: 115,
      category: "Снеки",
    },
    {
      id: 31,
      name: "Млинець зі шпинатом і сиром",
      description: "Тонкий млинець з вершковою начинкою",
      weight: "180 г",
      price: 89,
      category: "Снеки",
    },
    {
      id: 32,
      name: "Тост Авокадо",
      description: "Авокадо, яйце пашот, мікрогрін",
      weight: "200 г",
      price: 129,
      category: "Снеки",
    },
    {
      id: 33,
      name: "Пані-іні з шинкою і сиром",
      description: "Пресований сендвіч з грилем",
      weight: "220 г",
      price: 115,
      category: "Снеки",
    },
    {
      id: 34,
      name: "Рисові снеки з васабі",
      description: "Легкі рисові крекери",
      weight: "60 г",
      price: 42,
      category: "Снеки",
    },
    {
      id: 35,
      name: "Яєчний бургер",
      description: "Яйце, бекон, сир на булочці бріош",
      weight: "260 г",
      price: 125,
      category: "Снеки",
    },
    {
      id: 36,
      name: "Зернова гранола-бар",
      description: "Батончик з вівсом, медом і горіхами",
      weight: "50 г",
      price: 38,
      category: "Снеки",
    },
    {
      id: 37,
      name: "Сирний паніні",
      description: "Розплавлена моцарела і томат чері",
      weight: "200 г",
      price: 99,
      category: "Снеки",
    },
    {
      id: 38,
      name: "Чіпси буряковий",
      description: "Натуральні бурякові чіпси",
      weight: "70 г",
      price: 52,
      category: "Снеки",
    },
    {
      id: 39,
      name: "Пирожок з вишнею",
      description: "Листкове тісто з вишневою начинкою",
      weight: "120 г",
      price: 65,
      category: "Снеки",
    },
    {
      id: 40,
      name: "Лаваш-ролл з фалафелем",
      description: "Хумус, фалафель, свіжі овочі",
      weight: "250 г",
      price: 119,
      category: "Снеки",
    },

    // Кондитерські
    {
      id: 41,
      name: "Тірамісу класичний",
      description: "Маскарпоне, савоярді, кава",
      weight: "120 г",
      price: 89,
      category: "Кондитерські",
    },
    {
      id: 42,
      name: "Чізкейк Нью-Йорк",
      description: "Класичний американський чізкейк",
      weight: "150 г",
      price: 95,
      category: "Кондитерські",
    },
    {
      id: 43,
      name: "Макарон Малина",
      description: "Французький макарон з малиновим ганашем",
      weight: "20 г",
      price: 49,
      category: "Кондитерські",
    },
    {
      id: 44,
      name: "Макарон Фісташка",
      description: "Ніжний макарон з фісташковим кремом",
      weight: "20 г",
      price: 49,
      category: "Кондитерські",
    },
    {
      id: 45,
      name: "Шоколадний брауні",
      description: "Вологий брауні з темного шоколаду",
      weight: "100 г",
      price: 75,
      category: "Кондитерські",
    },
    {
      id: 46,
      name: "Екклер з ванільним кремом",
      description: "Класичний французький еклер",
      weight: "90 г",
      price: 69,
      category: "Кондитерські",
    },
    {
      id: 47,
      name: "Круасан масляний",
      description: "Листковий масляний круасан",
      weight: "100 г",
      price: 55,
      category: "Кондитерські",
    },
    {
      id: 48,
      name: "Круасан шоколадний",
      description: "Листковий круасан з шоколадною начинкою",
      weight: "110 г",
      price: 62,
      category: "Кондитерські",
    },
    {
      id: 49,
      name: "Медівник",
      description: "Традиційний медовий торт",
      weight: "150 г",
      price: 85,
      category: "Кондитерські",
    },
    {
      id: 50,
      name: "Панакота Ваніль-Карамель",
      description: "Ніжна молочна пана-котта",
      weight: "130 г",
      price: 89,
      category: "Кондитерські",
    },
    {
      id: 51,
      name: "Наполеон",
      description: "Класичний торт Наполеон",
      weight: "160 г",
      price: 92,
      category: "Кондитерські",
    },
    {
      id: 52,
      name: "Мафін чорниця",
      description: "Соковитий мафін з чорницею",
      weight: "100 г",
      price: 65,
      category: "Кондитерські",
    },
    {
      id: 53,
      name: "Профітролі зі збитими вершками",
      description: "Міні-еклери з вершковою начинкою",
      weight: "120 г",
      price: 79,
      category: "Кондитерські",
    },
    {
      id: 54,
      name: "Тарт лимонний меренг",
      description: "Ніжний лимонний крем і французька меренга",
      weight: "130 г",
      price: 95,
      category: "Кондитерські",
    },
    {
      id: 55,
      name: "Трюфель бельгійський",
      description: "Шоколадний трюфель з темним какао",
      weight: "25 г",
      price: 45,
      category: "Кондитерські",
    },
    {
      id: 56,
      name: "Птіфур асорті (6 шт)",
      description: "Мікс французьких тістечок",
      weight: "120 г",
      price: 115,
      category: "Кондитерські",
    },
    {
      id: 57,
      name: "Вафлі Льєжські",
      description: "Хрусткі бельгійські вафлі",
      weight: "150 г",
      price: 79,
      category: "Кондитерські",
    },
    {
      id: 58,
      name: "Ягідний пай",
      description: "Домашній пай з лісовими ягодами",
      weight: "180 г",
      price: 105,
      category: "Кондитерські",
    },
    {
      id: 59,
      name: "Кекс мармуровий",
      description: "Ванільно-шоколадний мармуровий кекс",
      weight: "120 г",
      price: 72,
      category: "Кондитерські",
    },
    {
      id: 60,
      name: "Крем-бруле",
      description: "Класичний французький десерт",
      weight: "120 г",
      price: 89,
      category: "Кондитерські",
    },

    // Свіже
    {
      id: 61,
      name: "Салат Цезар з куркою",
      description: "Ромен, гриль-курка, пармезан, сухарики",
      weight: "280 г",
      price: 145,
      category: "Свіже",
    },
    {
      id: 62,
      name: "Грецький салат",
      description: "Томати, огірок, оливки, фета",
      weight: "250 г",
      price: 125,
      category: "Свіже",
    },
    {
      id: 63,
      name: "Боул Тунець-Авокадо",
      description: "Рис, тунець, авокадо, кунжут, едамаме",
      weight: "350 г",
      price: 165,
      category: "Свіже",
    },
    {
      id: 64,
      name: "Боул Буда з тофу",
      description: "Кіноа, тофу, хумус, свіжі овочі",
      weight: "350 г",
      price: 149,
      category: "Свіже",
    },
    {
      id: 65,
      name: "Карпаччо з яловичини",
      description: "Тонко нарізана яловичина, рукола, пармезан",
      weight: "180 г",
      price: 189,
      category: "Свіже",
    },
    {
      id: 66,
      name: "Вінегрет домашній",
      description: "Буряк, квасоля, кислі огірки",
      weight: "220 г",
      price: 85,
      category: "Свіже",
    },
    {
      id: 67,
      name: "Нікуаз",
      description: "Тунець, яйця, квасоля, оливки, томати",
      weight: "300 г",
      price: 155,
      category: "Свіже",
    },
    {
      id: 68,
      name: "Капрезе",
      description: "Моцарела, томати, базилік, оливкова олія",
      weight: "200 г",
      price: 129,
      category: "Свіже",
    },
    {
      id: 69,
      name: "Рол з лососем і Philadelphia",
      description: "Свіжий лосось, вершковий сир, огірок",
      weight: "250 г",
      price: 149,
      category: "Свіже",
    },
    {
      id: 70,
      name: "Асорті фрукти",
      description: "Сезонні фрукти, нарізані порційно",
      weight: "250 г",
      price: 119,
      category: "Свіже",
    },
    {
      id: 71,
      name: "Ягідна тарілка",
      description: "Полуниця, малина, чорниця, ожина",
      weight: "200 г",
      price: 135,
      category: "Свіже",
    },
    {
      id: 72,
      name: "Боул Лосось Теріякі",
      description: "Рис, лосось, едамаме, авокадо, соус теріякі",
      weight: "380 г",
      price: 179,
      category: "Свіже",
    },
    {
      id: 73,
      name: "Теплий салат з лінзами",
      description: "Зелені лінзи, шпинат, фета, горіхи",
      weight: "280 г",
      price: 135,
      category: "Свіже",
    },
    {
      id: 74,
      name: "Сезонний овочевий боул",
      description: "Смажені та свіжі сезонні овочі з кіноа",
      weight: "320 г",
      price: 125,
      category: "Свіже",
    },
    {
      id: 75,
      name: "Гаспачо",
      description: "Холодний іспанський томатний суп",
      weight: "250 г",
      price: 99,
      category: "Свіже",
    },
    {
      id: 76,
      name: "Мус авокадо-лайм",
      description: "Ніжний мус з авокадо та вершкового сиру",
      weight: "150 г",
      price: 115,
      category: "Свіже",
    },
    {
      id: 77,
      name: "Тарілка bruschetta",
      description: "4 тости з різними топінгами",
      weight: "200 г",
      price: 129,
      category: "Свіже",
    },
    {
      id: 78,
      name: "Хумус домашній з піта",
      description: "Свіжий хумус з теплою пітою",
      weight: "200 г",
      price: 109,
      category: "Свіже",
    },
    {
      id: 79,
      name: "Запечений буряк з козячим сиром",
      description: "Теплий салат із запеченим буряком",
      weight: "240 г",
      price: 139,
      category: "Свіже",
    },
    {
      id: 80,
      name: "Крем-суп з гарбуза",
      description: "Оксамитовий гарбузовий суп зі вершками",
      weight: "300 г",
      price: 115,
      category: "Свіже",
    },

    // Заморожене
    {
      id: 81,
      name: "Морозиво Ваніль",
      description: "Класичне вершкове морозиво",
      weight: "90 г",
      price: 49,
      category: "Заморожене",
    },
    {
      id: 82,
      name: "Морозиво Шоколад",
      description: "Насичений шоколадний смак",
      weight: "90 г",
      price: 52,
      category: "Заморожене",
    },
    {
      id: 83,
      name: "Сорбет Манго",
      description: "Тропічний манговий сорбет",
      weight: "80 г",
      price: 59,
      category: "Заморожене",
    },
    {
      id: 84,
      name: "Сорбет Малина",
      description: "Освіжаючий малиновий сорбет",
      weight: "80 г",
      price: 59,
      category: "Заморожене",
    },
    {
      id: 85,
      name: "Фраппучіно заморожений",
      description: "Заморожений кавовий напій",
      weight: "350 мл",
      price: 89,
      category: "Заморожене",
    },
    {
      id: 86,
      name: "Ягідний фрозен",
      description: "Заморожений ягідний коктейль",
      weight: "300 мл",
      price: 79,
      category: "Заморожене",
    },
    {
      id: 87,
      name: "Пломбір на паличці",
      description: "Класичний пломбір у шоколадній глазурі",
      weight: "100 г",
      price: 65,
      category: "Заморожене",
    },
    {
      id: 88,
      name: "Морозиво Страчателла",
      description: "Вершкове морозиво з шоколадними крихтами",
      weight: "90 г",
      price: 62,
      category: "Заморожене",
    },
    {
      id: 89,
      name: "Заморожений грецький йогурт",
      description: "Густий йогурт з лісовими ягодами",
      weight: "150 г",
      price: 79,
      category: "Заморожене",
    },
    {
      id: 90,
      name: "Джелато Фісташка",
      description: "Автентичне сицилійське джелато",
      weight: "100 г",
      price: 75,
      category: "Заморожене",
    },

    // Соуси
    {
      id: 91,
      name: "Цезар соус авторський",
      description: "Домашній соус Цезар",
      weight: "80 г",
      price: 35,
      category: "Соуси",
    },
    {
      id: 92,
      name: "Гуакамоле свіжий",
      description: "Авокадо, лайм, кінза",
      weight: "100 г",
      price: 45,
      category: "Соуси",
    },
    {
      id: 93,
      name: "Хумус пітний",
      description: "Нутовий хумус із тахіні",
      weight: "100 г",
      price: 45,
      category: "Соуси",
    },
    {
      id: 94,
      name: "Соус BBQ димний",
      description: "Димний барбекю-соус",
      weight: "80 г",
      price: 32,
      category: "Соуси",
    },
    {
      id: 95,
      name: "Сальса томатна",
      description: "Свіжа томатна сальса із халапеньо",
      weight: "100 г",
      price: 35,
      category: "Соуси",
    },
    {
      id: 96,
      name: "Сирний соус начо",
      description: "Теплий сир-дип для начос",
      weight: "100 г",
      price: 38,
      category: "Соуси",
    },
    {
      id: 97,
      name: "Тартар соус",
      description: "Класичний соус тартар",
      weight: "80 г",
      price: 32,
      category: "Соуси",
    },
    {
      id: 98,
      name: "Трюфельний майонез",
      description: "Вершковий майонез з трюфелем",
      weight: "80 г",
      price: 55,
      category: "Соуси",
    },
    {
      id: 99,
      name: "Айолі часниковий",
      description: "Іспанський часниковий соус",
      weight: "80 г",
      price: 38,
      category: "Соуси",
    },
    {
      id: 100,
      name: "Теріякі домашній",
      description: "Японський соус теріякі",
      weight: "80 г",
      price: 42,
      category: "Соуси",
    },
    {
      id: 101,
      name: "Соус Шрірача",
      description: "Гострий тайський соус",
      weight: "80 г",
      price: 35,
      category: "Соуси",
    },
    {
      id: 102,
      name: "Базилікове песто",
      description: "Генуезький соус песто",
      weight: "80 г",
      price: 52,
      category: "Соуси",
    },
    {
      id: 103,
      name: "Медово-гірчичний соус",
      description: "Солодко-гострий соус",
      weight: "80 г",
      price: 38,
      category: "Соуси",
    },
    {
      id: 104,
      name: "Манговий чатні",
      description: "Індійський манговий чатні",
      weight: "100 г",
      price: 45,
      category: "Соуси",
    },
    {
      id: 105,
      name: "Понзу японський",
      description: "Цитрусово-соєвий соус",
      weight: "80 г",
      price: 48,
      category: "Соуси",
    },
    {
      id: 106,
      name: "Вершково-грибний соус",
      description: "Кремовий соус з печерицями",
      weight: "120 г",
      price: 55,
      category: "Соуси",
    },
    {
      id: 107,
      name: "Малиновий вінегрет-соус",
      description: "Легкий малиновий заправочний соус",
      weight: "80 г",
      price: 42,
      category: "Соуси",
    },
    {
      id: 108,
      name: "Кунжутна заправка",
      description: "Азіатська кунжутна заправка для салатів",
      weight: "80 г",
      price: 38,
      category: "Соуси",
    },
    {
      id: 109,
      name: "Ранч-соус",
      description: "Американський Ranch dressing",
      weight: "100 г",
      price: 35,
      category: "Соуси",
    },
    {
      id: 110,
      name: "Бальзамічний крем",
      description: "Густий бальзамічний крем зі зменшенням",
      weight: "80 г",
      price: 59,
      category: "Соуси",
    },
    {
      id: 111,
      name: "Паста Espresso подвійне смаження",
      description: "Насичена кавова паста-концентрат",
      weight: "100 г",
      price: 75,
      category: "Соуси",
    },
    {
      id: 112,
      name: "Ягідна кулі Маракуя",
      description: "Свіже ягідне кулі для десертів",
      weight: "100 г",
      price: 55,
      category: "Соуси",
    },
    {
      id: 113,
      name: "Соус Romesco",
      description: "Іспанський соус з паленого перцю та горіхів",
      weight: "100 г",
      price: 62,
      category: "Соуси",
    },
    {
      id: 114,
      name: "Чорничний вінегрет",
      description: "Чорниця, оливкова олія, бальзамік",
      weight: "80 г",
      price: 48,
      category: "Соуси",
    },
    {
      id: 115,
      name: "Кисло-солодкий соус",
      description: "Китайський кисло-солодкий соус",
      weight: "80 г",
      price: 32,
      category: "Соуси",
    },
    {
      id: 116,
      name: "Морквяний харіса",
      description: "Марокканська паста харіса з морквою",
      weight: "80 г",
      price: 52,
      category: "Соуси",
    },
    {
      id: 117,
      name: "Кремовий сирний дип",
      description: "Вершковий дип з пряними травами",
      weight: "100 г",
      price: 45,
      category: "Соуси",
    },
    {
      id: 118,
      name: "Ореховий соус Satay",
      description: "Тайський арахісовий соус",
      weight: "100 г",
      price: 55,
      category: "Соуси",
    },
    {
      id: 119,
      name: "Авторська зелена чимічурі",
      description: "Аргентинський соус з зелені",
      weight: "80 г",
      price: 48,
      category: "Соуси",
    },
    {
      id: 120,
      name: "Ванільний карамельний дрізл",
      description: "Рідка карамель із морською сіллю",
      weight: "80 г",
      price: 38,
      category: "Соуси",
    },

    // Меню
    {
      id: 121,
      name: "Піца Маргарита",
      description: "Томатний соус, моцарела, свіжий базилік",
      weight: "400 г",
      price: 189,
      category: "Меню",
    },
    {
      id: 122,
      name: "Бургер Класичний",
      description: "Яловича котлета, сир чеддер, салат, томат, соус",
      weight: "350 г",
      price: 165,
      category: "Меню",
    },
    {
      id: 123,
      name: "Паста Карбонара",
      description: "Спагетті, бекон, яйце, пармезан, чорний перець",
      weight: "320 г",
      price: 175,
      category: "Меню",
    },
    {
      id: 124,
      name: "Суші-сет Токіо",
      description: "12 шт: лосось, тунець, огірок, авокадо",
      weight: "360 г",
      price: 245,
      category: "Меню",
    },
    {
      id: 125,
      name: "Боул з куркою теріякі",
      description: "Рис, куряче філе, едамаме, морква, соус теріякі",
      weight: "450 г",
      price: 195,
      category: "Меню",
    },
    {
      id: 126,
      name: "Цезар з лососем",
      description: "Романо, лосось, пармезан, крутони, соус Цезар",
      weight: "300 г",
      price: 185,
      category: "Меню",
    },
    {
      id: 127,
      name: "Рамен з куркою",
      description: "Насичений бульйон, локшина рамен, яйце, норі",
      weight: "500 г",
      price: 215,
      category: "Меню",
    },
    {
      id: 128,
      name: "Шаурма куряча",
      description: "Куряче філе, овочі, соус, лаваш",
      weight: "380 г",
      price: 145,
      category: "Меню",
    },
    {
      id: 129,
      name: "Піца Пепероні",
      description: "Томатний соус, моцарела, пепероні",
      weight: "420 г",
      price: 209,
      category: "Меню",
    },
    {
      id: 130,
      name: "Грецький салат",
      description: "Томати, огірок, оливки, фета, орегано",
      weight: "280 г",
      price: 135,
      category: "Меню",
    },

    // Комбо
    {
      id: 131,
      name: "Комбо Сімейний",
      description: "2 піци + 4 напої + 2 десерти — вигідний набір для родини",
      weight: "2.4 кг",
      price: 549,
      category: "Комбо",
    },
    {
      id: 132,
      name: "Комбо Обід на двох",
      description: "2 боули + 2 напої + 2 десерти — ідеальний обід вдвох",
      weight: "1.6 кг",
      price: 389,
      category: "Комбо",
    },
    {
      id: 133,
      name: "Комбо Суші-вечір",
      description: "Суші-сет Токіо + рамен + 2 напої",
      weight: "1.36 кг",
      price: 429,
      category: "Комбо",
    },
    {
      id: 134,
      name: "Комбо Бургер-пак",
      description: "2 бургери + картопля фрі + 2 напої",
      weight: "1.2 кг",
      price: 349,
      category: "Комбо",
    },
    {
      id: 135,
      name: "Комбо Пікнік",
      description: "Шаурма + піца Маргарита + снеки + 4 напої",
      weight: "2.0 кг",
      price: 489,
      category: "Комбо",
    },
    {
      id: 136,
      name: "Комбо Студентський",
      description: "Паста + салат Цезар + напій — ситно та доступно",
      weight: "900 г",
      price: 289,
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
      address: "вул. Хрещатик 1, Київ",
      payment: "Visa **** 4242",
      admin: true,
    },
    {
      id: 2,
      email: "user@comeby.ua",
      password: "user123",
      name: "Тестовий Користувач",
      phone: "+380501234567",
      address: "вул. Лесі Українки 10, Київ",
      payment: "Mastercard **** 5353",
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
          productId: 47,
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
        { productId: 8, productName: "Чай матча лате", quantity: 1, price: 95 },
      ],
      total: 240,
    },
  ];

  sessions: Map<string, number> = new Map(); // token -> userId

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

  toPublicUser(u: DBUser) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      address: u.address,
      payment: u.payment,
      admin: u.admin,
    };
  }
}

const globalForMock = globalThis as typeof globalThis & {
  _mockDb?: MockDatabase;
};
if (!globalForMock._mockDb) {
  globalForMock._mockDb = new MockDatabase();
}
export const db = globalForMock._mockDb;
