// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
