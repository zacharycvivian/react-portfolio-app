"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./games.module.css";

type GameCard = {
  href: string;
  name: string;
  tag: string;
  desc: string;
  bestKey?: string; // localStorage key holding the personal best, if any
  bestUnit?: string;
};

const GAMES: GameCard[] = [
  {
    href: "/cyberbird",
    name: "Cyber Bird",
    tag: "Flappy Bird",
    desc: "Thrust a data packet through gaps in the firewalls.",
    bestKey: "cyberBirdHighScore",
  },
  {
    href: "/cyber-runner",
    name: "Cyber Runner",
    tag: "Jetpack Joyride",
    desc: "Hold to fly, dodge zappers and missiles, grab data bits.",
    bestKey: "cyberRunnerBest",
    bestUnit: " m",
  },
  {
    href: "/trace-run",
    name: "Trace Run",
    tag: "Temple Run",
    desc: "Sprint the conduit — switch lanes, jump, and slide past hazards.",
    bestKey: "traceRunBest",
    bestUnit: " m",
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
    bestKey: "stackJumpBest",
    bestUnit: " m",
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
    bestKey: "packetBreakerBest",
  },
  {
    href: "/binary-breach",
    name: "Binary Breach",
    tag: "2048",
    desc: "Merge powers of two until you breach the grid.",
    bestKey: "binaryBreachBest",
  },
  {
    href: "/decryption-terminal",
    name: "Decryption Terminal",
    tag: "Typing",
    desc: "Type the falling packets to decrypt them before they land.",
    bestKey: "decryptionBest",
  },
  {
    href: "/access-sequence",
    name: "Access Sequence",
    tag: "Simon",
    desc: "Memorize and repeat the ever-growing access code.",
    bestKey: "accessSequenceBest",
  },
  {
    href: "/ping",
    name: "Ping",
    tag: "Reaction",
    desc: "Click the instant the node goes live — measure your latency.",
    bestKey: "pingBest",
    bestUnit: " ms",
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

export default function GamesGrid() {
  const [bests, setBests] = useState<Record<string, number>>({});

  useEffect(() => {
    const found: Record<string, number> = {};
    for (const g of GAMES) {
      if (!g.bestKey) continue;
      const v = Number(localStorage.getItem(g.bestKey) || 0);
      if (v > 0) found[g.bestKey] = v;
    }
    setBests(found);
  }, []);

  return (
    <>
      <p className={styles.subtitle}>
        {GAMES.length} little hacker-themed games. Pick your poison — or type{" "}
        <code className={styles.code}>/play</code> in the terminal.
      </p>
      <div className={styles.grid}>
        {GAMES.map((g) => {
          const best = g.bestKey ? bests[g.bestKey] : undefined;
          return (
            <Link key={g.href} href={g.href} className={styles.card}>
              <span className={styles.cardTag}>{g.tag}</span>
              <span className={styles.cardName}>{g.name}</span>
              <span className={styles.cardDesc}>{g.desc}</span>
              <span className={styles.cardFooter}>
                <span className={styles.cardRun}>&gt; execute</span>
                {best ? (
                  <span className={styles.cardBest}>
                    Best: {best}
                    {g.bestUnit ?? ""}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
