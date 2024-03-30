"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { useSession } from "next-auth/react"; // Import useSession

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import styles from "./Sidebar.module.css";
import { useState } from "react";

function Sidebar() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { data: session } = useSession(); // Use the session

  // Function to close the sheet and navigate
  const handleCloseAndNavigate = () => {
    setSheetOpen(false); // Close the sheet
  };

  return (
    <div>
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
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
            <Button variant={"outline"} className={styles.link}>
              <Link
                className={styles.links}
                href={"/"}
                onClick={handleCloseAndNavigate}
              >
                Home
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link
                className={styles.links}
                href={"/about"}
                onClick={handleCloseAndNavigate}
              >
                About
              </Link>
            </Button>
            <Button
              variant={"outline"}
              className={`${styles.link} ${
                !session ? styles.linkDisabled : ""
              }`}
            >
              <Link
                className={styles.links}
                href={session ? "/contact" : "#"}
                onClick={
                  session ? handleCloseAndNavigate : (e) => e.preventDefault()
                }
              >
                {session ? (
                  <span className={styles.linkText}>Contact</span>
                ) : (
                  <span className={styles.linkText}>
                    Contact (Log in to View)
                  </span>
                )}
              </Link>
            </Button>

            <Button variant={"outline"} className={styles.link}>
              <Link
                className={styles.links}
                href={"/blog"}
                onClick={handleCloseAndNavigate}
              >
                Blog
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link
                className={styles.links}
                href={"/testimonials"}
                onClick={handleCloseAndNavigate}
              >
                Testimonials
              </Link>
            </Button>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Sidebar;
