"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./binary-breach.module.css";

// A 2048 variant: every tile is a power of two, so the whole board is binary.
const SIZE = 4;
type Board = number[][];
type Dir = "left" | "right" | "up" | "down";

const emptyBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
const clone = (b: Board): Board => b.map((r) => [...r]);
const reverse = (b: Board): Board => b.map((r) => [...r].reverse());

function transpose(b: Board): Board {
  const nb = emptyBoard();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) nb[c][r] = b[r][c];
  return nb;
}

function emptyCells(b: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (b[r][c] === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile(b: Board): Board {
  const cells = emptyCells(b);
  if (!cells.length) return b;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const nb = clone(b);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

/** Compress + merge a single row toward the left. */
function slide(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((n) => n !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const merged = nums[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume the partner
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

/** Rotate the board so any move becomes a left-slide, then rotate back. */
function moveBoard(b: Board, dir: Dir): { board: Board; gained: number; moved: boolean } {
  let work = clone(b);
  if (dir === "right") work = reverse(work);
  else if (dir === "up") work = transpose(work);
  else if (dir === "down") work = reverse(transpose(work));

  let gained = 0;
  let result = work.map((row) => {
    const s = slide(row);
    gained += s.gained;
    return s.row;
  });

  if (dir === "right") result = reverse(result);
  else if (dir === "up") result = transpose(result);
  else if (dir === "down") result = transpose(reverse(result));

  const moved = JSON.stringify(result) !== JSON.stringify(b);
  return { board: result, gained, moved };
}

function canMove(b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return true;
      if (c + 1 < SIZE && b[r][c] === b[r][c + 1]) return true;
      if (r + 1 < SIZE && b[r][c] === b[r + 1][c]) return true;
    }
  return false;
}

const initBoard = (): Board => addRandomTile(addRandomTile(emptyBoard()));

/** Tile colour ramps cyan → amber as the value climbs. */
function tileStyle(v: number): React.CSSProperties {
  const exp = Math.log2(v);
  const hue = Math.max(28, 196 - exp * 16);
  return {
    background: `linear-gradient(135deg, hsl(${hue} 100% 68%), hsl(${hue} 92% 46%))`,
    color: exp <= 2 ? "#04121a" : "#160a02",
    boxShadow: `0 0 16px hsla(${hue}, 100%, 60%, 0.5)`,
    fontSize: v >= 1024 ? "22px" : v >= 128 ? "27px" : "34px",
  };
}

const KEY_DIRS: Record<string, Dir> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

export default function BinaryBreach() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);

  const boardRef = useRef<Board>(board);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overRef = useRef(false);
  const wonRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(() => {
    const b = initBoard();
    boardRef.current = b;
    scoreRef.current = 0;
    overRef.current = false;
    wonRef.current = false;
    setBoard(b);
    setScore(0);
    setOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem("binaryBreachBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    start();
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, [start]);

  const doMove = useCallback((dir: Dir) => {
    if (overRef.current) return;
    const { board: nb, gained, moved } = moveBoard(boardRef.current, dir);
    if (!moved) return;

    const withTile = addRandomTile(nb);
    boardRef.current = withTile;
    setBoard(withTile);

    const newScore = scoreRef.current + gained;
    scoreRef.current = newScore;
    setScore(newScore);
    if (newScore > bestRef.current) {
      bestRef.current = newScore;
      setBest(newScore);
      try {
        localStorage.setItem("binaryBreachBest", String(newScore));
      } catch {}
    }

    if (!wonRef.current && withTile.some((row) => row.some((v) => v >= 2048))) {
      wonRef.current = true;
      setWon(true);
    }
    if (!canMove(withTile)) {
      overRef.current = true;
      setOver(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Binary Breach</h1>
        <div className={styles.score}>
          Score: {score}
          <span className={styles.scoreDivider}>·</span>
          Best: {best}
        </div>

        <div className={styles.stage}>
          <div
            className={styles.board}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {board.flatMap((row, r) =>
              row.map((v, c) => (
                <div key={`${r}-${c}`} className={styles.cell}>
                  {v > 0 && (
                    <div className={styles.tile} style={tileStyle(v)}>
                      {v}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {won && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>BREACH SUCCESSFUL</p>
              <p className={styles.overlayText}>
                You reached 2048. Keep merging for a higher score.
              </p>
              <button
                className={styles.button}
                onClick={() => setWon(false)}
              >
                Keep Hacking
              </button>
            </div>
          )}

          {over && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>GRID LOCKED</p>
              <p className={styles.overlayText}>
                No moves left. Final score: {score}.
              </p>
              <button className={styles.button} onClick={start}>
                Reboot
              </button>
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Merge matching powers of two with the arrow keys or a swipe.
        </p>
        <button className={styles.button} onClick={start}>
          New Game
        </button>
      </div>
    </div>
  );
}
