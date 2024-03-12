"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/../public/MenuIcon.png";
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
          <Image src={Logo} alt="logo" width={80} height={80}></Image>
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
