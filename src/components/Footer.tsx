"use client";
import React, { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import styles from "./Footer.module.css"; // Import the styles

const Footer = () => {
  const [sessionCount, setSessionCount] = useState<number>(0);

  useEffect(() => {
    const fetchSessionCount = async () => {
      const q = query(collection(db, "sessions"));
      const querySnapshot = await getDocs(q);
      setSessionCount(querySnapshot.size); // Set the count of documents in the "sessions" collection
    };

    fetchSessionCount();
  }, []);

  return (
    <footer className={styles.footer}>
      <p className={styles["build-info"]}>
        <strong>This Website was Built Using:</strong> React, Next.js, and
        Google Firebase
      </p>
      <p className={styles["site-map"]}>
        <strong>Total Site Visits:</strong> {sessionCount}
      </p>
      <p className={styles["copyright-info"]}>© Zachary Vivian 2024</p>
    </footer>
  );
};

export default Footer;
