import React from "react";
import { Metadata } from "next";
import MatrixRain from "@/components/MatrixRain";
import GamesGrid from "./GamesGrid";
import styles from "./games.module.css";

// Deliberately kept out of the sitemap and hidden from crawlers — this is a
// convenience hub reachable from the chatbot's "/play" command and by URL.
export const metadata: Metadata = {
  title: "Arcade - Zachary Vivian's Portfolio Website",
  description:
    "A hidden arcade of small, hacker-themed browser games built in TypeScript.",
  robots: { index: false, follow: true },
};

export default function GamesPage() {
  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Arcade</h1>
        <GamesGrid />
      </div>
    </div>
  );
}
