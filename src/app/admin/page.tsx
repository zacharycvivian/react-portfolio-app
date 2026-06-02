import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import { adminDb } from "@/../firebase-admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import styles from "./users.module.css";
import VerifiedLabel from "@/../public/verified.png";
import DefaultAvatar from "@/../public/defaultavatar.jpg";
import type { SessionUser } from "@/types";

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 2V1.5C6 1.22386 6.22386 1 6.5 1H9.5C9.77614 1 10 1.22386 10 1.5V2H13V3H3V2H6Z" fill="currentColor" />
    <path d="M4 4H12L11.2 13.2C11.0881 14.4423 10.0356 15.4 8.78992 15.4H7.21008C5.96437 15.4 4.91187 14.4423 4.8 13.2L4 4Z" fill="currentColor" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <circle cx="17" cy="7" r="4" opacity="0.5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87" opacity="0.5"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FeedbackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const BugIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v-9m2-4a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zm.12-3.12L16 2"/>
    <path d="M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13"/>
  </svg>
);

const TerminalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 11 2-2-2-2"/><path d="M11 13h4"/>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
  </svg>
);

/**
 * Renders who submitted something: their Google avatar + email when signed in,
 * otherwise "Guest". The captured IP is always shown (muted) for security
 * correlation. Field names match the audit metadata written by /api/audit.
 */
function AuditIdentity({ ip, userEmail, userImage }: AuditMeta) {
  const signedIn = Boolean(userEmail || userImage);
  return (
    <span className={styles.auditIdentity}>
      {signedIn ? (
        <>
          <Image
            src={userImage || DefaultAvatar}
            alt={userEmail ?? "user"}
            width={20}
            height={20}
            className={styles.auditAvatar}
            unoptimized
          />
          <span className={styles.auditEmail}>{userEmail ?? "Signed in"}</span>
        </>
      ) : (
        <span className={styles.auditGuest}>Guest</span>
      )}
      <span className={styles.auditIp}>{ip ?? "unknown IP"}</span>
    </span>
  );
}

type UserRecord = {
  id: string;
  name?: string;
  email?: string;
  occupation?: string;
  employer?: string;
  isVerified?: boolean;
  profileImageUrl?: string;
  phone?: string;
};

// Audit fields stamped server-side by /api/audit (see route + Chatbot).
type AuditMeta = {
  ip?: string;
  userEmail?: string;
  userName?: string;
  userImage?: string;
};

type FeedbackEntry = AuditMeta & {
  id: string;
  email?: string;
  feedback?: string;
  time?: FirebaseFirestore.Timestamp;
};

type BugEntry = AuditMeta & {
  id: string;
  email?: string;
  bugs?: string;
  time?: FirebaseFirestore.Timestamp;
};

type ConnectEntry = AuditMeta & {
  id: string;
  email?: string;
  name?: string;
  message?: string;
  time?: FirebaseFirestore.Timestamp;
};

// A chat with the terminal AI bot, stored in the existing `generate` collection
// (prompt + the extension's response), enriched with audit metadata.
type ChatLogEntry = AuditMeta & {
  id: string;
  prompt?: string;
  response?: string;
  error?: string;
  createdAt?: FirebaseFirestore.Timestamp;
};

export const metadata: Metadata = {
  title: "Admin - Zachary Vivian's Portfolio Website",
  robots: { index: false, follow: false },
};

/**
 * Resolves the signed-in requester's `users` document, but only if they are an
 * admin. Returns `null` when there is no session, the user can't be found, or
 * `isAdmin` is not set.
 *
 * This centralises the authorization check that every Server Action and the
 * page loader below relies on (previously copy-pasted into each). The user is
 * looked up by NextAuth `id` first, then falls back to a case-insensitive email
 * match.
 */
async function getAdminDoc(): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const session = await getServerSession(authOptions);
  const requesterId = (session?.user as SessionUser | undefined)?.id;
  const requesterEmail = session?.user?.email?.toLowerCase();
  if (!requesterId && !requesterEmail) return null;

  let adminDoc: FirebaseFirestore.DocumentSnapshot | null = requesterId
    ? await adminDb.collection("users").doc(requesterId).get()
    : null;
  if (!adminDoc || !adminDoc.exists) {
    const byEmail = requesterEmail
      ? await adminDb.collection("users").where("email", "==", requesterEmail).limit(1).get()
      : null;
    if (byEmail && !byEmail.empty) adminDoc = byEmail.docs[0];
  }
  if (!adminDoc?.exists || !adminDoc.data()?.isAdmin) return null;
  return adminDoc;
}

