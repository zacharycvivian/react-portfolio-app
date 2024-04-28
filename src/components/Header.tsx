"use client";
import React, { useState, useEffect } from "react";
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
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import ReactDOM from "react-dom";
import { db } from "@/../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

//Interfaces for type declarations
interface Feedback {
  email: string;
  feedback: string;
  time: any;
}

interface Bugs {
  email: string;
  bugs: string;
  time: any;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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

function Header() {
  const { data: session } = useSession();
  const [isReportBugModalOpen, setReportBugModalOpen] = useState(false);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [animatedTitle, setAnimatedTitle] = useState("Zachary Vivian");
  const [animationPhase, setAnimationPhase] = useState(0); // Now includes Phase 5 for pausing
  const originalName = "Zachary Vivian";

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
      }, 6000); // Adjust this duration to control the length of the pause
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

  const addFeedback = async (email: string, feedback: string) => {
    await addDoc(collection(db, "feedback"), {
      email,
      feedback,
      time: serverTimestamp(),
    });
  };

  const addBugReport = async (email: string, bugDescription: string) => {
    await addDoc(collection(db, "bugs"), {
      email,
      bugs: bugDescription,
      time: serverTimestamp(),
    });
  };

  const handleAuthAction = () => {
    if (session) {
      signOut({ callbackUrl: "/" });
      console.log("string" + session);
    } else {
      signIn("google", { callbackUrl: "/" });
      console.log("string" + session);
    }
  };

  // Determine the image to use for the DropdownMenuTrigger
  const userImageURL = session?.user?.image ?? DefaultImage.src;

  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <header className={styles.header}>
      <div className={styles.headertext}>
        <h2>
          {animatedTitle}
          <span className={styles.cursor}>|</span>
        </h2>
      </div>
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
          isOpen={isFeedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          title="Give Feedback"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const feedback = form.elements.namedItem(
                "feedback"
              ) as HTMLTextAreaElement;

              if (session?.user?.email && feedback?.value) {
                await addFeedback(session.user.email, feedback.value);
                alert("Feedback submitted successfully!");
                setFeedbackModalOpen(false); // Close the modal
              } else {
                alert("An unexpected error occurred.");
              }
            }}
          >
            <textarea
              className={styles.textareaField}
              placeholder="Your feedback..."
              name="feedback"
              maxLength={275}
              onChange={(e) => {
                const characterCount = e.target.value.length;
                setCharacterCount(characterCount);
              }}
            ></textarea>
            <span className={styles.characterLimit}>
              {`Limit: ${characterCount} / 275`}
            </span>
            <div className={styles.formButtons}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setFeedbackModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitButton}>
                Submit
              </button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={isReportBugModalOpen}
          onClose={() => setReportBugModalOpen(false)}
          title="Report Bugs"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const bugDescriptionElement = form.elements.namedItem(
                "bugDescription"
              ) as HTMLTextAreaElement;

              if (session?.user?.email && bugDescriptionElement?.value) {
                await addBugReport(
                  session.user.email,
                  bugDescriptionElement.value
                );
                alert("Bug report submitted successfully!");
                setReportBugModalOpen(false); // Close the modal
              } else {
                alert("An unexpected error occurred.");
              }
            }}
          >
            <textarea
              className={styles.textareaField}
              placeholder="Describe the bug..."
              name="bugDescription"
              maxLength={275}
              onChange={(e) => {
                const characterCount = e.target.value.length;
                setCharacterCount(characterCount);
              }}
            ></textarea>
            <span className={styles.characterLimit}>
              {`Limit: ${characterCount} / 275`}
            </span>
            <div className={styles.formButtons}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setReportBugModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitButton}>
                Submit
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </header>
  );
}

export default Header;
