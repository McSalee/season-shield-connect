import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

// The partner demo (/demo) is behind one shared access code, checked only on the server.
// The code lives in the DEMO_ACCESS_CODE environment variable (not VITE_, so it is never
// put in the browser bundle). A correct code sets a signed, HttpOnly cookie for a few
// hours. The cookie is signed with the code itself, so changing the code on Vercel
// locks out every existing cookie. No code configured = the demo stays locked.

const COOKIE = "gona_demo";
const HOURS = 6;
// Part of what is signed. Changing it ends every open demo session at the next deploy
// (as does changing DEMO_ACCESS_CODE). v2: 2026-10-10, sign-out added.
const SESSION = "demo-v2";

function accessCode(): string | null {
  const code = process.env["DEMO_ACCESS_CODE"]?.trim();
  return code ? code : null;
}

async function hmac(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares in time independent of where the strings differ.
function sameText(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// Cookie value: "<expiry unix seconds>.<HMAC of it>".
async function validCookie(value: string | undefined, code: string): Promise<boolean> {
  const [exp, sig] = (value ?? "").split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) * 1000 < Date.now()) return false;
  return sameText(sig, await hmac(code, `${SESSION}:${exp}`));
}

export const hasDemoAccess = createServerFn({ method: "GET" }).handler(async (): Promise<boolean> => {
  const code = accessCode();
  return code ? validCookie(getCookie(COOKIE), code) : false;
});

export type UnlockResult = { ok: true } | { ok: false; reason: "wrong_code" | "not_configured" };

export const unlockDemo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().max(200) }))
  .handler(async ({ data }): Promise<UnlockResult> => {
    const code = accessCode();
    if (!code) return { ok: false, reason: "not_configured" };
    if (!sameText(data.code.trim(), code)) return { ok: false, reason: "wrong_code" };
    const exp = Math.floor(Date.now() / 1000) + HOURS * 3600;
    setCookie(COOKIE, `${exp}.${await hmac(code, `${SESSION}:${exp}`)}`, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: HOURS * 3600,
    });
    return { ok: true };
  });

// "Sign out" of the demo: removes the cookie, so the code is needed again.
export const lockDemo = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  deleteCookie(COOKIE, { path: "/" });
});
