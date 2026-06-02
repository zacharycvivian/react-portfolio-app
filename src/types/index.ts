/**
 * Shared TypeScript interfaces and types used across the application.
 * Import from "@/types" throughout the codebase.
 */

// ─── Gallery ────────────────────────────────────────────────────────────────

/** EXIF and file-level metadata extracted from uploaded photos. */
export interface PhotoMetadata {
  fileSize?: number;
  width?: number;
  height?: number;
  /** ISO 8601 string from EXIF DateTimeOriginal */
  dateTaken?: string;
  camera?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

/** A single photo document stored in Firestore. */
export interface Photo {
  id: string;
  url: string;
  storagePath: string;
  caption?: string;
  createdAt: FirestoreTimestamp;
  likedBy?: string[];
  metadata?: PhotoMetadata;
  hideMetadata?: boolean;
  commentsEnabled?: boolean;
  uploaderName?: string;
  uploaderImage?: string;
}

/** A comment on a photo, stored in the photo's `comments` subcollection. */
export interface PhotoComment {
  id: string;
  text: string;
  email: string;
  name: string;
  userImage?: string;
  occupation?: string;
  employer?: string;
  createdAt: FirestoreTimestamp;
  likedBy?: string[];
}

/** Detail record for each user who liked a photo. */
export interface LikerDetail {
  email: string;
  name: string;
  image: string;
}

// ─── Testimonials ────────────────────────────────────────────────────────────

/** A testimonial document stored in Firestore. */
export interface Testimonial {
  id: string;
  name: string;
  email: string;
  stars: number;
  review: string;
  time: FirestoreTimestamp | null;
  userImageUrl: string;
  occupation: string;
  employer: string;
  isVerified: boolean;
}

// ─── Notifications ───────────────────────────────────────────────────────────

/** The type of activity that triggered a notification. */
export type NotificationType =
  | "feedback"
  | "bug"
  | "message"
  | "comment"
  | "like"
  | "testimonial";

/**
 * A single notification item from the `notifications` Firestore collection.
 * `read` is tracked on the document itself so read-state is authoritative and
 * synced across devices (rather than per-browser localStorage).
 */
export interface NotifItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  time: Date;
  read: boolean;
}

// ─── Auth / User ─────────────────────────────────────────────────────────────

/**
 * The shape of session.user when using next-auth with our custom
 * Google provider. The `id` field is added via the NextAuth callbacks.
 */
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Minimal type for Firestore Timestamps used client-side.
 * Matches both `firebase/firestore` Timestamp and the plain object
 * shape returned by the Firebase Admin SDK.
 */
export interface FirestoreTimestamp {
  toDate: () => Date;
  seconds?: number;
  nanoseconds?: number;
}
