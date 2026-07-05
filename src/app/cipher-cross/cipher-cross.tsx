"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./cipher-cross.module.css";

const ROWS = 10;
const COLS = 10;

type Dir = "across" | "down";
interface Entry {
  answer: string;
  row: number;
  col: number;
  dir: Dir;
  clue: string;
}

// A hand-authored, fully-interlocking cyber crossword (verified crossings).
const ENTRIES: Entry[] = [
  { answer: "FIREWALL", row: 3, col: 2, dir: "across", clue: "Network security barrier" },
  { answer: "CODE", row: 5, col: 0, dir: "across", clue: "Source ___; what a programmer writes" },
  { answer: "TOKEN", row: 9, col: 5, dir: "across", clue: "Session auth credential" },
  { answer: "DATA", row: 0, col: 7, dir: "down", clue: "What packets carry" },
  { answer: "URL", row: 1, col: 9, dir: "down", clue: "Web address, for short" },
  { answer: "ICE", row: 3, col: 3, dir: "down", clue: "Cyberpunk security (Intrusion Countermeasures Electronics)" },
  { answer: "EXPLOIT", row: 3, col: 5, dir: "down", clue: "Attack that abuses a vulnerability" },
];

interface Built {
  solution: (string | null)[][];
  numbers: number[][];
  across: { num: number; clue: string }[];
  down: { num: number; clue: string }[];
}

function build(): Built {
  const solution: (string | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  for (const e of ENTRIES) {
    const [dr, dc] = e.dir === "across" ? [0, 1] : [1, 0];
    for (let i = 0; i < e.answer.length; i++) {
      solution[e.row + dr * i][e.col + dc * i] = e.answer[i];
    }
  }
  const white = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS && solution[r][c] !== null;

  const numbers: number[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(0)
  );
  let n = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (!white(r, c)) continue;
      const startA = !white(r, c - 1) && white(r, c + 1);
      const startD = !white(r - 1, c) && white(r + 1, c);
      if (startA || startD) numbers[r][c] = ++n;
    }

  const across: { num: number; clue: string }[] = [];
  const down: { num: number; clue: string }[] = [];
  for (const e of ENTRIES) {
    const num = numbers[e.row][e.col];
    (e.dir === "across" ? across : down).push({ num, clue: e.clue });
  }
  across.sort((a, b) => a.num - b.num);
  down.sort((a, b) => a.num - b.num);
  return { solution, numbers, across, down };
}

