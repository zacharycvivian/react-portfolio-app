"use client";
import React from "react";
import styles from "./Header.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DefaultImage from "@/../public/defaultavatar.jpg";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

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

  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <header className={styles.header}>
      <h2>Zachary Vivian</h2>
      <div className={styles.profileAndToggleContainer}>
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
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <strong>System (Default)</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <strong>Light</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <strong>Dark</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("navy")}>
            Navy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("crimson")}>
            Crimson
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("emerald")}>
            Emerald
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${styles.iconButton} ${!session && styles.glintButton}`}
          >
            <img
              src={userImageURL}
              alt="Profile"
              className="h-[1.2rem] w-[1.2rem] rounded-full"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.dropdownContent}>
          <DropdownMenuItem onClick={handleAuthAction}>
            {session ? "Logout" : "Google Login"}
          </DropdownMenuItem>
          {session && (
            <DropdownMenuItem>
              <Link href="/edit-profile">Edit Profile</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
