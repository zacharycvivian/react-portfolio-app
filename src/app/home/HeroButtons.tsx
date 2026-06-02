"use client";
/**
 * HeroButtons — the Contact / Testimonials / Gallery actions in the hero.
 *
 * Client component because the Contact action is auth-gated: visitors who
 * aren't signed in are sent through Google sign-in (with `/contact` as the
 * callback) instead of navigating directly.
 */
import React from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import styles from "../page.module.css";

export default function HeroButtons() {
  const { data: session } = useSession();

  return (
    <div className={styles.buttonContainer}>
      <Link
        className={styles.button}
        href={session ? "/contact" : "#"}
        onClick={(e) => {
          if (!session) {
            e.preventDefault();
            signIn("google", {
              callbackUrl: "/contact",
              prompt: "select_account",
            });
          }
        }}
      >
        Contact
      </Link>
      <Link href="/testimonials" passHref>
        <button className={styles.button}>Testimonials</button>
      </Link>
      <Link href="/gallery" passHref>
        <button className={styles.button}>Gallery</button>
      </Link>
    </div>
  );
}
