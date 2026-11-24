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
  "DB_PORT=5434",
  "DB_USER=matessa",
  `DB_PASSWORD=${secret()}`,
  "REDIS_PORT=6381",
  `REDIS_PASSWORD=${secret()}`,
]);

create("frontend/.env.local", ["NEXT_PUBLIC_API_BASE_URL=http://localhost:9080"]);