export default function CipherCross() {
  const { solution, numbers, across, down } = useMemo(() => build(), []);
  const white = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS && solution[r][c] !== null;

  const [user, setUser] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 3, c: 2 });
  const [dir, setDir] = useState<Dir>("across");
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const hasWord = (r: number, c: number, d: Dir) => {
    const [dr, dc] = d === "across" ? [0, 1] : [1, 0];
    return white(r + dr, c + dc) || white(r - dr, c - dc);
  };

  const wordCells = (r: number, c: number, d: Dir): [number, number][] => {
    if (!white(r, c)) return [];
    const [dr, dc] = d === "across" ? [0, 1] : [1, 0];
    let sr = r;
    let sc = c;
    while (white(sr - dr, sc - dc)) {
      sr -= dr;
      sc -= dc;
    }
    const cells: [number, number][] = [];
    let cr = sr;
    let cc = sc;
    while (white(cr, cc)) {
      cells.push([cr, cc]);
      cr += dr;
      cc += dc;
    }
    return cells;
  };

  const selectCell = (r: number, c: number) => {
    if (!white(r, c)) return;
    if (sel.r === r && sel.c === c) {
      const other: Dir = dir === "across" ? "down" : "across";
      if (hasWord(r, c, other)) setDir(other);
    } else {
      setSel({ r, c });
      if (!hasWord(r, c, dir)) setDir(dir === "across" ? "down" : "across");
    }
    inputRef.current?.focus();
  };

  const checkWin = (grid: string[][]) => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (white(r, c) && grid[r][c] !== solution[r][c]) return false;
    return true;
  };

  const typeLetter = (ch: string) => {
    setUser((prev) => {
      const g = prev.map((row) => [...row]);
      g[sel.r][sel.c] = ch;
      if (checkWin(g)) setSolved(true);
      return g;
    });
    // Advance within the current word.
    const cells = wordCells(sel.r, sel.c, dir);
    const idx = cells.findIndex(([r, c]) => r === sel.r && c === sel.c);
    if (idx >= 0 && idx < cells.length - 1) {
      const [nr, nc] = cells[idx + 1];
      setSel({ r: nr, c: nc });
    }
  };

  const backspace = () => {
    setUser((prev) => {
      const g = prev.map((row) => [...row]);
      if (g[sel.r][sel.c]) {
        g[sel.r][sel.c] = "";
      } else {
        const cells = wordCells(sel.r, sel.c, dir);
        const idx = cells.findIndex(([r, c]) => r === sel.r && c === sel.c);
        if (idx > 0) {
          const [pr, pc] = cells[idx - 1];
          g[pr][pc] = "";
          setSel({ r: pr, c: pc });
        }
      }
      return g;
    });
  };

  const move = (dr: number, dc: number) => {
    let r = sel.r + dr;
    let c = sel.c + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && !white(r, c)) {
      r += dr;
      c += dc;
    }
    if (white(r, c)) {
      setSel({ r, c });
      setDir(dr === 0 ? "across" : "down");
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key.toUpperCase());
    } else if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (e.key === "ArrowRight") move(0, 1);
    else if (e.key === "ArrowLeft") move(0, -1);
    else if (e.key === "ArrowUp") move(-1, 0);
    else if (e.key === "ArrowDown") move(1, 0);
  };

  const wordSet = new Set(
    wordCells(sel.r, sel.c, dir).map(([r, c]) => `${r}-${c}`)
  );

  const activeClue = (() => {
    const cells = wordCells(sel.r, sel.c, dir);
    if (!cells.length) return "";
    const [sr, sc] = cells[0];
    const num = numbers[sr][sc];
    const list = dir === "across" ? across : down;
    return list.find((e) => e.num === num)?.clue ?? "";
  })();

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Cipher Cross</h1>

        <input
          ref={inputRef}
          className={styles.hiddenInput}
          onKeyDown={onKey}
          value=""
          onChange={() => {}}
          aria-label="Crossword input"
        />

        <div className={styles.activeClue}>
          {activeClue ? `${dir === "across" ? "Across" : "Down"}: ${activeClue}` : "Tap a cell to start"}
        </div>

        <div className={styles.layout}>
          <div className={styles.board}>
            {solution.map((row, r) =>
              row.map((letter, c) => {
                if (letter === null)
                  return <div key={`${r}-${c}`} className={styles.blackCell} />;
                const isSel = sel.r === r && sel.c === c;
                const inWord = wordSet.has(`${r}-${c}`);
                const val = user[r][c];
                const wrong = checked && val && val !== letter;
                const cls = [styles.cell];
                if (isSel) cls.push(styles.selCell);
                else if (inWord) cls.push(styles.wordCell);
                if (wrong) cls.push(styles.wrong);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={cls.join(" ")}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      selectCell(r, c);
                    }}
                  >
                    {numbers[r][c] > 0 && (
                      <span className={styles.num}>{numbers[r][c]}</span>
                    )}
                    <span className={styles.letter}>{val}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.clues}>
            <div className={styles.clueCol}>
              <h3 className={styles.clueHead}>Across</h3>
              {across.map((e) => (
                <p key={`a${e.num}`} className={styles.clue}>
                  <strong>{e.num}.</strong> {e.clue}
                </p>
              ))}
            </div>
            <div className={styles.clueCol}>
              <h3 className={styles.clueHead}>Down</h3>
              {down.map((e) => (
                <p key={`d${e.num}`} className={styles.clue}>
                  <strong>{e.num}.</strong> {e.clue}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={() => setChecked((v) => !v)}>
            {checked ? "Hide Check" : "Check"}
          </button>
          <button
            className={styles.button}
            onClick={() => {
              setUser(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
              setChecked(false);
              setSolved(false);
            }}
          >
            Clear
          </button>
        </div>

        {solved && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <p className={styles.overlayTitle}>CIPHER CRACKED</p>
              <p className={styles.overlayText}>
                Every entry decoded. Nicely solved.
              </p>
              <button
                className={styles.button}
                onClick={() => {
                  setUser(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
                  setChecked(false);
                  setSolved(false);
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
