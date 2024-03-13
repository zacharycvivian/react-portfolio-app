"use client";
import React from "react";
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
import Link from "next/link";

function Header() {
  const { data: session } = useSession();

  const handleAuthAction = () => {
    if (session) {
      signOut({ callbackUrl: "/" });
    } else {
      signIn("google", { callbackUrl: "/" });
    }
  };

  // Determine the image to use for the DropdownMenuTrigger
  const userImageURL = session?.user?.image || DefaultImage.src;

  return (
    <header className={styles.header}>
      <h2>Zachary Vivian</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={styles.iconButton}>
            <img
              src={userImageURL}
              alt="Profile"
              className="h-[1.2rem] w-[1.2rem] rounded-full" // Adjust styles as needed
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.dropdownContent}>
          <DropdownMenuItem onClick={handleAuthAction}>
            {session ? "Logout" : "Google Login"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/edit-profile">Edit Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default Header;
