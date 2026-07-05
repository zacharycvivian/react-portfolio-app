/**
 * Firestore-backed, per-IP fixed-window rate limiting for API routes.
 *
 * Server-only (imports the Admin SDK). Keys are namespaced so different
 * endpoints don't share a budget, and the IP is sanitised before being used as
 * a Firestore document id.
 */
import type { NextRequest } from "next/server";
import { adminDb } from "@/../firebase-admin";

/** Best-effort client IP from the standard proxy headers (Vercel sets these). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Fixed-window rate limit. Returns true if the call is allowed, false if the
 * caller has exceeded `max` requests within `windowMs` for the given namespace.
 */
export async function checkRateLimit(
  namespace: string,
  ip: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const safeIp = ip.replace(/[^a-zA-Z0-9_.:-]/g, "_") || "unknown";
  const ref = adminDb.collection("rateLimits").doc(`${namespace}:${safeIp}`);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    if (!data || now - (data.windowStart ?? 0) > windowMs) {
      tx.set(ref, { windowStart: now, count: 1 });
      return true;
    }
    if ((data.count ?? 0) >= max) return false;
    tx.update(ref, { count: (data.count ?? 0) + 1 });
    return true;
  });
}
