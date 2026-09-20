import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "parent_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 يوماً

function sign(payload: string): string {
  const secret = process.env.PARENT_SESSION_SECRET!;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createParentToken(phone: string): { token: string; maxAge: number } {
  const payload = JSON.stringify({ phone, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(encoded);
  return { token: `${encoded}.${signature}`, maxAge: MAX_AGE_SECONDS };
}

export function verifyParentToken(token: string | undefined): { phone: string } | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload.phone !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return { phone: payload.phone };
  } catch {
    return null;
  }
}

export const PARENT_COOKIE_NAME = COOKIE_NAME;
