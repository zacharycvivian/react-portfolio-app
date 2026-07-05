"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./sudoku.module.css";

type Grid = number[][];

const DIFFS = [
  { name: "Easy", givens: 42 },
  { name: "Medium", givens: 34 },
  { name: "Hard", givens: 28 },
];

const clone = (g: Grid): Grid => g.map((row) => [...row]);
const zeros = (): Grid => Array.from({ length: 9 }, () => Array(9).fill(0));

function valid(g: Grid, r: number, c: number, v: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (g[r][i] === v || g[i][c] === v) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++) if (g[br + dr][bc + dc] === v) return false;
  return true;
}

function findEmpty(g: Grid): [number, number] | null {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) if (g[r][c] === 0) return [r, c];
  return null;
}

function fill(g: Grid): boolean {
  const e = findEmpty(g);
  if (!e) return true;
  const [r, c] = e;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (const v of nums) {
    if (valid(g, r, c, v)) {
      g[r][c] = v;
      if (fill(g)) return true;
      g[r][c] = 0;
    }
  }
  return false;
}

/** Count solutions, capped (used to guarantee uniqueness). */
function countSolutions(g: Grid, cap: number): number {
  const e = findEmpty(g);
  if (!e) return 1;
  const [r, c] = e;
  let total = 0;
  for (let v = 1; v <= 9; v++) {
    if (valid(g, r, c, v)) {
      g[r][c] = v;
      total += countSolutions(g, cap - total);
      g[r][c] = 0;
      if (total >= cap) return total;
    }
  }
  return total;
}

function generate(givens: number): { puzzle: Grid; solution: Grid } {
  const solution = zeros();
  fill(solution);
  const puzzle = clone(solution);
  const positions = Array.from({ length: 81 }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );
  let removed = 0;
  const target = 81 - givens;
  for (const pos of positions) {
    if (removed >= target) break;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    if (puzzle[r][c] === 0) continue;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(clone(puzzle), 2) !== 1) puzzle[r][c] = backup;
    else removed++;
  }
  return { puzzle, solution };
}

export default function Sudoku() {
  const [diff, setDiff] = useState<number | null>(null);
  const [puzzle, setPuzzle] = useState<Grid>(zeros());
  const [values, setValues] = useState<Grid>(zeros());
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [solved, setSolved] = useState(false);
  const selRef = useRef<{ r: number; c: number } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const start = (idx: number) => {
    const { puzzle: p } = generate(DIFFS[idx].givens);
    setDiff(idx);
    setPuzzle(p);
    setValues(clone(p));
    setSel(null);
    selRef.current = null;
    setSolved(false);
  };

  const setDigit = useCallback(
    (v: number) => {
      const s = selRef.current;
      if (!s) return;
      if (puzzle[s.r][s.c] !== 0) return; // given cell
      setValues((prev) => {
        const g = clone(prev);
        g[s.r][s.c] = v;
        // Win check: full board with no conflicts.
        let full = true;
        for (let r = 0; r < 9 && full; r++)
          for (let c = 0; c < 9; c++) if (g[r][c] === 0) full = false;
        if (full) {
          let good = true;
          for (let r = 0; r < 9 && good; r++)
            for (let c = 0; c < 9; c++) {
              const val = g[r][c];
              g[r][c] = 0;
              if (!valid(g, r, c, val)) good = false;
              g[r][c] = val;
            }
          if (good) setSolved(true);
        }
        return g;
      });
    },
    [puzzle]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selRef.current) return;
      if (e.key >= "1" && e.key <= "9") setDigit(Number(e.key));
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0")
        setDigit(0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDigit]);

  // Conflict detection for the current values.
  const conflicts = new Set<string>();
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const v = values[r]?.[c];
      if (!v) continue;
      const g = clone(values);
      g[r][c] = 0;
      if (!valid(g, r, c, v)) conflicts.add(`${r}-${c}`);
    }

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Sudoku</h1>

        <div className={styles.stage}>
          {diff != null && (
            <div className={styles.board}>
              {values.map((row, r) =>
                row.map((v, c) => {
                  const given = puzzle[r][c] !== 0;
                  const isSel = sel && sel.r === r && sel.c === c;
                  const sameNum =
                    sel && v !== 0 && values[sel.r]?.[sel.c] === v;
                  const cls = [styles.cell];
                  if (given) cls.push(styles.given);
                  if (isSel) cls.push(styles.selCell);
                  if (sameNum && !isSel) cls.push(styles.sameNum);
                  if (conflicts.has(`${r}-${c}`)) cls.push(styles.conflict);
                  if (c % 3 === 2 && c !== 8) cls.push(styles.borderRight);
                  if (r % 3 === 2 && r !== 8) cls.push(styles.borderBottom);
                  return (
                    <button
                      key={`${r}-${c}`}
                      className={cls.join(" ")}
                      onClick={() => {
                        setSel({ r, c });
                        selRef.current = { r, c };
                      }}
                    >
                      {v !== 0 ? v : ""}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {diff == null && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>DECRYPT THE GRID</p>
              <p className={styles.overlayText}>
                Fill every row, column, and 3×3 box with the digits 1–9. Pick a
                difficulty:
              </p>
              <div className={styles.row}>
                {DIFFS.map((d, i) => (
                  <button key={d.name} className={styles.button} onClick={() => start(i)}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {solved && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>GRID DECRYPTED</p>
              <p className={styles.overlayText}>Every constraint satisfied. Clean solve.</p>
              <div className={styles.row}>
                <button className={styles.button} onClick={() => diff != null && start(diff)}>
                  New Puzzle
                </button>
                <button className={styles.button} onClick={() => setDiff(null)}>
                  Difficulty
                </button>
              </div>
            </div>
          )}
        </div>

        {diff != null && !solved && (
          <div className={styles.pad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} className={styles.padBtn} onClick={() => setDigit(n)}>
                {n}
              </button>
            ))}
            <button className={styles.padBtn} onClick={() => setDigit(0)}>
              ⌫
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
