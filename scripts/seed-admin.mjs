/**
 * 初期管理者ユーザーを作成するスクリプト
 *
 * 使い方:
 *   node scripts/seed-admin.mjs <loginId> <password> [name]
 *
 * 例:
 *   node scripts/seed-admin.mjs admin Safety6369 "システム管理者"
 */
import { PrismaClient } from "@prisma/client";
import { webcrypto as crypto } from "node:crypto";

const prisma = new PrismaClient();
const te = new TextEncoder();

function b64urlEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw", te.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key, 32 * 8
  );
  return `pbkdf2$100000$${b64urlEncode(salt)}$${b64urlEncode(bits)}`;
}

async function main() {
  const [loginId, password, name = "管理者"] = process.argv.slice(2);
  if (!loginId || !password) {
    console.error("使い方: node scripts/seed-admin.mjs <loginId> <password> [name]");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const existing = await prisma.adminUser.findUnique({ where: { loginId } });
  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { passwordHash, name, isActive: true },
    });
    console.log(`[OK] 既存の管理者 '${loginId}' のパスワードを更新しました`);
  } else {
    const created = await prisma.adminUser.create({
      data: { loginId, passwordHash, name, role: "admin", isActive: true },
    });
    console.log(`[OK] 管理者を作成しました: id=${created.id} loginId=${created.loginId}`);
  }
}
main().finally(() => prisma.$disconnect());
