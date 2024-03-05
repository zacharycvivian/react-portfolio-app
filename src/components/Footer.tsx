"use client"
import React, { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/../firebase";
import styles from "./Footer.module.css"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const [userCount, setUserCount] = useState<number>(0); 

  useEffect(() => {
    const fetchUserCount = async () => {
      const q = query(collection(db, "users")); 
      const querySnapshot = await getDocs(q);
      setUserCount(querySnapshot.size); 
    };

    fetchUserCount();
  }, []);

  return (
    <footer className={styles.footer}>
      <p className={styles["build-info"]}>
        <strong>This Website was Built Using:</strong> React, Next.js, and
        Google Firebase
      </p>
      <p className={styles["unique-visitors"]}>
        <strong>Total Unique Visitors:</strong> {userCount} 
      </p>
      <Button variant={"outline"} className={styles.wordleButton}>
        <Link className={styles.links} href={"/cyberwordle"}>
          CyberWordle
        </Link>
      </Button>
      <p className={styles["copyright-info"]}>© Zachary Vivian 2024</p>
    </footer>
  );
};

export default Footer;