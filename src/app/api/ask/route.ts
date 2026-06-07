/**
 * POST /api/ask
 *
 * Server-side entry point for the terminal chatbot's `/ask` command. It:
 *   1. Validates the prompt (non-empty, length-capped).
 *   2. Enforces a per-IP rate limit in Firestore (can't be bypassed by hitting
 *      Firestore directly — the recommended rules forbid client writes to
 *      `generate`, so all chats must come through here).
 *   3. Creates the `generate` document (with IP + identity) via the Admin SDK.
 *      The Firebase AI extension picks it up and writes the response back.
 *
 * Returns `{ id }` so the client can subscribe to that doc for the answer.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import { adminDb } from "@/../firebase-admin";

const MAX_PROMPT_LENGTH = 1200;
const RATE_LIMIT_MAX = 5; // requests…
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // …per 5 minutes, per IP

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Firestore-backed fixed-window rate limit. Returns true if allowed. */
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = ip.replace(/[^a-zA-Z0-9_.:-]/g, "_") || "unknown";
  const ref = adminDb.collection("rateLimits").doc(key);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    if (!data || now - (data.windowStart ?? 0) > RATE_LIMIT_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return true;
    }
    if ((data.count ?? 0) >= RATE_LIMIT_MAX) return false;
    tx.update(ref, { count: (data.count ?? 0) + 1 });
    return true;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }

    const ip = getClientIp(request);
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const ref = await adminDb.collection("generate").add({
      prompt,
      createdAt: FieldValue.serverTimestamp(),
      status: "pending",
      ip,
      userAgent: request.headers.get("user-agent") ?? null,
      userEmail: session?.user?.email ?? null,
      userName: session?.user?.name ?? null,
      userImage: session?.user?.image ?? null,
    });

    return NextResponse.json({ id: ref.id });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
