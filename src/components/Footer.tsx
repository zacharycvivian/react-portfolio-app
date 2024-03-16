"use client"
import React, { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/../firebase";
import styles from "./Footer.module.css"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const [sessionCount, setSessionCount] = useState<number>(0); 

  useEffect(() => {
    const fetchSessionCount = async () => {
      const q = query(collection(db, "sessions")); 
      const querySnapshot = await getDocs(q);
      setSessionCount(querySnapshot.size); 
    };

    fetchSessionCount();
  }, []);

  return (
    <footer className={styles.footer}>
      <p className={styles["build-info"]}>
        <strong>This Website was Built Using:</strong> React, Next.js, and
        Google Firebase
      </p>
      <p className={styles["unique-visitors"]}>
        <strong>Total Site Visitors:</strong> {sessionCount} 
      </p>
      <div>
      <Button variant={"outline"} className={styles.wordleButton}>
        <Link className={styles.links} href={"/cyberwordle"}>
          Play CyberWordle
        </Link>
      </Button>
      <Button variant={"outline"} className={styles.snakeButton}>
        <Link className={styles.links} href={"/snake"}>
          Play Snake
        </Link>
      </Button>
      <Button variant={"outline"} className={styles.pongButton}>
        <Link className={styles.links} href={"/pong"}>
          Play Pong
        </Link>
      </Button>
      </div>
      <p className={styles["copyright-info"]}>© Zachary Vivian 2024</p>
    </footer>
  );
};

export default Footer;