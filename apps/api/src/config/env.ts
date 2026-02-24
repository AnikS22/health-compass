import dotenv from "dotenv";
import { z } from "zod";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(currentDir, "../../../../.env");
const rootEnvLocalPath = resolve(currentDir, "../../../../.env.local");

if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

if (existsSync(rootEnvLocalPath)) {
  dotenv.config({ path: rootEnvLocalPath, override: true });
}

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3001,http://localhost:3002,http://localhost:3003"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20)
});

export const env = envSchema.parse(process.env);
