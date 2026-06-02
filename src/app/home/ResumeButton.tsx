"use client";
/**
 * ResumeButton — downloads the resume, gated behind Google sign-in.
 *
 * Client component: it reads the session and either opens the protected
 * `/api/resume` route in a new tab or kicks off sign-in for signed-out visitors.
 */
import React from "react";
import { useSession, signIn } from "next-auth/react";
import { AnimatedDiv } from "@/components/motion/Animated";
import styles from "../page.module.css";

export default function ResumeButton() {
  const { data: session } = useSession();

  const handleDownloadClick = () => {
    if (session) {
      window.open("/api/resume", "_blank");
    } else {
      signIn("google", {
        callbackUrl: `${window.location.origin}/`,
        prompt: "select_account",
      });
    }
  };

  return (
    <AnimatedDiv className={styles.buttonContainer}>
      <button onClick={handleDownloadClick} className={styles.downloadResumeButton}>
        {session ? "Download Resume" : "Log In to Download Resume"}
      </button>
    </AnimatedDiv>
  );
}
