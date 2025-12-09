import { FirestoreAdapter } from "@auth/firebase-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminAuth, adminDb } from "./firebase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      try {
        if (!account?.providerAccountId || !user?.email) {
          return false;
        }

        // Ensure a single user doc per email, prefer an existing one
        let userId: string | undefined = (user as any).id;
        if (!userId) {
          const existingUserSnap = await adminDb
            .collection("users")
            .where("email", "==", user.email)
            .limit(1)
            .get();
          if (!existingUserSnap.empty) {
            userId = existingUserSnap.docs[0].id;
          }
        }

        // If no user doc, create one keyed by providerAccountId to align with Google UID
        if (!userId) {
          userId = account.providerAccountId;
          await adminDb
            .collection("users")
            .doc(userId)
            .set({
              email: user.email,
              name: user.name ?? "",
              profileImageUrl: (user as any).image ?? user.image ?? "",
              isVerified: false,
            });
        }

        // Upsert account row linking to the resolved userId
        const accountData = {
          provider: account.provider,
          type: account.type,
          providerAccountId: account.providerAccountId,
          userId,
          access_token: (account as any).access_token,
          refresh_token: (account as any).refresh_token,
          expires_at: (account as any).expires_at,
          id_token: (account as any).id_token,
          scope: (account as any).scope,
          token_type: (account as any).token_type,
          session_state: (account as any).session_state,
        };

        const existingAccountSnap = await adminDb
          .collection("accounts")
          .where("provider", "==", account.provider)
          .where("providerAccountId", "==", account.providerAccountId)
          .limit(1)
          .get();

        if (existingAccountSnap.empty) {
          await adminDb.collection("accounts").add(accountData);
        } else {
          await existingAccountSnap.docs[0].ref.set(accountData, { merge: true });
        }

        // Ensure NextAuth user id aligns with the Firestore user doc id
        (user as any).id = userId;
      } catch (err) {
        console.error("signIn linking failed", err);
      }
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        if (token.sub) {
          session.user.id = token.sub;

          const firebaseToken = await adminAuth.createCustomToken(token.sub);
          session.firebaseToken = firebaseToken;
        }
      }

      return session;
    },

    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  allowDangerousEmailAccountLinking: false,
  adapter: FirestoreAdapter(adminDb),
} as NextAuthOptions;

export default authOptions;
