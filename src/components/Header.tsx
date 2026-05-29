"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Header.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DefaultImage from "@/../public/defaultavatar.jpg";
import AvatarImage from "@/components/AvatarImage";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import ReactDOM from "react-dom";
import { db } from "@/../firebase";
import {
  doc, getDoc, collection, query, where, limit, getDocs,
  onSnapshot, orderBy,
} from "firebase/firestore";

interface NotifItem {
  id: string;
  type: "feedback" | "bug" | "message" | "comment" | "like" | "testimonial";
  title: string;
  body?: string;
  time: Date;
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function notifEmoji(type: NotifItem["type"]): string {
  switch (type) {
    case "feedback":    return "⭐";
    case "bug":         return "🐛";
    case "message":     return "✉️";
    case "comment":     return "💬";
    case "like":        return "♥";
    case "testimonial": return "📝";
  }
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    return () => {
      document.body.style.overflow = 'visible'; // Re-enable scrolling
    };
  }, [isOpen]); // Depend on isOpen to re-run this effect

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};


function Header() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReportBugModalOpen, setReportBugModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [animatedTitle, setAnimatedTitle] = useState("Zachary Vivian");
  const [animationPhase, setAnimationPhase] = useState(0); // Now includes Phase 5 for pausing
  const originalName = "Zachary Vivian";
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifWrapperRef = useRef<HTMLDivElement>(null);
  const notifsAccum = useRef<Map<string, NotifItem>>(new Map());

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("notifReadIds");
      if (stored) setReadIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const persistReadIds = (ids: Set<string>) => {
    setReadIds(ids);
    try { localStorage.setItem("notifReadIds", JSON.stringify([...ids])); } catch {}
  };

  useEffect(() => {
    if (!isAdmin) return;
    notifsAccum.current.clear();
    setNotifications([]);

    const unsubs: (() => void)[] = [];

    const flush = () => {
      const all = Array.from(notifsAccum.current.values());
      all.sort((a, b) => b.time.getTime() - a.time.getTime());
      setNotifications(all);
    };

    const addItems = (prefix: string, snap: any, mapFn: (id: string, data: any) => NotifItem | null) => {
      snap.docs.forEach((d: any) => {
        const item = mapFn(d.id, d.data());
        if (item) notifsAccum.current.set(prefix + d.id, item);
      });
      flush();
    };

    unsubs.push(onSnapshot(
      query(collection(db, "feedback"), orderBy("time", "desc"), limit(50)),
      snap => addItems("fb_", snap, (id, data) => ({
        id: "fb_" + id, type: "feedback",
        title: "New feedback",
        body: [data.email, data.feedback?.slice(0, 80)].filter(Boolean).join(": "),
        time: data.time?.toDate?.() ?? new Date(0),
      }))
    ));

    unsubs.push(onSnapshot(
      query(collection(db, "bugs"), orderBy("time", "desc"), limit(50)),
      snap => addItems("bug_", snap, (id, data) => ({
        id: "bug_" + id, type: "bug",
        title: "New bug report",
        body: [data.email, data.bugs?.slice(0, 80)].filter(Boolean).join(": "),
        time: data.time?.toDate?.() ?? new Date(0),
      }))
    ));

    unsubs.push(onSnapshot(
      query(collection(db, "connect"), orderBy("time", "desc"), limit(50)),
      snap => addItems("con_", snap, (id, data) => ({
        id: "con_" + id, type: "message",
        title: "New message",
        body: [data.name ?? data.email, data.message?.slice(0, 80)].filter(Boolean).join(": "),
        time: data.time?.toDate?.() ?? new Date(0),
      }))
    ));

    unsubs.push(onSnapshot(
      query(collection(db, "testimonials"), orderBy("time", "desc"), limit(50)),
      snap => addItems("test_", snap, (id, data) => ({
        id: "test_" + id, type: "testimonial",
        title: "New testimonial",
        body: [data.name, data.review?.slice(0, 80)].filter(Boolean).join(": "),
        time: data.time?.toDate?.() ?? new Date(0),
      }))
    ));

    unsubs.push(onSnapshot(
      query(collection(db, "notifications"), orderBy("time", "desc"), limit(50)),
      snap => addItems("notif_", snap, (id, data) => ({
        id: "notif_" + id, type: data.type,
        title: data.title,
        body: data.body,
        time: data.time?.toDate?.() ?? new Date(0),
      }))
    ));

    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifWrapperRef.current && !notifWrapperRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markOneRead = (id: string) => {
    persistReadIds(new Set([...readIds, id]));
  };

  const markAllRead = () => {
    persistReadIds(new Set([...readIds, ...notifications.map(n => n.id)]));
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  useEffect(() => {
    const fetchAdmin = async () => {
      const uid = (session?.user as any)?.id;
      const email = session?.user?.email;
      if (uid) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) { setIsAdmin(Boolean(snap.data()?.isAdmin)); return; }
      }
      if (email) {
        const snap = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(1)));
        if (!snap.empty) { setIsAdmin(Boolean(snap.docs[0].data()?.isAdmin)); return; }
      }
      setIsAdmin(false);
    };
    fetchAdmin();
  }, [session?.user]);

  useEffect(() => {
    let timeoutId: number;

    // Backspacing for Phase 1 and Phase 3
    if (animationPhase === 1 || animationPhase === 3) {
      if (animatedTitle.length > 0) {
        const backspaceSpeed = Math.random() * (250 - 50) + 50; // Randomize between 50ms and 150ms
        timeoutId = window.setTimeout(() => {
          setAnimatedTitle(animatedTitle.slice(0, -1));
        }, backspaceSpeed);
      } else {
        setAnimationPhase(animationPhase + 1); // Proceed to the next phase
      }
    }
    // Encrypting (Phase 2)
    else if (animationPhase === 2) {
      if (animatedTitle.length < originalName.length) {
        timeoutId = window.setTimeout(() => {
          // Add a random character or space
          const nextChar = Math.random().toString(36)[2];
          setAnimatedTitle(
            (prev) => prev + (prev.length === 6 ? " " : nextChar)
          );
        }, 100);
      } else {
        setAnimationPhase(animationPhase + 1); // Move to Phase 3
      }
    }
    // Retyping "Zachary Vivian" (Phase 4)
    else if (animationPhase === 4) {
      if (animatedTitle.length < originalName.length) {
        timeoutId = window.setTimeout(() => {
          setAnimatedTitle(originalName.slice(0, animatedTitle.length + 1));
        }, 100);
      } else {
        // After completing the name, wait for a bit before restarting
        setAnimationPhase(5); // Move to pause phase
      }
    }
    // Pause (Phase 5)
    else if (animationPhase === 5) {
      timeoutId = window.setTimeout(() => {
        setAnimationPhase(1); // Restart the sequence
      }, 12000); // Adjust this duration to control the length of the pause
    }

    return () => clearTimeout(timeoutId);
  }, [animatedTitle, animationPhase]);

  useEffect(() => {
    // Initiate the sequence after a short delay
    const delayId = setTimeout(() => {
      setAnimationPhase(1);
    }, 2000); // Initial delay before starting

    return () => clearTimeout(delayId);
  }, []);

  const handleAuthAction = () => {
    if (session) {
      signOut({ callbackUrl: "/" });
      console.log("string" + session);
    } else {
      signIn("google", { callbackUrl: "/", prompt: "select_account" });
      console.log("string" + session);
    }
  };

  // Determine the image to use for the DropdownMenuTrigger
  const userImageURL = session?.user?.image ?? DefaultImage.src;

  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  if (!mounted) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.headertext}>
        <h2>
          {animatedTitle}
          <span className={styles.cursor}>|</span>
        </h2>
      </div>
      <div className={styles.profileAndToggleContainer}>
        {isAdmin && (
          <div ref={notifWrapperRef} className={styles.notifWrapper}>
            <button
              className={styles.iconButton}
              onClick={() => setNotifOpen(o => !o)}
              aria-label="Notifications"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 0.875C7.5 0.875 7.22 0.91 7.08 0.98C6.35 1.34 6 2.06 6 2.78C4.1 3.43 2.75 5.25 2.75 7.375V10.5L1.25 12H13.75L12.25 10.5V7.375C12.25 5.25 10.9 3.43 9 2.78C9 2.06 8.65 1.34 7.92 0.98C7.78 0.91 7.5 0.875 7.5 0.875ZM5.75 12.5C5.75 13.466 6.534 14.25 7.5 14.25C8.466 14.25 9.25 13.466 9.25 12.5H5.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className={styles.notifPanel}>
                <div className={styles.notifPanelHeader}>
                  <span className={styles.notifPanelTitle}>Notifications</span>
                  <button className={styles.notifMarkRead} onClick={markAllRead}>
                    Mark all read
                  </button>
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <p className={styles.notifEmpty}>All caught up!</p>
                  ) : (
                    notifications.map(n => {
                      const isRead = readIds.has(n.id);
                      return (
                        <div key={n.id} className={`${styles.notifItem} ${isRead ? styles.notifItemRead : ""}`}>
                          <span className={styles.notifIcon}>{notifEmoji(n.type)}</span>
                          <div className={styles.notifContent}>
                            <span className={styles.notifItemTitle}>{n.title}</span>
                            {n.body && <span className={styles.notifBody}>{n.body}</span>}
                            <span className={styles.notifTime}>{relativeTime(n.time)}</span>
                          </div>
                          {!isRead && (
                            <button
                              className={styles.notifReadBtn}
                              onClick={() => markOneRead(n.id)}
                              aria-label="Mark as read"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className={styles.iconButton}>
              {currentTheme === "dark" ? ( // Use currentTheme to decide the icon
                <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              ) : (
                <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.dropdownContent}>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System Setting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${styles.iconButton} ${
                !session && styles.glintButton
              }`}
            >
              <AvatarImage
                src={userImageURL}
                alt="Profile"
                size={28}
                unoptimized
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.dropdownContent}>
            <DropdownMenuItem onClick={handleAuthAction}>
              <strong>{session ? "Logout" : "Google Login"}</strong>
            </DropdownMenuItem>
            {session && (
              <>
                <DropdownMenuItem>
                  <Link href="/edit-profile">Edit Profile</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
