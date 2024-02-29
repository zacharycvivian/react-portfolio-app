"use client";
import React from "react";
import styles from "./Header.module.css";
import { signOut } from "next-auth/react";

function Header() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className={styles.header}>
      <h2>Zachary Vivian</h2>
      <a
        href="@/../zcvivian_Resume.pdf"
        download
        className={styles.downloadResumeButton}
      >
        Resume
      </a>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
    </header>
  );
}

export default Header;
