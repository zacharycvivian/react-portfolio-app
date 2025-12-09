import { initFirestore } from "@auth/firebase-adapter";
import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const credential = admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
});

const app = admin.apps[0] ?? admin.initializeApp({ credential });

const adminDb = initFirestore({ credential });

const adminAuth = admin.auth(app);

export { adminDb, adminAuth };
