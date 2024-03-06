"use client";
import React from "react";
import styles from "./Header.module.css";
import { useSession, signIn, signOut } from "next-auth/react";

function Header() {
  const { data: session } = useSession();

  const handleAuthAction = () => {
    if (session) {
      // User is logged in, handle logout
      signOut({ callbackUrl: "/" });
    } else {
      // User is not logged in, redirect to login page
      // Replace '/api/auth/signin' with your login route if it's different
      signIn('google', { callbackUrl: "/" });
    }
  };

  return (
    <header className={styles.header}>
      <h2>Zachary Vivian</h2>
      <button
        onClick={handleAuthAction}
        className={session ? styles.logoutButton : styles.loginButton}
      >
        {session ? "Logout" : "Login"}
      </button>
    </header>
  );
}

export default Header;
