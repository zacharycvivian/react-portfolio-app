/**
 * POST /api/audit
 *
 * Stamps server-derived audit metadata onto a submission document that the
 * client just created (AI chat, bug report, feedback, or contact message).
 *
 * The client only sends the collection + document id — the IP address, browser
 * user-agent, and signed-in identity are all derived server-side so they can't
 * be spoofed. If the visitor is signed in we record their Google email, name,
 * and avatar so the admin panel can show *who* submitted (not just an IP).
 *
 * Best-effort: failures never affect the user-facing flow.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import { adminDb } from "@/../firebase-admin";
import { getClientIp, checkRateLimit } from "@/lib/rateLimit";

// Generous per-IP cap: audit runs about once per legitimate submission, so this
// only bites automation trying to spam documents or admin notifications.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

// Only these collections may be enriched — prevents the endpoint from being
// used to write to arbitrary documents.
const ALLOWED_COLLECTIONS = new Set(["generate", "bugs", "feedback", "connect"]);

// Submissions that should raise an admin notification (AI chats do not — too
// high-volume). Maps the source collection to the notification it creates.
const NOTIFY: Record<
  string,
  { type: string; title: string; field: string }
> = {
  bugs: { type: "bug", title: "New bug report", field: "bugs" },
  feedback: { type: "feedback", title: "New feedback", field: "feedback" },
  connect: { type: "message", title: "New message", field: "message" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const collection = typeof body?.collection === "string" ? body.collection : "";
    const id = typeof body?.id === "string" ? body.id : "";

    if (!ALLOWED_COLLECTIONS.has(collection) || !id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ip = getClientIp(request);
    if (!(await checkRateLimit("audit", ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Only enrich a document that already exists — the client creates the
    // submission first, then calls this. Refusing unknown ids stops the
    // endpoint from being abused to create stub docs or fire notifications
    // for attacker-supplied ids.
    const ref = adminDb.collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    await ref.set(
      {
        ip,
        userAgent: request.headers.get("user-agent") ?? null,
        userEmail: session?.user?.email ?? null,
        userName: session?.user?.name ?? null,
        userImage: session?.user?.image ?? null,
        auditedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Raise an admin notification for the relevant submission types. Created
    // server-side so it's recorded reliably with an unread flag.
    const notify = NOTIFY[collection];
    if (notify) {
      const data = snap.data() ?? {};
      const who = session?.user?.email ?? data.email ?? data.name ?? "Guest";
      const detail = String(data[notify.field] ?? "").slice(0, 80);
      await adminDb.collection("notifications").add({
        type: notify.type,
        title: notify.title,
        body: [who, detail].filter(Boolean).join(": "),
        time: FieldValue.serverTimestamp(),
        read: false,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to audit" }, { status: 500 });
  }
}
