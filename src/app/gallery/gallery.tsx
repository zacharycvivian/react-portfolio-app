"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteField,
  getDocs, where, limit,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/../firebase";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./gallery.module.css";
import { loadBannedWords, filterProfanity } from "@/lib/profanity";
import type {
  Photo,
  PhotoComment,
  PhotoMetadata,
  FirestoreTimestamp,
} from "@/types";

const ADMIN_EMAIL = "zacharycvivian@gmail.com";

const fadeIn = {
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  hidden: { opacity: 0, scale: 0.94, y: 20 },
};

/** Placeholder tiles shown while the photo grid streams in. */
function SkeletonGrid() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={styles.skeletonTile}>
          <div className={styles.polaroidInner}>
            <div
              className={styles.developing}
              style={{ "--dev-delay": `${(i % 4) * 0.18}s` } as React.CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoCard({ photo, isAdmin, onSelect, onDelete, animDelay = 0, rotation = 0 }: {
  photo: Photo;
  isAdmin: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  animDelay?: number;
  rotation?: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  // The film-develop reveal waits until the tile is actually scrolled into
  // view, so photos develop one-by-one as you move down the wall instead of all
  // at once on load (images below the fold lazy-load, then develop on reveal).
  const developed = imgLoaded && inView;
  return (
    <motion.div
      className={styles.photoCard}
      onClick={onSelect}
      // Resting state is tilted + upscaled so the polaroids clearly overlap;
      // hovering straightens, enlarges and lifts the one photo above the rest.
      initial={{ opacity: 0, scale: 0.88, y: 14, rotate: rotation }}
      whileInView={{ opacity: 1, scale: 1.08, y: 0, rotate: rotation }}
      whileHover={{
        scale: 1.18,
        rotate: 0,
        y: -6,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      }}
      viewport={{ once: true, amount: 0.05 }}
      onViewportEnter={() => setInView(true)}
      transition={{ delay: animDelay, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      <div className={styles.polaroidInner}>
        {!developed && <div className={styles.developing} />}
        <Image
          src={photo.url}
          alt={photo.caption || "Gallery photo"}
          fill
          className={`${styles.image} ${developed ? styles.developed : ""}`}
          sizes="(max-width: 500px) 50vw, 33vw"
          onLoad={() => setImgLoaded(true)}
        />
        <div className={styles.photoOverlay}>
          {!!photo.likedBy?.length && (
            <span className={styles.overlayLikeCount}>♥ {photo.likedBy.length}</span>
          )}
        </div>
      </div>
      {isAdmin && (
        <button className={styles.deleteButton} onClick={onDelete} aria-label="Delete photo">
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
            <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

function ShimmerAvatar({ src, alt, size }: { src: string; alt: string; size: "lg" | "sm" }) {
  const [loaded, setLoaded] = useState(false);
  const dim = size === "lg" ? 34 : 26;
  return (
    <div className={size === "lg" ? styles.avatarWrapperLg : styles.avatarWrapperSm}>
      {!loaded && <div className={styles.avatarShimmer} />}
      <Image
        src={src} alt={alt} width={dim} height={dim}
        className={size === "lg" ? styles.uploaderAvatar : styles.commentAvatar}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

/** Photo (`Photo`), comment (`PhotoComment`) and metadata (`PhotoMetadata`)
 * shapes are shared across the app — see `src/types/index.ts`. */

/** Subset of EXIF fields we read off an uploaded file. */
interface ExifData {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: Date | string;
  ExifImageWidth?: number;
  ExifImageHeight?: number;
}

/** GPS coordinates extracted from EXIF. */
interface GpsData {
  latitude?: number;
  longitude?: number;
}

// Extract EXIF + file metadata from a File object
async function extractMetadata(file: File): Promise<PhotoMetadata> {
  const meta: PhotoMetadata = { fileSize: file.size };

  try {
    const exifr = (await import("exifr")).default;

    const exif = (await exifr.parse(file, {
      pick: ["Make", "Model", "DateTimeOriginal", "ExifImageWidth", "ExifImageHeight"],
    })) as ExifData | undefined;

    if (exif) {
      if (exif.Make || exif.Model)
        meta.camera = [exif.Make, exif.Model].filter(Boolean).join(" ");
      if (exif.DateTimeOriginal)
        meta.dateTaken = exif.DateTimeOriginal instanceof Date
          ? exif.DateTimeOriginal.toISOString()
          : String(exif.DateTimeOriginal);
      if (exif.ExifImageWidth)  meta.width  = exif.ExifImageWidth;
      if (exif.ExifImageHeight) meta.height = exif.ExifImageHeight;
    }

    const gps = (await exifr.gps(file)) as GpsData | undefined;
    if (gps?.latitude && gps?.longitude) {
      meta.latitude  = gps.latitude;
      meta.longitude = gps.longitude;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${gps.latitude}&lon=${gps.longitude}&zoom=10`
        );
        const geo: { address?: Record<string, string> } = await res.json();
        const { city, town, village, county, state, country } = geo.address ?? {};
        meta.location = [city ?? town ?? village ?? county, state, country]
          .filter(Boolean).join(", ");
      } catch {
        meta.location = `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`;
      }
    }
  } catch {
    // EXIF unavailable — continue with file-level data only
  }

  // Fall back to loading the image for dimensions if EXIF didn't provide them
  if (!meta.width || !meta.height) {
    try {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = url; });
      meta.width  = img.naturalWidth;
      meta.height = img.naturalHeight;
      URL.revokeObjectURL(url);
    } catch {
      // Dimensions are best-effort; ignore if the image can't be decoded.
    }
  }

  return meta;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return (
      date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

function formatTimestamp(ts: FirestoreTimestamp | null | undefined): string {
  if (!ts) return "";
  try {
    const date = ts.toDate();
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  } catch {
    return "";
  }
}

export default function Gallery() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stripMetaOnUpload, setStripMetaOnUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caption editing
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState("");

  // Commenter profile
  const [userProfile, setUserProfile] = useState<{ occupation?: string; employer?: string } | null>(null);

  // Nav button visibility (auto-hide)
  const [navVisible, setNavVisible] = useState(true);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  // Instagram-style double-tap to like: `heartBurst` keys the burst animation.
  const lastTapRef = useRef(0);
  const [heartBurst, setHeartBurst] = useState<number | null>(null);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsUIVisible, setFsUIVisible] = useState(true);
  const fsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lightbox image loading
  const [lightboxImgLoaded, setLightboxImgLoaded] = useState(false);

  // Wheel zoom in fullscreen
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  // Lightbox
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const selectedPhoto = selectedPhotoId
    ? (photos.find(p => p.id === selectedPhotoId) ?? null)
    : null;
  const selectedIndex = selectedPhotoId
    ? photos.findIndex(p => p.id === selectedPhotoId)
    : -1;

  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
      const sorted = [...raw].sort((a, b) => {
        const getMs = (p: Photo) => {
          if (p.metadata?.dateTaken) {
            const ms = new Date(p.metadata.dateTaken).getTime();
            if (!isNaN(ms)) return ms;
          }
          try { return p.createdAt?.toDate?.().getTime() ?? 0; } catch { return 0; }
        };
        return getMs(b) - getMs(a);
      });
      setPhotos(sorted);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPhotoId) { setComments([]); return; }
    const q = query(
      collection(db, "photos", selectedPhotoId, "comments"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PhotoComment)));
    });
  }, [selectedPhotoId]);

  useEffect(() => {
    document.body.style.overflow = (showUploadModal || !!selectedPhotoId) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showUploadModal, selectedPhotoId]);

  // Reset overlays when switching photos
  useEffect(() => { setShowInfo(false); setEditingCaption(false); }, [selectedPhotoId]);

  // Fetch logged-in user's occupation/employer for attaching to comments
  useEffect(() => {
    if (!session?.user?.email) { setUserProfile(null); return; }
    getDocs(query(collection(db, "users"), where("email", "==", session.user.email), limit(1)))
      .then(snap => {
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUserProfile({ occupation: d.occupation, employer: d.employer });
        }
      })
      .catch(() => {});
  }, [session?.user?.email]);

  const showFsUI = () => {
    setFsUIVisible(true);
    if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
    fsTimerRef.current = setTimeout(() => setFsUIVisible(false), 3000);
  };

  const showNavBriefly = () => {
    setNavVisible(true);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setNavVisible(false), 3000);
  };

  // Enter fullscreen: show UI briefly then auto-hide
  useEffect(() => {
    if (!isFullscreen) {
      if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
      setFsUIVisible(true);
      return;
    }
    showFsUI();
    return () => { if (fsTimerRef.current) clearTimeout(fsTimerRef.current); };
  }, [isFullscreen]);

  // Reset fullscreen / shimmer / zoom when photo changes
  useEffect(() => {
    if (!selectedPhotoId) setIsFullscreen(false);
    setLightboxImgLoaded(false);
    setZoom(1);
  }, [selectedPhotoId]);

  useEffect(() => { if (!isFullscreen) setZoom(1); }, [isFullscreen]);

  // Declared before the keydown effect below so the effect can list it as a
  // dependency; memoised so its identity only changes with photos/selection.
  const navigate = useCallback((dir: 1 | -1) => {
    if (!photos.length) return;
    const next = (selectedIndex + dir + photos.length) % photos.length;
    setSelectedPhotoId(photos[next].id);
    setCommentText("");
  }, [photos, selectedIndex]);

  useEffect(() => {
    if (!selectedPhotoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (isFullscreen) setIsFullscreen(false); else setSelectedPhotoId(null); }
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft")  navigate(-1);
      if (e.key === "i" || e.key === "I") setShowInfo(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPhotoId, isFullscreen, navigate]);

  const handleLike = async () => {
    if (!session?.user?.email || !selectedPhoto) return;
    const hasLiked = selectedPhoto.likedBy?.includes(session.user.email);
    await updateDoc(doc(db, "photos", selectedPhoto.id), {
      likedBy: hasLiked
        ? arrayRemove(session.user.email)
        : arrayUnion(session.user.email),
    });
    if (!hasLiked && !isAdmin) {
      await addDoc(collection(db, "notifications"), {
        type: "like",
        title: "New like on a photo",
        body: `${session.user.name ?? session.user.email} liked "${selectedPhoto.caption ?? "your photo"}"`,
        time: serverTimestamp(),
        read: false,
      });
    }
  };

  // Double-tap/double-click on the photo: burst the heart and like (never
  // unlike — matches Instagram). Signed-out users still get the burst as
  // feedback, just no write.
  const doubleTapLike = () => {
    setHeartBurst(n => (n ?? 0) + 1);
    if (!session?.user?.email || !selectedPhoto) return;
    if (!selectedPhoto.likedBy?.includes(session.user.email)) void handleLike();
  };

  // Let the burst play, then unmount it (AnimatePresence animates the exit).
  useEffect(() => {
    if (heartBurst == null) return;
    const t = setTimeout(() => setHeartBurst(null), 750);
    return () => clearTimeout(t);
  }, [heartBurst]);

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user?.email || !selectedPhoto) return;
    const email = session.user.email;
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const hasLiked = comment.likedBy?.includes(email);
    await updateDoc(doc(db, "photos", selectedPhoto.id, "comments", commentId), {
      likedBy: hasLiked ? arrayRemove(email) : arrayUnion(email),
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !session?.user?.email || !selectedPhoto) return;
    setSubmittingComment(true);
    const words = await loadBannedWords();
    const { filtered, hadProfanity } = filterProfanity(commentText.trim(), words);
    if (hadProfanity) {
      setProfanityWarning(true);
      setTimeout(() => setProfanityWarning(false), 4000);
    }
    await addDoc(collection(db, "photos", selectedPhoto.id, "comments"), {
      text: filtered,
      email: session.user.email,
      name: session.user.name ?? "Anonymous",
      userImage: session.user.image ?? "",
      occupation: userProfile?.occupation ?? "",
      employer: userProfile?.employer ?? "",
      createdAt: serverTimestamp(),
    });
    if (!isAdmin) {
      await addDoc(collection(db, "notifications"), {
        type: "comment",
        title: "New comment on a photo",
        body: `${session.user.name ?? session.user.email}: ${filtered.slice(0, 80)}`,
        time: serverTimestamp(),
        read: false,
      });
    }
    setCommentText("");
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPhoto) return;
    await deleteDoc(doc(db, "photos", selectedPhoto.id, "comments", commentId));
  };

  const handleShare = async (photo: Photo) => {
    const shareData = {
      title: photo.caption ?? "Gallery Photo",
      text: photo.caption ?? "Check out this photo!",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed the share sheet — fall back to copying the link.
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (photo: Photo) => {
    const filename = photo.caption ? `${photo.caption}.jpg` : `photo-${photo.id}.jpg`;
    const link = document.createElement("a");
    link.href = `/api/download?url=${encodeURIComponent(photo.url)}&filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this photo?")) return;
    if (selectedPhotoId === photo.id) setSelectedPhotoId(null);
    await deleteDoc(doc(db, "photos", photo.id));
  };

  const handleSaveCaption = async () => {
    if (!selectedPhoto) return;
    await updateDoc(doc(db, "photos", selectedPhoto.id), { caption: editCaptionText.trim() });
    setEditingCaption(false);
  };

  const handleToggleComments = async () => {
    if (!selectedPhoto) return;
    await updateDoc(doc(db, "photos", selectedPhoto.id), {
      commentsEnabled: selectedPhoto.commentsEnabled === false ? true : false,
    });
  };

  const handleStripMetadata = async () => {
    if (!selectedPhoto) return;
    if (!window.confirm("Strip all metadata from this photo? This cannot be undone.")) return;
    await updateDoc(doc(db, "photos", selectedPhoto.id), { metadata: deleteField(), hideMetadata: deleteField() });
  };

  const handleToggleHideMetadata = async () => {
    if (!selectedPhoto) return;
    await updateDoc(doc(db, "photos", selectedPhoto.id), { hideMetadata: !selectedPhoto.hideMetadata });
  };

  const handleUpload = async () => {
    if (!file) { setUploadError("Please select an image first."); return; }
    setUploading(true);
    setUploadError(null);
    setProgress(0);

    const metadata = stripMetaOnUpload ? {} : await extractMetadata(file);

    const storagePath = `gallery/${Date.now()}_${file.name}`;
    const uploadTask = uploadBytesResumable(ref(storage, storagePath), file);
    uploadTask.on(
      "state_changed",
      (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      (err) => { setUploadError(err.message); setUploading(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "photos"), {
          url, storagePath, caption,
          createdAt: serverTimestamp(),
          uploadedBy: session?.user?.email,
          uploaderName: session?.user?.name ?? "",
          uploaderImage: session?.user?.image ?? "",
          likedBy: [],
          metadata,
        });
        setFile(null); setCaption(""); setProgress(0); setStripMetaOnUpload(false);
        setUploading(false); setShowUploadModal(false);
      }
    );
  };

  const handleCancelUpload = () => {
    setFile(null); setCaption(""); setUploadError(null);
    setProgress(0); setStripMetaOnUpload(false); setShowUploadModal(false);
  };

  const hasLiked  = selectedPhoto?.likedBy?.includes(session?.user?.email ?? "");
  const likeCount = selectedPhoto?.likedBy?.length ?? 0;
  const meta      = selectedPhoto?.metadata;
  const hasInfo   = !selectedPhoto?.hideMetadata && meta && (meta.location || meta.dateTaken || meta.camera || meta.width || meta.fileSize);

  return (
    <div className={styles.container}>
      <motion.p
        className={styles.galleryIntro}
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
      >
        A collection of photos from my travels and work experiences over the years.
        {!session && " Sign in to like and leave a comment!"}
      </motion.p>

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div className={styles.grid}>
          {photos.map((photo, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const animDelay = Math.min((row + col) * 0.05, 0.7);
            // Varied tilt so the grid reads like a wall of pinned polaroids.
            const rotation = [-6, 4.5, -2.5, 5.5, -4, 3][i % 6];
            return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isAdmin={isAdmin}
              animDelay={animDelay}
              rotation={rotation}
              onSelect={() => { setSelectedPhotoId(photo.id); setCommentText(""); }}
              onDelete={(e) => handleDelete(photo, e)}
            />
            );
          })}
          {isAdmin && (
            <div className={styles.addTile} onClick={() => setShowUploadModal(true)} role="button" aria-label="Upload photo">
              <span className={styles.addTileIcon}>+</span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
      {selectedPhoto && (
        <motion.div
          className={styles.lightboxBackdrop}
          style={isFullscreen ? { cursor: fsUIVisible ? "default" : "none" } : undefined}
          onClick={() => isFullscreen ? showFsUI() : setSelectedPhotoId(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={`${styles.lightbox} ${isFullscreen ? styles.lightboxFull : ""}`}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >

            {/* Image pane */}
            <div
              className={styles.lightboxImageSection}
              onMouseMove={() => { showNavBriefly(); if (isFullscreen) showFsUI(); }}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; showNavBriefly(); if (isFullscreen) showFsUI(); }}
              onDoubleClick={doubleTapLike}
              onTouchEnd={e => {
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                  navigate(diff > 0 ? 1 : -1);
                  return;
                }
                // A near-stationary tap: check for a double tap (≤300ms apart).
                if (Math.abs(diff) < 10) {
                  if (e.timeStamp - lastTapRef.current < 300) {
                    doubleTapLike();
                    lastTapRef.current = 0;
                  } else {
                    lastTapRef.current = e.timeStamp;
                  }
                }
              }}
              onWheel={isFullscreen ? (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.2 : 0.2;
                setZoom(z => Math.max(1, Math.min(5, z + delta)));
                const rect = e.currentTarget.getBoundingClientRect();
                setZoomOrigin({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              } : undefined}
            >
              <div className={styles.lightboxImageWrapper}>
                {!lightboxImgLoaded && <div className={styles.lightboxShimmer} />}
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "Gallery photo"}
                  fill
                  className={styles.lightboxImage}
                  style={isFullscreen && zoom > 1 ? {
                    transform: `scale(${zoom})`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: "transform 0.12s ease-out",
                  } : undefined}
                  onLoad={() => setLightboxImgLoaded(true)}
                />
                <AnimatePresence>
                  {heartBurst != null && (
                    <motion.span
                      key={heartBurst}
                      className={styles.heartBurst}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0.4, 1.25, 1], opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.3 } }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      aria-hidden="true"
                    >
                      ♥
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div
                className={styles.lightboxTopBar}
                style={isFullscreen ? { opacity: fsUIVisible ? 1 : 0, transition: "opacity 0.4s ease", pointerEvents: fsUIVisible ? "auto" : "none" } : undefined}
              >
                <button className={styles.downloadBtn} onClick={() => handleDownload(selectedPhoto)} title="Download">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <path d="m7 10l5 5l5-5"/>
                  </svg>
                </button>
                <div className={styles.lightboxTopRight}>
                  <button
                    className={styles.shareBtn}
                    onClick={() => handleShare(selectedPhoto)}
                    title="Share"
                  >
                    {copied ? (
                      <span className={styles.copiedText}>Copied!</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v13m4-9l-4-4l-4 4m-4 6v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      </svg>
                    )}
                  </button>
                  {hasInfo && (
                    <button
                      className={`${styles.infoBtn} ${showInfo ? styles.infoBtnActive : ""}`}
                      onClick={() => setShowInfo(v => !v)}
                      title="Photo info (i)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4m0-4h.01"/>
                      </svg>
                    </button>
                  )}
                  {!isFullscreen && (
                    <button className={styles.closeBtn} onClick={() => setIsFullscreen(true)} title="Enter fullscreen">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                        <rect width="10" height="8" x="7" y="8" rx="1"/>
                      </svg>
                    </button>
                  )}
                  <button
                    className={styles.closeBtn}
                    onClick={() => isFullscreen ? setIsFullscreen(false) : setSelectedPhotoId(null)}
                    title={isFullscreen ? "Exit fullscreen" : "Close"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Metadata overlay */}
              {showInfo && hasInfo && (
                <div className={styles.infoOverlay}>
                  {meta?.location && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📍</span>
                      {meta.latitude && meta.longitude ? (
                        <a
                          className={styles.infoLink}
                          href={`https://www.google.com/maps?q=${meta.latitude},${meta.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          {meta.location}
                        </a>
                      ) : (
                        <span className={styles.infoValue}>{meta.location}</span>
                      )}
                    </div>
                  )}
                  {meta?.dateTaken && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📅</span>
                      <span className={styles.infoValue}>{formatDate(meta.dateTaken)}</span>
                    </div>
                  )}
                  {meta?.camera && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📷</span>
                      <span className={styles.infoValue}>{meta.camera}</span>
                    </div>
                  )}
                  {meta?.width && meta?.height && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📐</span>
                      <span className={styles.infoValue}>{meta.width} × {meta.height}</span>
                    </div>
                  )}
                  {meta?.fileSize && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>💾</span>
                      <span className={styles.infoValue}>{formatBytes(meta.fileSize)}</span>
                    </div>
                  )}
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    className={`${styles.navBtn} ${styles.navLeft} ${!navVisible ? styles.navBtnHidden : ""}`}
                    style={isFullscreen ? { opacity: fsUIVisible ? undefined : 0, transition: "opacity 0.4s ease", pointerEvents: fsUIVisible ? "auto" : "none" } : undefined}
                    onClick={() => { navigate(-1); showNavBriefly(); }}
                  >‹</button>
                  <button
                    className={`${styles.navBtn} ${styles.navRight} ${!navVisible ? styles.navBtnHidden : ""}`}
                    style={isFullscreen ? { opacity: fsUIVisible ? undefined : 0, transition: "opacity 0.4s ease", pointerEvents: fsUIVisible ? "auto" : "none" } : undefined}
                    onClick={() => { navigate(1); showNavBriefly(); }}
                  >›</button>
                </>
              )}
            </div>

            {/* Side panel */}
            <div className={styles.lightboxPanel} style={isFullscreen ? { display: "none" } : undefined}>
              {(selectedPhoto.uploaderName || selectedPhoto.caption || session?.user?.image) && (
                <div className={styles.uploaderRow}>
                  {(selectedPhoto.uploaderImage ?? session?.user?.image) && (
                    <ShimmerAvatar
                      src={(selectedPhoto.uploaderImage ?? session?.user?.image)!}
                      alt={selectedPhoto.uploaderName ?? session?.user?.name ?? ""}
                      size="lg"
                    />
                  )}
                  <div className={styles.uploaderInfo}>
                    {(selectedPhoto.uploaderName ?? session?.user?.name) && (
                      <span className={styles.uploaderName}>
                        {selectedPhoto.uploaderName ?? session?.user?.name}
                      </span>
                    )}
                    {(selectedPhoto.metadata?.dateTaken || selectedPhoto.createdAt) && (
                      <span className={styles.uploadTimestamp}>
                        {selectedPhoto.metadata?.dateTaken
                          ? formatDate(selectedPhoto.metadata.dateTaken)
                          : formatTimestamp(selectedPhoto.createdAt)}
                      </span>
                    )}
                    {isAdmin && editingCaption ? (
                      <div className={styles.captionEditRow}>
                        <input
                          className={styles.captionInput}
                          value={editCaptionText}
                          onChange={e => setEditCaptionText(e.target.value)}
                          placeholder="Add a caption..."
                          autoFocus
                          onKeyDown={e => { if (e.key === "Enter") handleSaveCaption(); if (e.key === "Escape") setEditingCaption(false); }}
                        />
                        <div className={styles.captionEditBtns}>
                          <button className={styles.captionSaveBtn} onClick={handleSaveCaption}>Save</button>
                          <button className={styles.captionCancelBtn} onClick={() => setEditingCaption(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.captionWithEdit}>
                        {selectedPhoto.caption && (
                          <p className={styles.lightboxCaption}>{selectedPhoto.caption}</p>
                        )}
                        {isAdmin && (
                          <button
                            className={styles.editCaptionBtn}
                            title="Edit caption"
                            onClick={() => { setEditCaptionText(selectedPhoto.caption ?? ""); setEditingCaption(true); }}
                          >✎</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className={styles.adminActions}>
                  <p className={styles.adminActionsTitle}>Admin</p>
                  <div className={styles.adminActRow}>
                    <span className={styles.adminActLabel}>Hide metadata from viewers</span>
                    <button
                      className={`${styles.adminActBtn} ${selectedPhoto.hideMetadata ? styles.adminActBtnActive : ""}`}
                      onClick={handleToggleHideMetadata}
                    >
                      {selectedPhoto.hideMetadata ? "Hidden" : "Visible"}
                    </button>
                  </div>
                  <div className={styles.adminActRow}>
                    <span className={styles.adminActLabel}>Comments</span>
                    <button
                      className={`${styles.adminActBtn} ${selectedPhoto.commentsEnabled === false ? styles.adminActBtnActive : ""}`}
                      onClick={handleToggleComments}
                    >
                      {selectedPhoto.commentsEnabled === false ? "Off" : "On"}
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.likesRow}>
                <button
                  className={`${styles.likeBtn} ${hasLiked ? styles.liked : ""}`}
                  onClick={handleLike}
                  disabled={!session}
                  title={session ? (hasLiked ? "Unlike" : "Like") : "Sign in to like"}
                >
                  {hasLiked ? "♥" : "♡"} {likeCount > 0 ? likeCount : ""}
                </button>
                {!session && <span className={styles.signInHint}>Sign in to like & comment</span>}
              </div>

              <div className={styles.commentsSection}>
                <p className={styles.commentsTitle}>Comments</p>
                <div className={styles.commentsList}>
                  {comments.length === 0 ? (
                    <p className={styles.noComments}>No comments yet.</p>
                  ) : (
                    comments.map(comment => {
                      const commentLiked = comment.likedBy?.includes(session?.user?.email ?? "");
                      const commentLikeCount = comment.likedBy?.length ?? 0;
                      return (
                        <div key={comment.id} className={styles.comment}>
                          {comment.userImage && (
                            <ShimmerAvatar src={comment.userImage} alt={comment.name} size="sm" />
                          )}
                          <div className={styles.commentBody}>
                            <div className={styles.commentHeader}>
                              <span className={styles.commentName}>{comment.name}</span>
                              {(comment.occupation || comment.employer) && (
                                <span className={styles.commentOccupation}>
                                  {[comment.occupation, comment.employer].filter(Boolean).join(" @ ")}
                                </span>
                              )}
                              {comment.createdAt && (
                                <span className={styles.commentTime}>
                                  {formatTimestamp(comment.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className={styles.commentText}>{comment.text}</p>
                            <div className={styles.commentFooter}>
                              <button
                                className={`${styles.commentLikeBtn} ${commentLiked ? styles.commentLiked : ""}`}
                                onClick={() => handleLikeComment(comment.id)}
                                disabled={!session}
                                title={session ? (commentLiked ? "Unlike" : "Like") : "Sign in to like"}
                              >
                                {commentLiked ? "♥" : "♡"}
                                {commentLikeCount > 0 && <span className={styles.commentLikeCount}>{commentLikeCount}</span>}
                              </button>
                            </div>
                          </div>
                          {(isAdmin || session?.user?.email === comment.email) && (
                            <button className={styles.deleteCommentBtn} onClick={() => handleDeleteComment(comment.id)}>✕</button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {profanityWarning && (
                  <p className={styles.profanityWarning}>
                    Your comment contained inappropriate language and was filtered.
                  </p>
                )}
                {selectedPhoto.commentsEnabled === false && (
                  <p className={styles.noComments}>Comments are turned off for this photo.</p>
                )}
                {session && selectedPhoto.commentsEnabled !== false && (
                  <form className={styles.commentForm} onSubmit={handleComment}>
                    <input
                      className={styles.commentInput}
                      type="text" placeholder="Add a comment..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      maxLength={200}
                    />
                    <button
                      type="submit" className={styles.commentSubmitBtn}
                      disabled={!commentText.trim() || submittingComment}
                    >Post</button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Upload modal */}
      {showUploadModal && (
        <div className={styles.modalBackdrop}>
          <motion.div
            className={styles.modalContent}
            variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <h2 className={styles.modalTitle}>Upload New Photo</h2>
            <label className={styles.formLabel}>
              Select Image
              <input
                ref={fileInputRef} className={styles.inputField}
                type="file" accept="image/*"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setUploadError(null); }}
              />
            </label>
            <label className={styles.formLabel}>
              Caption (Optional)
              <input
                className={styles.inputField} type="text"
                value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption..."
              />
            </label>
            <label className={styles.formLabel} style={{ flexDirection: "row", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={stripMetaOnUpload}
                onChange={e => setStripMetaOnUpload(e.target.checked)}
              />
              Strip metadata before uploading
            </label>
            {uploading && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            )}
            {uploadError && <p className={styles.errorText}>{uploadError}</p>}
            <div className={styles.formButtons}>
              <button className={styles.cancelButton} onClick={handleCancelUpload} disabled={uploading}>Cancel</button>
              <button className={styles.submitButton} onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? `Uploading ${Math.round(progress)}%` : "Upload"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
