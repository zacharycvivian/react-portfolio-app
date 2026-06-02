"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react"; // Import useSession
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import styles from "./Sidebar.module.css";
import { db } from "@/../firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function navStyle(index: number, open: boolean): React.CSSProperties {
  if (!open) return {};
  return {
    animation: `navItemIn 240ms ${SPRING} both`,
    animationDelay: `${160 + index * 60}ms`,
  };
}

function Sidebar() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { data: session } = useSession(); // Use the session
  // Function to close the sheet and navigate
  const handleCloseAndNavigate = () => {
    setSheetOpen(false); // Close the sheet
  };

  const handleContactClick = (
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (!session) {
      e.preventDefault(); // Stop the link from navigating
      signIn("google", { callbackUrl: "/contact", prompt: "select_account" }); // Redirect to signIn and then to the contact page
    } else {
      handleCloseAndNavigate(); // This closes the sheet and allows the navigation
    }
  };

  const handleGalleryClick = () => {
    handleCloseAndNavigate();
  };


  return (
    <div>
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            // Radix sets pointer-events:none on body when the Sheet opens and
            // restores it after the close animation ends. With our spring easing
            // override the animationend timing can drift, leaving body locked.
            // Restore after the sheet's 300ms close animation + a small buffer.
            setTimeout(() => {
              document.body.style.pointerEvents = '';
            }, 350);
          }
        }}>
        <SheetTrigger
          className={styles.logo}
          onClick={() => setSheetOpen(true)}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
              fill="currentColor"
            ></path>
          </svg>
        </SheetTrigger>
        <SheetContent side={"left"} className={styles.sheetContainer}>
          <SheetHeader>
            <SheetTitle>Discover More</SheetTitle>
          </SheetHeader>
          <div className={styles.navWrapper}>
            <Button variant={"outline"} className={styles.link} style={navStyle(0, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  Home
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(1, isSheetOpen)} onClick={handleGalleryClick}>
              <Link
                className={styles.links}
                href={"/gallery"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  Gallery
                </div>
              </Link>
            </Button>
            <Button
              variant={"outline"}
              className={`${styles.link} ${
                !session ? styles.linkDisabled : ""
              }`}
              style={navStyle(2, isSheetOpen)}
              onClick={handleContactClick}
            >
              <Link
                className={styles.links}
              href={session ? "/contact" : "#"}
              onClick={(e) => {
                if (!session) {
                  e.preventDefault(); // Stop the link from navigating
                  signIn("google", { callbackUrl: "/contact", prompt: "select_account" }); // Redirect to signIn and then to the contact page
                } else {
                  handleCloseAndNavigate(); // This closes the sheet and allows the navigation
                }
              }}
            >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <path d="M16 2v2m1.915 18a6 6 0 0 0-12 0M8 2v2"/>
                    <circle cx="12" cy="12" r="4"/>
                    <rect width="18" height="18" x="3" y="4" rx="2"/>
                  </svg>
                  <span className={styles.linkText}>
                    {session ? "Contact" : "Contact (Requires Login)"}
                  </span>
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(3, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/testimonials"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
                  </svg>
                  Testimonials
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(4, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/about"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20M2 12h20"/>
                  </svg>
                  About
                </div>
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Sidebar;
