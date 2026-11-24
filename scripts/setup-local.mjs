// Creates the local settings with random passwords and keys. Run it again after an update:
// what exists is kept, only missing settings are added.
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const secret = () => randomBytes(24).toString("hex");

function settings(path, wanted) {
  const file = root + path;
  const text = existsSync(file) ? readFileSync(file, "utf8") : "# Local settings, generated. Never commit this file.\n";
  const missing = Object.entries(wanted).filter(([name]) => !new RegExp(`^${name}=`, "m").test(text));
  if (missing.length > 0) {
    const added = missing.map(([name, value]) => `${name}=${value()}\n`).join("");
    writeFileSync(file, text.replace(/\n*$/, "\n") + added, { mode: 0o600 });
  }
  console.log(`${path}: ${missing.length === 0 ? "complete" : "added " + missing.map(([name]) => name).join(", ")}`);
}

function keys(folder) {
  const privateFile = `${root}${folder}/jwt-private.pem`;
  if (existsSync(privateFile)) {
    console.log(`${folder}: complete`);
    return;
  }
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  mkdirSync(root + folder, { recursive: true });
  writeFileSync(privateFile, pair.privateKey, { mode: 0o600 });
  writeFileSync(`${root}${folder}/jwt-public.pem`, pair.publicKey);
  console.log(`${folder}: key pair created`);
}

settings("backend/.env", {
  STORE_ID: () => "matessa",
  DB_PORT: () => "5434",
  DB_URL: () => "jdbc:postgresql://localhost:5434/matessa?currentSchema=shop",
  DB_APP_USER: () => "matessa_app",
  DB_APP_PASSWORD: secret,
  DB_OWNER_USER: () => "matessa_owner",
  DB_OWNER_PASSWORD: secret,
  DB_BACKUP_PASSWORD: secret,
  DB_SUPERUSER_PASSWORD: secret,
  DB_POOL_SIZE: () => "5",
  REDIS_HOST: () => "localhost",
  REDIS_PORT: () => "6381",
  REDIS_PASSWORD: secret,
  JWT_ISSUER: () => "matessa",
  JWT_PRIVATE_KEY: () => "file:keys/jwt-private.pem",
  JWT_PUBLIC_KEYS: () => "file:keys/jwt-public.pem",
  ADMIN_EMAIL: () => "admin@matessa.test",
  ADMIN_PASSWORD: secret,
});
keys("backend/keys");
settings("frontend/.env.local", { NEXT_PUBLIC_API_BASE_URL: () => "http://localhost:9080" });
