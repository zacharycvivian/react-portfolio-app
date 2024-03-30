"use client";
import React, { useState } from "react";
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
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Header() {
  const { data: session } = useSession();
  const [isReportBugModalOpen, setReportBugModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
  }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContent}>
          <h2>{title}</h2>
          {children}
        </div>
      </div>,
      document.body
    );
  };

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
              className={`${styles.iconButton} ${
                !session && styles.glintButton
              }`}
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
              <strong>{session ? "Logout" : "Google Login"}</strong>
            </DropdownMenuItem>
            {session && (
              <>
                <DropdownMenuItem>
                  <Link href="/edit-profile">Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReportBugModalOpen(true)}>
                  Report Bugs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackModalOpen(true)}>
                  Give Feedback
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Modal
          isOpen={isReportBugModalOpen}
          onClose={() => setReportBugModalOpen(false)}
          title="Report Bugs"
        >
          <form>
            <textarea
              className={styles.textareaField}
              placeholder="Describe the bug..."
            ></textarea>
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitButton}>
                Submit
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setReportBugModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={isFeedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          title="Give Feedback"
        >
          <form>
            <textarea
              className={styles.textareaField}
              placeholder="Your feedback..."
            ></textarea>
            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitButton}>
                Submit
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setFeedbackModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </header>
  );
}

export default Header;
