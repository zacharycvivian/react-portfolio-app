"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ArcadeNav.module.css";

// Every game route. On any of these, show a subtle link back to the arcade so
// players can hop between games without the browser back button. It only
// appears once you're already in a game, so it doesn't expose the hidden hub.
const GAME_ROUTES = new Set([
  "/cyberbird",
  "/cyber-runner",
  "/trace-run",
  "/stack-jump",
  "/packet-breaker",
  "/packet-siege",
  "/decryption-terminal",
  "/ping",
  "/binary-breach",
  "/data-flow",
  "/access-sequence",
  "/malware-sweeper",
  "/sudoku",
  "/word-search",
  "/cipher-cross",
  "/snake",
  "/pong",
  "/cyberwordle",
]);

export default function ArcadeNav() {
  const pathname = usePathname();
  if (!pathname || !GAME_ROUTES.has(pathname)) return null;
  return (
    <Link href="/games" className={styles.link} aria-label="Back to the arcade">
      <span aria-hidden="true">←</span> Arcade
    </Link>
  );
}
