import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import { adminDb } from "@/../firebase-admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import styles from "./users.module.css";
import VerifiedLabel from "@/../public/verified.png";
import DefaultAvatar from "@/../public/defaultavatar.jpg";

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

type FeedbackEntry = {
  id: string;
  email?: string;
  feedback?: string;
  time?: FirebaseFirestore.Timestamp;
};

type BugEntry = {
  id: string;
  email?: string;
  bugs?: string;
  time?: FirebaseFirestore.Timestamp;
};

async function toggleVerification(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString();
  const nextValue = formData.get("nextValue") === "true";
  if (!email) return;
  const session = await getServerSession(authOptions);
  const requesterId = (session?.user as any)?.id;
  const requesterEmail = session?.user?.email?.toLowerCase();
  if (!requesterId && !requesterEmail) return;
  let adminDoc =
    requesterId && (await adminDb.collection("users").doc(requesterId).get());
  if (!adminDoc || !adminDoc.exists) {
    const byEmail = requesterEmail
      ? await adminDb
          .collection("users")
          .where("email", "==", requesterEmail)
          .limit(1)
          .get()
      : null;
    if (byEmail && !byEmail.empty) {
      adminDoc = byEmail.docs[0];
    }
  }
  if (!adminDoc.exists || !adminDoc.data()?.isAdmin) return;
  const targetDoc = adminDb.collection("users").doc(email);
  const targetSnap = await targetDoc.get();
  if (!targetSnap.exists) return;
  await targetDoc.update({ isVerified: nextValue });
  revalidatePath("/admin");
}

async function deleteFeedback(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  const session = await getServerSession(authOptions);
  const requesterId = (session?.user as any)?.id;
  const requesterEmail = session?.user?.email?.toLowerCase();
  if (!requesterId && !requesterEmail) return;
  let adminDoc =
    requesterId && (await adminDb.collection("users").doc(requesterId).get());
  if (!adminDoc || !adminDoc.exists) {
    const byEmail = requesterEmail
      ? await adminDb
          .collection("users")
          .where("email", "==", requesterEmail)
          .limit(1)
          .get()
      : null;
    if (byEmail && !byEmail.empty) {
      adminDoc = byEmail.docs[0];
    }
  }
  if (!adminDoc.exists || !adminDoc.data()?.isAdmin) return;
  await adminDb.collection("feedback").doc(id).delete();
  revalidatePath("/admin");
}

