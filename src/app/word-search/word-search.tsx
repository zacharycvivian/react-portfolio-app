"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./word-search.module.css";

const SIZE = 12;
const WORD_POOL = [
  "FIREWALL", "MALWARE", "EXPLOIT", "PACKET", "KERNEL", "CIPHER", "TROJAN",
  "ROOTKIT", "BOTNET", "PAYLOAD", "ENCRYPT", "SANDBOX", "PROXY", "VECTOR",
  "PHISH", "BREACH", "DAEMON", "SUBNET",
];
const COLORS = [
  "#38e6ff", "#39ff88", "#f4c04a", "#ff5ac8", "#ff5a4d", "#5a8bff",
  "#b06bff", "#ff8a3d", "#4be3c0", "#ff6b9d",
];
const DIRS = [
  [0, 1], [1, 0], [1, 1], [1, -1],
  [0, -1], [-1, 0], [-1, -1], [-1, 1],
];
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const key = (r: number, c: number) => `${r}-${c}`;

interface Placed {
  text: string;
  keys: string[];
  color: string;
}

function generate(): { grid: string[][]; placed: Placed[] } {
  const grid: string[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill("")
  );
  const pool = [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, 10);
  const placed: Placed[] = [];

  pool.forEach((word, wi) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r0 = Math.floor(Math.random() * SIZE);
      const c0 = Math.floor(Math.random() * SIZE);
      const rEnd = r0 + dr * (word.length - 1);
      const cEnd = c0 + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= SIZE || cEnd < 0 || cEnd >= SIZE) continue;
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const ch = grid[r0 + dr * i][c0 + dc * i];
        if (ch !== "" && ch !== word[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const keys: string[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        grid[r][c] = word[i];
        keys.push(key(r, c));
      }
      placed.push({ text: word, keys, color: COLORS[wi % COLORS.length] });
      return;
    }
  });

  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === "") grid[r][c] = ALPHA[Math.floor(Math.random() * 26)];

  return { grid, placed };
}

/** Cells on the straight line between two cells, or just the start if off-axis. */
function linePath(r0: number, c0: number, r1: number, c1: number): string[] {
  const dr = r1 - r0;
  const dc = c1 - c0;
  if (dr === 0 && dc === 0) return [key(r0, c0)];
  const straight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!straight) return [key(r0, c0)];
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const out: string[] = [];
  for (let i = 0; i <= steps; i++) out.push(key(r0 + sr * i, c0 + sc * i));
  return out;
}

export default function WordSearch() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<{ text: string; found: boolean }[]>([]);
  const [foundCells, setFoundCells] = useState<Record<string, string>>({});
  const [selPath, setSelPath] = useState<string[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef<Placed[]>([]);
  const startRef = useRef<{ r: number; c: number } | null>(null);

  const newGame = useCallback(() => {
    const { grid: g, placed } = generate();
    placedRef.current = placed;
    startRef.current = null;
    setGrid(g);
    setWords(placed.map((p) => ({ text: p.text, found: false })));
    setFoundCells({});
    setSelPath([]);
  }, []);

  useEffect(() => {
    newGame();
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, [newGame]);

  const commitSelection = useCallback((path: string[]) => {
    if (path.length < 2) return;
    const fwd = path.join("|");
    const rev = [...path].reverse().join("|");
    for (const p of placedRef.current) {
      const pk = p.keys.join("|");
      if (pk === fwd || pk === rev) {
        setWords((prev) =>
          prev.map((w) => (w.text === p.text ? { ...w, found: true } : w))
        );
        setFoundCells((prev) => {
          const next = { ...prev };
          for (const k of p.keys) next[k] = p.color;
          return next;
        });
        return;
      }
    }
  }, []);

  // Board-level pointer handling (delegation) for drag selection.
  useEffect(() => {
    const board = boardRef.current;
    if (!board || grid.length === 0) return;
    const cellFrom = (e: PointerEvent) => {
      const rect = board.getBoundingClientRect();
      const c = Math.max(0, Math.min(SIZE - 1, Math.floor((e.clientX - rect.left) / (rect.width / SIZE))));
      const r = Math.max(0, Math.min(SIZE - 1, Math.floor((e.clientY - rect.top) / (rect.height / SIZE))));
      return { r, c };
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      const { r, c } = cellFrom(e);
      startRef.current = { r, c };
      try {
        board.setPointerCapture(e.pointerId);
      } catch {}
      setSelPath([key(r, c)]);
    };
    const move = (e: PointerEvent) => {
      if (!startRef.current) return;
      const { r, c } = cellFrom(e);
      setSelPath(linePath(startRef.current.r, startRef.current.c, r, c));
    };
    const up = () => {
      if (!startRef.current) return;
      startRef.current = null;
      setSelPath((path) => {
        commitSelection(path);
        return [];
      });
    };
    board.addEventListener("pointerdown", down);
    board.addEventListener("pointermove", move);
    board.addEventListener("pointerup", up);
    board.addEventListener("pointercancel", up);
    return () => {
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointermove", move);
      board.removeEventListener("pointerup", up);
      board.removeEventListener("pointercancel", up);
    };
  }, [grid, commitSelection]);

  const allFound = words.length > 0 && words.every((w) => w.found);
  const selSet = new Set(selPath);

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Word Search</h1>
        <div className={styles.score}>
          Found: {words.filter((w) => w.found).length}/{words.length}
        </div>

        <div className={styles.stage}>
          <div ref={boardRef} className={styles.board}>
            {grid.map((row, r) =>
              row.map((ch, c) => {
                const k = key(r, c);
                const found = foundCells[k];
                const sel = selSet.has(k);
                return (
                  <div
                    key={k}
                    className={`${styles.cell} ${sel ? styles.sel : ""}`}
                    style={
                      found
                        ? { backgroundColor: `${found}33`, color: found, borderColor: `${found}88` }
                        : undefined
                    }
                  >
                    {ch}
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.wordList}>
            {words.map((w) => (
              <span
                key={w.text}
                className={`${styles.word} ${w.found ? styles.wordFound : ""}`}
              >
                {w.text}
              </span>
            ))}
          </div>

          {allFound && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>ALL TRACES FOUND</p>
              <p className={styles.overlayText}>
                Every hidden term decoded. Scan a fresh grid?
              </p>
              <button className={styles.button} onClick={newGame}>
                New Grid
              </button>
            </div>
          )}
        </div>

        <button className={styles.button} onClick={newGame}>
          New Grid
        </button>
      </div>
    </div>
  );
}
