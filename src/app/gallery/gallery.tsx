"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteField,
  getDocs, where, limit,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/../firebase";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./gallery.module.css";
import { loadBannedWords, filterProfanity } from "@/lib/profanity";

const ADMIN_EMAIL = "zacharycvivian@gmail.com";

const fadeIn = {
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  hidden: { opacity: 0, scale: 0.65, y: 50 },
};

function PhotoCard({ photo, isAdmin, onSelect, onDelete, animDelay = 0 }: {
  photo: Photo;
  isAdmin: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  animDelay?: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <motion.div
      className={styles.photoCard}
      onClick={onSelect}
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ delay: animDelay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {!imgLoaded && <div className={styles.imageShimmer} />}
      <Image
        src={photo.url}
        alt={photo.caption || "Gallery photo"}
        fill
        className={styles.image}
        sizes="(max-width: 500px) 50vw, 33vw"
        onLoad={() => setImgLoaded(true)}
      />
      <div className={styles.photoOverlay}>
        {!!photo.likedBy?.length && (
          <span className={styles.overlayLikeCount}>♥ {photo.likedBy.length}</span>
        )}
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

interface PhotoMetadata {
  fileSize?: number;
  width?: number;
  height?: number;
  dateTaken?: string;
  camera?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface LikerDetail {
  email: string;
  name: string;
  image: string;
}

interface Comment {
  id: string;
  text: string;
  email: string;
  name: string;
  userImage?: string;
  occupation?: string;
  employer?: string;
  createdAt: any;
  likedBy?: string[];
}

interface Photo {
  id: string;
  url: string;
  storagePath: string;
  caption?: string;
  createdAt: any;
  likedBy?: string[];
  metadata?: PhotoMetadata;
  hideMetadata?: boolean;
  uploaderName?: string;
  uploaderImage?: string;
}

// Extract EXIF + file metadata from a File object
async function extractMetadata(file: File): Promise<PhotoMetadata> {
  const meta: PhotoMetadata = { fileSize: file.size };

  try {
    const exifr = (await import("exifr")).default;

    const exif = await exifr.parse(file, {
      pick: ["Make", "Model", "DateTimeOriginal", "ExifImageWidth", "ExifImageHeight"],
    }) as any;

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

    const gps = await exifr.gps(file) as any;
    if (gps?.latitude && gps?.longitude) {
      meta.latitude  = gps.latitude;
      meta.longitude = gps.longitude;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${gps.latitude}&lon=${gps.longitude}&zoom=10`
        );
        const geo = await res.json();
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
    } catch {}
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
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
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
  const [comments, setComments] = useState<Comment[]>([]);
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
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
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

  const showNavBriefly = () => {
    setNavVisible(true);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setNavVisible(false), 3000);
  };

  useEffect(() => {
    if (!selectedPhotoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhotoId(null);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft")  navigate(-1);
      if (e.key === "i" || e.key === "I") setShowInfo(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPhotoId, selectedIndex, photos.length]);

  const navigate = (dir: 1 | -1) => {
    if (!photos.length) return;
    const next = (selectedIndex + dir + photos.length) % photos.length;
    setSelectedPhotoId(photos[next].id);
    setCommentText("");
  };

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
      });
    }
  };

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
      try { await navigator.share(shareData); return; } catch {}
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (photo: Photo) => {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = photo.caption ? `${photo.caption}.jpg` : `photo-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
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
        <p className={styles.emptyState}>Loading gallery...</p>
      ) : (
        <div className={styles.grid}>
          {photos.map((photo, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const animDelay = Math.min((row + col) * 0.05, 0.7);
            return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isAdmin={isAdmin}
              animDelay={animDelay}
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
      {selectedPhoto && (
        <div className={styles.lightboxBackdrop} onClick={() => setSelectedPhotoId(null)}>
          <div className={styles.lightbox} onClick={e => e.stopPropagation()}>

            {/* Image pane */}
            <div
              className={styles.lightboxImageSection}
              onMouseMove={showNavBriefly}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; showNavBriefly(); }}
              onTouchEnd={e => {
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
              }}
            >
              <div className={styles.lightboxImageWrapper}>
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "Gallery photo"}
                  fill className={styles.lightboxImage}
                />
              </div>

              <div className={styles.lightboxTopBar}>
                <button className={styles.downloadBtn} onClick={() => handleDownload(selectedPhoto)}>
                  ↓ Download
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
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 5.00006C3.22386 5.00006 3 5.22392 3 5.50006V11.5001C3 11.7762 3.22386 12.0001 3.5 12.0001H11.5C11.7761 12.0001 12 11.7762 12 11.5001V5.50006C12 5.22392 11.7761 5.00006 11.5 5.00006H10C9.72386 5.00006 9.5 4.7762 9.5 4.50006C9.5 4.22392 9.72386 4.00006 10 4.00006H11.5C12.3284 4.00006 13 4.67163 13 5.50006V11.5001C13 12.3285 12.3284 13.0001 11.5 13.0001H3.5C2.67157 13.0001 2 12.3285 2 11.5001V5.50006C2 4.67163 2.67157 4.00006 3.5 4.00006H5C5.27614 4.00006 5.5 4.22392 5.5 4.50006C5.5 4.7762 5.27614 5.00006 5 5.00006H3.5ZM7.50003 1.00006C7.63264 1.00006 7.75982 1.05274 7.85358 1.14651L9.85358 3.14651C10.0488 3.34177 10.0488 3.65835 9.85358 3.85361C9.65832 4.04887 9.34174 4.04887 9.14648 3.85361L7.50003 2.20716L5.85358 3.85361C5.65832 4.04887 5.34174 4.04887 5.14648 3.85361C4.95122 3.65835 4.95122 3.34177 5.14648 3.14651L7.14648 1.14651C7.24025 1.05274 7.36743 1.00006 7.50003 1.00006ZM7.50003 1.00006V7.50006C7.50003 7.7762 7.27617 8.00006 7.00003 8.00006C6.72389 8.00006 6.50003 7.7762 6.50003 7.50006V1.00006C6.50003 0.723921 6.72389 0.500061 7.00003 0.500061C7.27617 0.500061 7.50003 0.723921 7.50003 1.00006Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                  {hasInfo && (
                    <button
                      className={`${styles.infoBtn} ${showInfo ? styles.infoBtnActive : ""}`}
                      onClick={() => setShowInfo(v => !v)}
                      title="Photo info (i)"
                    >
                      ⓘ
                    </button>
                  )}
                  <button className={styles.closeBtn} onClick={() => setSelectedPhotoId(null)}>✕</button>
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
                    onClick={() => { navigate(-1); showNavBriefly(); }}
                  >‹</button>
                  <button
                    className={`${styles.navBtn} ${styles.navRight} ${!navVisible ? styles.navBtnHidden : ""}`}
                    onClick={() => { navigate(1); showNavBriefly(); }}
                  >›</button>
                </>
              )}
            </div>

            {/* Side panel */}
            <div className={styles.lightboxPanel}>
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
                    {selectedPhoto.createdAt && (
                      <span className={styles.uploadTimestamp}>
                        {formatTimestamp(selectedPhoto.createdAt)}
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
                  {meta && (
                    <div className={styles.adminActRow}>
                      <span className={styles.adminActLabel}>Remove metadata permanently</span>
                      <button
                        className={`${styles.adminActBtn} ${styles.adminActBtnDanger}`}
                        onClick={handleStripMetadata}
                      >Strip</button>
                    </div>
                  )}
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
                {session && (
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
          </div>
        </div>
      )}

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
