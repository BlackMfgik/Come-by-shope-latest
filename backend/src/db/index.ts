// src/db/index.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../env.js";
import * as schema from "./schema.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export type Db = typeof db;