async function deleteBug(formData: FormData) {
  "use server";
  const id = formData.get("id")?.toString();
  if (!id) return;
  const session = await getServerSession(authOptions);
  const requesterId = (session?.user as any)?.id;
  const requesterEmail = session?.user?.email?.toLowerCase();
  if (!requesterId && !requesterEmail) return;
  let adminDoc =
    requesterId && (await adminDb.collection("users").doc(requesterId).get());
  if (!adminDoc || !adminDoc.exists) {
    const byEmail = requesterEmail
      ? await adminDb
          .collection("users")
          .where("email", "==", requesterEmail)
          .limit(1)
          .get()
      : null;
    if (byEmail && !byEmail.empty) {
      adminDoc = byEmail.docs[0];
    }
  }
  if (!adminDoc.exists || !adminDoc.data()?.isAdmin) return;
  await adminDb.collection("bugs").doc(id).delete();
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const requesterId = (session?.user as any)?.id;
  const requesterEmail = session?.user?.email ?? undefined;
  if (!requesterId && !requesterEmail) redirect("/");

  let adminDoc =
    requesterId && (await adminDb.collection("users").doc(requesterId).get());
  if (!adminDoc || !adminDoc.exists) {
    const byEmail = requesterEmail
      ? await adminDb
          .collection("users")
          .where("email", "==", requesterEmail)
          .limit(1)
          .get()
      : null;
    if (byEmail && !byEmail.empty) {
      adminDoc = byEmail.docs[0];
    }
  }
  if (!adminDoc || !adminDoc.exists || !adminDoc.data()?.isAdmin) redirect("/");

  const signedInAs = requesterEmail ?? requesterId ?? "";

  const userSnap = await adminDb.collection("users").get();
  const users: UserRecord[] = userSnap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      ...data,
      email: data.email ?? doc.id,
      phone: data.phone,
      profileImageUrl: data.profileImageUrl,
    };
  });

  const feedbackSnap = await adminDb
    .collection("feedback")
    .orderBy("time", "desc")
    .limit(50)
    .get();
  const feedbackEntries: FeedbackEntry[] = feedbackSnap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      email: data.email,
      feedback: data.feedback,
      time: data.time,
    };
  });

  const bugSnap = await adminDb
    .collection("bugs")
    .orderBy("time", "desc")
    .limit(50)
    .get();
  const bugEntries: BugEntry[] = bugSnap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      email: data.email,
      bugs: data.bugs,
      time: data.time,
    };
  });

  const formatTime = (t?: FirebaseFirestore.Timestamp) =>
    t ? t.toDate().toLocaleString() : "-";

  return (
    <div className={styles.container}>
      <div className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Manage Users</h1>
          <p className={styles.subtitle}>Signed in as {signedInAs}</p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th align="left">User</th>
                <th align="left">Name</th>
                <th align="left">Occupation</th>
                <th align="left">Employer</th>
                <th align="left">Phone</th>
                <th align="left">Verified</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const nextValue = !(u.isVerified ?? false);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <Image
                          src={u.profileImageUrl ?? DefaultAvatar}
                          alt={u.email ?? u.id}
                          width={36}
                          height={36}
                          className={styles.avatar}
                        />
                        <span className={styles.userEmail}>{u.email ?? u.id}</span>
                      </div>
                    </td>
                    <td className={styles.nameCell}>{u.name ?? "-"}</td>
                    <td>{u.occupation ?? "-"}</td>
                    <td>{u.employer ?? "-"}</td>
                    <td>{u.phone ?? "-"}</td>
                    <td>
                      <form action={toggleVerification} className={styles.verifyForm}>
                        <input type="hidden" name="email" value={u.id} />
                        <input type="hidden" name="nextValue" value={nextValue ? "true" : "false"} />
                        <button type="submit" className={styles.iconButton} title={nextValue ? "Mark verified" : "Mark unverified"}>
                          {u.isVerified ? (
                            <Image src={VerifiedLabel} alt="Verified" width={20} height={20} className={styles.badge} />
                          ) : (
                            <span className={styles.unverified}>✕</span>
                          )}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h2 className={styles.sectionTitle}>Feedback</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th align="left">Email</th>
                <th align="left">Feedback</th>
                <th align="right" className={styles.timeHeader}>Time</th>
                <th align="right" className={styles.actionHeader}></th>
              </tr>
            </thead>
            <tbody>
              {feedbackEntries.map((f) => (
                <tr key={f.id}>
                  <td className={styles.emailCell}>{f.email ?? "-"}</td>
                  <td className={styles.wideCell}>{f.feedback ?? "-"}</td>
                  <td align="right" className={styles.timeCell}>{formatTime(f.time)}</td>
                  <td className={styles.actionCell}>
                    <form action={deleteFeedback} className={styles.verifyForm}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" className={styles.iconButton} title="Delete feedback">
                        🗑
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {feedbackEntries.length === 0 && (
                <tr>
                  <td colSpan={4}>No feedback entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h2 className={styles.sectionTitle}>Bug Reports</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th align="left">Email</th>
                <th align="left">Bug</th>
                <th align="right" className={styles.timeHeader}>Time</th>
                <th align="right" className={styles.actionHeader}></th>
              </tr>
            </thead>
            <tbody>
              {bugEntries.map((b) => (
                <tr key={b.id}>
                  <td className={styles.emailCell}>{b.email ?? "-"}</td>
                  <td className={styles.wideCell}>{b.bugs ?? "-"}</td>
                  <td align="right" className={styles.timeCell}>{formatTime(b.time)}</td>
                  <td className={styles.actionCell}>
                    <form action={deleteBug} className={styles.verifyForm}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className={styles.iconButton} title="Delete bug report">
                        🗑
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {bugEntries.length === 0 && (
                <tr>
                  <td colSpan={4}>No bug reports yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
