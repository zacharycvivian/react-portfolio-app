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
        <p className={styles["unique-visitors"]}>
          <strong>Registered Users:</strong> {userCount} 
        </p>
      </div>
      <p className={styles["copyright-info"]}>© Zachary Vivian 2024</p>
    </footer>
  );
};

export default Footer;