async function toggleVerification(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString();
  const nextValue = formData.get("nextValue") === "true";
  if (!email) return;
  if (!(await getAdminDoc())) return;
  const targetSnap = await adminDb.collection("users").doc(email).get();
  if (!targetSnap.exists) return;
  await adminDb.collection("users").doc(email).update({ isVerified: nextValue });
  revalidatePath("/admin");
}

async function deleteFeedback(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  if (!(await getAdminDoc())) return;
  await adminDb.collection("feedback").doc(id).delete();
  revalidatePath("/admin");
}

async function deleteBug(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  if (!(await getAdminDoc())) return;
  await adminDb.collection("bugs").doc(id).delete();
  revalidatePath("/admin");
}

async function deleteConnect(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  if (!(await getAdminDoc())) return;
  await adminDb.collection("connect").doc(id).delete();
  revalidatePath("/admin");
}

async function deleteChatLog(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  if (!(await getAdminDoc())) return;
  await adminDb.collection("generate").doc(id).delete();
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const adminDoc = await getAdminDoc();
  if (!adminDoc) redirect("/");

  const signedInAs = adminDoc.data()?.email ?? adminDoc.id;

  const userSnap = await adminDb.collection("users").get();
  const users: UserRecord[] = userSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, email: data.email ?? d.id, phone: data.phone, profileImageUrl: data.profileImageUrl };
  });

  const connectSnap = await adminDb.collection("connect").orderBy("time", "desc").limit(50).get();
  const connectEntries: ConnectEntry[] = connectSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, email: data.email, name: data.name, message: data.message, time: data.time,
      ip: data.ip, userEmail: data.userEmail, userName: data.userName, userImage: data.userImage,
    };
  });

  const feedbackSnap = await adminDb.collection("feedback").orderBy("time", "desc").limit(50).get();
  const feedbackEntries: FeedbackEntry[] = feedbackSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, email: data.email, feedback: data.feedback, time: data.time,
      ip: data.ip, userEmail: data.userEmail, userName: data.userName, userImage: data.userImage,
    };
  });

  const bugSnap = await adminDb.collection("bugs").orderBy("time", "desc").limit(50).get();
  const bugEntries: BugEntry[] = bugSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, email: data.email, bugs: data.bugs, time: data.time,
      ip: data.ip, userEmail: data.userEmail, userName: data.userName, userImage: data.userImage,
    };
  });

  // Terminal AI chats live in the existing `generate` collection (prompt +
  // the extension's response), now enriched with IP/identity by /api/audit.
  const chatSnap = await adminDb.collection("generate").orderBy("createdAt", "desc").limit(100).get();
  const chatLogs: ChatLogEntry[] = chatSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, prompt: data.prompt, response: data.response, error: data.error,
      createdAt: data.createdAt,
      ip: data.ip, userEmail: data.userEmail, userName: data.userName, userImage: data.userImage,
    };
  });

  const fmt = (t?: FirebaseFirestore.Timestamp) =>
    t ? t.toDate().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className={styles.container}>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statCount}>{users.length}</span>
          <span className={styles.statLabel}>Users</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCount}>{connectEntries.length}</span>
          <span className={styles.statLabel}>Messages</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCount}>{feedbackEntries.length}</span>
          <span className={styles.statLabel}>Feedback</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCount}>{bugEntries.length}</span>
          <span className={styles.statLabel}>Bug Reports</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCount}>{chatLogs.length}</span>
          <span className={styles.statLabel}>Terminal Chats</span>
        </div>
      </div>

      {/* Users */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <UsersIcon />
          <h2 className={styles.sectionTitle}>Users</h2>
          <span className={styles.countBadge}>{users.length}</span>
          <span className={styles.adminMeta}>signed in as {signedInAs}</span>
        </div>
        <div className={styles.itemList}>
          {users.map((u) => {
            const nextValue = !(u.isVerified ?? false);
            const details = [u.name, u.occupation, u.employer, u.phone].filter(Boolean).join(" · ");
            return (
              <div key={u.id} className={styles.userCard}>
                <Image
                  src={u.profileImageUrl ?? DefaultAvatar}
                  alt={u.email ?? u.id}
                  width={44}
                  height={44}
                  className={styles.avatar}
                  unoptimized
                />
                <div className={styles.userInfo}>
                  <span className={styles.userEmail}>{u.email ?? u.id}</span>
                  {details && <span className={styles.userDetails}>{details}</span>}
                </div>
                <div className={styles.userActions}>
                  <form action={toggleVerification}>
                    <input type="hidden" name="email" value={u.id} />
                    <input type="hidden" name="nextValue" value={nextValue ? "true" : "false"} />
                    <button type="submit" className={styles.verifyBtn} title={nextValue ? "Mark verified" : "Mark unverified"}>
                      {u.isVerified
                        ? <Image src={VerifiedLabel} alt="Verified" width={22} height={22} className={styles.badge} />
                        : <span className={styles.unverified}>✕</span>
                      }
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <MessageIcon />
          <h2 className={styles.sectionTitle}>Messages</h2>
          <span className={styles.countBadge}>{connectEntries.length}</span>
        </div>
        <div className={styles.itemList}>
          {connectEntries.length === 0 && <p className={styles.emptyState}>No messages yet.</p>}
          {connectEntries.map((c) => (
            <div key={c.id} className={styles.entryCard}>
              <div className={styles.entryTop}>
                <span className={styles.entrySender}>{c.name ?? "Anonymous"}</span>
                <span className={styles.entryEmail}>{c.email ?? ""}</span>
                {c.ip && <span className={styles.auditIp}>{c.ip}</span>}
                <span className={styles.entryTime}>{fmt(c.time)}</span>
                <form action={deleteConnect}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className={styles.deleteBtn} title="Delete message"><TrashIcon /></button>
                </form>
              </div>
              {c.message && <p className={styles.entryBody}>{c.message}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <FeedbackIcon />
          <h2 className={styles.sectionTitle}>Feedback</h2>
          <span className={styles.countBadge}>{feedbackEntries.length}</span>
        </div>
        <div className={styles.itemList}>
          {feedbackEntries.length === 0 && <p className={styles.emptyState}>No feedback yet.</p>}
          {feedbackEntries.map((f) => (
            <div key={f.id} className={styles.entryCard}>
              <div className={styles.entryTop}>
                <span className={styles.entrySender}>{f.email ?? "Anonymous"}</span>
                {f.ip && <span className={styles.auditIp}>{f.ip}</span>}
                <span className={styles.entryTime}>{fmt(f.time)}</span>
                <form action={deleteFeedback}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className={styles.deleteBtn} title="Delete feedback"><TrashIcon /></button>
                </form>
              </div>
              {f.feedback && <p className={styles.entryBody}>{f.feedback}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Bug Reports */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <BugIcon />
          <h2 className={styles.sectionTitle}>Bug Reports</h2>
          <span className={styles.countBadge}>{bugEntries.length}</span>
        </div>
        <div className={styles.itemList}>
          {bugEntries.length === 0 && <p className={styles.emptyState}>No bug reports yet.</p>}
          {bugEntries.map((b) => (
            <div key={b.id} className={styles.entryCard}>
              <div className={styles.entryTop}>
                <span className={styles.entrySender}>{b.email ?? "Anonymous"}</span>
                {b.ip && <span className={styles.auditIp}>{b.ip}</span>}
                <span className={styles.entryTime}>{fmt(b.time)}</span>
                <form action={deleteBug}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className={styles.deleteBtn} title="Delete bug report"><TrashIcon /></button>
                </form>
              </div>
              {b.bugs && <p className={styles.entryBody}>{b.bugs}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Chats — audit log of the home-page chatbot's /ask usage */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <TerminalIcon />
          <h2 className={styles.sectionTitle}>Terminal Chats</h2>
          <span className={styles.countBadge}>{chatLogs.length}</span>
        </div>
        <div className={styles.itemList}>
          {chatLogs.length === 0 && <p className={styles.emptyState}>No chats logged yet.</p>}
          {chatLogs.map((c) => (
            <div key={c.id} className={styles.entryCard}>
              <div className={styles.entryTop}>
                <AuditIdentity ip={c.ip} userEmail={c.userEmail} userImage={c.userImage} />
                <span className={styles.entryTime}>{fmt(c.createdAt)}</span>
                <form action={deleteChatLog}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className={styles.deleteBtn} title="Delete chat log"><TrashIcon /></button>
                </form>
              </div>
              {c.prompt && (
                <p className={styles.chatQ}><span className={styles.chatLabel}>Asked</span>{c.prompt}</p>
              )}
              {c.response && (
                <p className={styles.chatA}><span className={styles.chatLabel}>Reply</span>{c.response}</p>
              )}
              {c.error && (
                <p className={styles.chatA}><span className={styles.chatLabel}>Error</span>{c.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
