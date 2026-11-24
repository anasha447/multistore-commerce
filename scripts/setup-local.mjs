// Creates the local settings files once, with random passwords. Existing files are left alone.
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const secret = () => randomBytes(24).toString("hex");

function create(path, lines) {
  if (existsSync(root + path)) {
    console.log(`kept     ${path}`);
    return;
  }
  writeFileSync(root + path, lines.join("\n") + "\n", { mode: 0o600 });
  console.log(`created  ${path}`);
}

create("backend/.env", [
  "# Local passwords, generated. Never commit this file.",
  "STORE_ID=matessa",
  "DB_PORT=5434",
  "DB_URL=jdbc:postgresql://localhost:5434/matessa?currentSchema=shop",
  "DB_APP_USER=matessa_app",
  `DB_APP_PASSWORD=${secret()}`,
  "DB_OWNER_USER=matessa_owner",
  `DB_OWNER_PASSWORD=${secret()}`,
  `DB_BACKUP_PASSWORD=${secret()}`,
  `DB_SUPERUSER_PASSWORD=${secret()}`,
  "DB_POOL_SIZE=5",
  "REDIS_HOST=localhost",
  "REDIS_PORT=6381",
  `REDIS_PASSWORD=${secret()}`,
]);

create("frontend/.env.local", ["NEXT_PUBLIC_API_BASE_URL=http://localhost:9080"]);
