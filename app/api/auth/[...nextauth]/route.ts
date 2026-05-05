// ФІКС: handlers — це об'єкт { GET, POST }, а не функція.
// Стара версія `export { handlers as GET, handlers as POST }` —
// експортувала весь об'єкт як GET і POST, що і спричиняло
// ClientFetchError (сервер повертав HTML замість JSON).

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
