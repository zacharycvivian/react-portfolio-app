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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DefaultImage from "@/../public/defaultavatar.jpg";
import AvatarImage from "@/components/AvatarImage";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useReactivity } from "@/components/ReactivityProvider";
import ReactDOM from "react-dom";
import { db } from "@/../firebase";
import {
  doc, getDoc, collection, query, where, limit, getDocs,
  onSnapshot, orderBy, updateDoc, writeBatch,
} from "firebase/firestore";
import type { NotifItem, NotificationType, SessionUser } from "@/types";

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function notifEmoji(type: NotificationType): string {
  switch (type) {
    case "feedback":    return "⭐";
    case "bug":         return "🐛";
    case "message":     return "✉️";
    case "comment":     return "💬";
    case "like":        return "♥";
    case "testimonial": return "📝";
    default:            return "🔔";
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
  const [animatedTitle, setAnimatedTitle] = useState("Zachary Vivian");
  const [animationPhase, setAnimationPhase] = useState(0); // Now includes Phase 5 for pausing
  const originalName = "Zachary Vivian";
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapperRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  // The panel is portaled to <body> (so its backdrop-filter can blur the page
  // instead of being trapped inside the header's own backdrop-filter), so we
  // position it manually beneath the bell.
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({
    top: 72,
    right: 16,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Single source of truth: the `notifications` collection. Every notifiable
  // event (feedback/bug/message via the server audit route; like/comment/
  // testimonial written by their pages) creates a doc here with a `read` flag,
  // so read-state is authoritative and synced across devices.
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      query(collection(db, "notifications"), orderBy("time", "desc"), limit(50)),
      (snap) => {
        setNotifications(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type,
              title: data.title,
              body: data.body,
              time: data.time?.toDate?.() ?? new Date(0),
              read: data.read === true,
            } as NotifItem;
          }),
        );
      },
    );
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!notifOpen) return;
    // Listen on `pointerdown` (not `mousedown`): Radix dropdown triggers call
    // preventDefault on pointerdown, which suppresses the synthetic mousedown —
    // so a mousedown listener never fired when opening the theme/profile menu,
    // leaving this panel stuck open. pointerdown always fires.
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      const inBell = notifWrapperRef.current?.contains(target);
      const inPanel = notifPanelRef.current?.contains(target);
      if (!inBell && !inPanel) setNotifOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [notifOpen]);

  // Position the portaled panel beneath the bell, right-aligned to it.
  useEffect(() => {
    if (!notifOpen) return;
    const place = () => {
      const r = notifWrapperRef.current?.getBoundingClientRect();
      if (r) {
        setPanelPos({
          top: r.bottom + 10,
          right: Math.max(8, window.innerWidth - r.right),
        });
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [notifOpen]);

  // Read-state lives on the Firestore docs (synced across devices). The
  // onSnapshot subscription above reflects these updates back into the UI.
  const markOneRead = (id: string) => {
    updateDoc(doc(db, "notifications", id), { read: true }).catch(() => {});
  };

  const markAllRead = () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    batch.commit().catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchAdmin = async () => {
      const uid = (session?.user as SessionUser | undefined)?.id;
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
    } else {
      signIn("google", { callbackUrl: "/", prompt: "select_account" });
    }
  };

  // Determine the image to use for the DropdownMenuTrigger
  const userImageURL = session?.user?.image ?? DefaultImage.src;

  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const activeTheme = theme; // track the actual selected setting (light/dark/system)
  const { enabled: reactive, toggle: toggleReactive } = useReactivity();

  if (!mounted) {
    return (
      <header className={styles.header}>
        <div className={styles.headertext}>
          <h2>Zachary Vivian<span className={styles.cursor}>|</span></h2>
        </div>
        <div className={styles.profileAndToggleContainer} />
      </header>
    );
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
              </svg>
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && mounted && ReactDOM.createPortal(
              <div
                ref={notifPanelRef}
                className={styles.notifPanel}
                style={{ position: "fixed", top: panelPos.top, right: panelPos.right }}
              >
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
                      const isRead = n.read;
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
              </div>,
              document.body,
            )}
          </div>
        )}
        <DropdownMenu onOpenChange={(open) => { if (open) setNotifOpen(false); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className={styles.iconButton}>
              {activeTheme === "system" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v2m2.837 12.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715M16 12a4 4 0 0 0-4-4m7-3l-1.256 1.256M20 12h2"/>
                </svg>
              ) : currentTheme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.dropdownContent}>
            <DropdownMenuItem onClick={() => setTheme("light")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
              Light Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
              </svg>
              Dark Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2v2m2.837 12.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715M16 12a4 4 0 0 0-4-4m7-3l-1.256 1.256M20 12h2"/>
              </svg>
              System
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                // Keep the menu open and preserve the user gesture (needed for
                // iOS motion-sensor permission) instead of closing on select.
                e.preventDefault();
                toggleReactive();
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="m16.24 7.76l-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span style={{ flex: 1 }}>Reactivity</span>
              {reactive && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu onOpenChange={(open) => { if (open) setNotifOpen(false); }}>
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
