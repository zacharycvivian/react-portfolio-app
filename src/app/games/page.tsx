import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import MatrixRain from "@/components/MatrixRain";
import styles from "./games.module.css";

// Deliberately kept out of the sitemap and hidden from crawlers — this is a
// convenience hub reachable from the chatbot's "/play" command and by URL.
export const metadata: Metadata = {
  title: "Arcade - Zachary Vivian's Portfolio Website",
  description:
    "A hidden arcade of small, hacker-themed browser games built in TypeScript.",
  robots: { index: false, follow: true },
};

type GameCard = {
  href: string;
  name: string;
  tag: string;
  desc: string;
};

const GAMES: GameCard[] = [
  {
    href: "/cyberbird",
    name: "Cyber Bird",
    tag: "Flappy Bird",
    desc: "Thrust a data packet through gaps in the firewalls.",
  },
  {
    href: "/cyber-runner",
    name: "Cyber Runner",
    tag: "Jetpack Joyride",
    desc: "Hold to fly, dodge zappers and missiles, grab data bits.",
  },
  {
    href: "/trace-run",
    name: "Trace Run",
    tag: "Temple Run",
    desc: "Sprint the conduit — switch lanes, jump, and slide past hazards.",
  },
  {
    href: "/data-flow",
    name: "Data Flow",
    tag: "Flow Free",
    desc: "Route signal cables to link every port and fill the grid.",
  },
  {
    href: "/stack-jump",
    name: "Stack Jump",
    tag: "Doodle Jump",
    desc: "Auto-bounce up an endless stack of platforms.",
  },
  {
    href: "/packet-siege",
    name: "Packet Siege",
    tag: "Angry Birds",
    desc: "Sling packets to smash firewall forts and wipe out trojans.",
  },
  {
    href: "/malware-sweeper",
    name: "Malware Sweeper",
    tag: "Minesweeper",
    desc: "Reveal the safe nodes and quarantine the malware.",
  },
  {
    href: "/sudoku",
    name: "Sudoku",
    tag: "Sudoku",
    desc: "Fill every row, column, and box with the digits 1–9.",
  },
  {
    href: "/word-search",
    name: "Word Search",
    tag: "Word Search",
    desc: "Drag across the grid to find the hidden cyber terms.",
  },
  {
    href: "/cipher-cross",
    name: "Cipher Cross",
    tag: "Crossword",
    desc: "Decode every across and down clue to crack the grid.",
  },
  {
    href: "/packet-breaker",
    name: "Packet Breaker",
    tag: "Breakout",
    desc: "Bounce a packet off your node to smash firewall blocks.",
  },
  {
    href: "/binary-breach",
    name: "Binary Breach",
    tag: "2048",
    desc: "Merge powers of two until you breach the grid.",
  },
  {
    href: "/decryption-terminal",
    name: "Decryption Terminal",
    tag: "Typing",
    desc: "Type the falling packets to decrypt them before they land.",
  },
  {
    href: "/access-sequence",
    name: "Access Sequence",
    tag: "Simon",
    desc: "Memorize and repeat the ever-growing access code.",
  },
  {
    href: "/ping",
    name: "Ping",
    tag: "Reaction",
    desc: "Click the instant the node goes live — measure your latency.",
  },
  {
    href: "/cyberwordle",
    name: "CyberWordle",
    tag: "Wordle",
    desc: "Crack the five-letter key in six guesses.",
  },
  {
    href: "/snake",
    name: "Snake",
    tag: "Snake",
    desc: "Snake the grid, capturing data packets without crashing.",
  },
  {
    href: "/pong",
    name: "Pong",
    tag: "Pong",
    desc: "Rally against a red sentinel — first to five wins.",
  },
];

export default function GamesPage() {
  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Arcade</h1>
        <p className={styles.subtitle}>
          {GAMES.length} little hacker-themed games. Pick your poison — or type{" "}
          <code className={styles.code}>/play</code> in the terminal.
        </p>
        <div className={styles.grid}>
          {GAMES.map((g) => (
            <Link key={g.href} href={g.href} className={styles.card}>
              <span className={styles.cardTag}>{g.tag}</span>
              <span className={styles.cardName}>{g.name}</span>
              <span className={styles.cardDesc}>{g.desc}</span>
              <span className={styles.cardRun}>&gt; execute</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
