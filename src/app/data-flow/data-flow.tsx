"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./data-flow.module.css";

// A Flow Free clone: connect matching ports with signal cables so that every
// cell on the grid is filled and no two cables cross.

interface Cell {
  r: number;
  c: number;
}
interface Puzzle {
  rows: number;
  cols: number;
  colors: number;
  endpoints: { a: Cell; b: Cell }[]; // indexed by colour
}

// Level ladder: [rows, cols, colours].
const LEVELS: [number, number, number][] = [
  [5, 5, 4],
  [5, 5, 5],
  [6, 6, 5],
  [6, 6, 6],
  [7, 7, 6],
  [7, 7, 7],
];

const COLORS = [
  "#38e6ff", // cyan
  "#39ff88", // green
  "#f4c04a", // amber
  "#ff5ac8", // magenta
  "#ff5a4d", // red
  "#5a8bff", // blue
  "#b06bff", // violet
  "#ff8a3d", // orange
];

const same = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c;
const adjacent = (a: Cell, b: Cell) =>
  Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Randomised DFS Hamiltonian path over the whole grid (or null if it gives up). */
function hamiltonian(rows: number, cols: number): Cell[] | null {
  const N = rows * cols;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path: Cell[] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  let steps = 0;
  const cap = 300000;

  const dfs = (r: number, c: number): boolean => {
    if (++steps > cap) return false;
    visited[r][c] = true;
    path.push({ r, c });
    if (path.length === N) return true;
    for (const [dr, dc] of shuffle([...dirs])) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        if (dfs(nr, nc)) return true;
      }
    }
    visited[r][c] = false;
    path.pop();
    return false;
  };

  if (dfs(Math.floor(Math.random() * rows), Math.floor(Math.random() * cols))) {
    return path;
  }
  return null;
}

/** Guaranteed Hamiltonian path (boustrophedon) as a fallback. */
function snake(rows: number, cols: number): Cell[] {
  const path: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) for (let c = 0; c < cols; c++) path.push({ r, c });
    else for (let c = cols - 1; c >= 0; c--) path.push({ r, c });
  }
  return path;
}

/**
 * Build a puzzle by cutting a Hamiltonian path into contiguous segments — the
 * union of segments covers every cell, so a full-fill solution is guaranteed.
 */
function makePuzzle(rows: number, cols: number, numColors: number): Puzzle {
  const path = hamiltonian(rows, cols) ?? snake(rows, cols);
  const N = path.length;
  const k = Math.min(numColors, Math.floor(N / 2));
  const lengths = Array(k).fill(2);
  let extra = N - 2 * k;
  while (extra > 0) {
    lengths[Math.floor(Math.random() * k)] += 1;
    extra -= 1;
  }
  const endpoints: { a: Cell; b: Cell }[] = [];
  let idx = 0;
  for (let color = 0; color < k; color++) {
    const seg = path.slice(idx, idx + lengths[color]);
    endpoints.push({ a: seg[0], b: seg[seg.length - 1] });
    idx += lengths[color];
  }
  return { rows, cols, colors: k, endpoints };
}

export default function DataFlow() {
  const [level, setLevel] = useState(0);
  const [solved, setSolved] = useState(false);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [owner, setOwner] = useState<number[][]>([]);
  const [endpointGrid, setEndpointGrid] = useState<number[][]>([]);

  // Mutable source of truth for the drag logic (read only in handlers/effects).
  const boardRef = useRef<HTMLDivElement>(null);
  const puzzleRef = useRef<Puzzle | null>(null);
  const pathsRef = useRef<Cell[][]>([]);
  const ownerRef = useRef<number[][]>([]);
  const endpointRef = useRef<number[][]>([]);
  const activeRef = useRef<number>(-1);
  const solvedRef = useRef(false);

  const recomputeOwner = useCallback(() => {
    const p = puzzleRef.current;
    if (!p) return;
    const grid: number[][] = Array.from({ length: p.rows }, () =>
      Array(p.cols).fill(-1)
    );
    p.endpoints.forEach((ep, color) => {
      grid[ep.a.r][ep.a.c] = color;
      grid[ep.b.r][ep.b.c] = color;
    });
    pathsRef.current.forEach((path, color) => {
      for (const cell of path) grid[cell.r][cell.c] = color;
    });
    ownerRef.current = grid;
  }, []);

  const isSolved = useCallback(() => {
    const p = puzzleRef.current;
    if (!p) return false;
    for (let r = 0; r < p.rows; r++)
      for (let c = 0; c < p.cols; c++)
        if (ownerRef.current[r][c] === -1) return false;
    for (let color = 0; color < p.colors; color++) {
      const path = pathsRef.current[color];
      if (path.length < 2) return false;
      const e0 = path[0];
      const e1 = path[path.length - 1];
      const { a, b } = p.endpoints[color];
      const ok = (same(e0, a) && same(e1, b)) || (same(e0, b) && same(e1, a));
      if (!ok) return false;
    }
    return true;
  }, []);

  const syncView = useCallback(() => {
    setOwner(ownerRef.current);
    const s = isSolved();
    solvedRef.current = s;
    setSolved(s);
  }, [isSolved]);

  const loadLevel = useCallback(
    (lvl: number) => {
      const [rows, cols, colors] = LEVELS[lvl % LEVELS.length];
      const p = makePuzzle(rows, cols, colors);
      puzzleRef.current = p;
      pathsRef.current = p.endpoints.map(() => []);
      const eg: number[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(-1)
      );
      p.endpoints.forEach((ep, color) => {
        eg[ep.a.r][ep.a.c] = color;
        eg[ep.b.r][ep.b.c] = color;
      });
      endpointRef.current = eg;
      activeRef.current = -1;
      solvedRef.current = false;
      recomputeOwner();
      setPuzzle(p);
      setEndpointGrid(eg);
      setOwner(ownerRef.current);
      setSolved(false);
    },
    [recomputeOwner]
  );

  useEffect(() => {
    loadLevel(0);
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, [loadLevel]);

  const begin = useCallback(
    (cell: Cell) => {
      if (solvedRef.current) return;
      const ep = endpointRef.current[cell.r][cell.c];
      const own = ownerRef.current[cell.r][cell.c];
      if (ep !== -1) {
        pathsRef.current[ep] = [cell];
        activeRef.current = ep;
      } else if (own !== -1) {
        const path = pathsRef.current[own];
        const idx = path.findIndex((pp) => same(pp, cell));
        if (idx === -1) return;
        pathsRef.current[own] = path.slice(0, idx + 1);
        activeRef.current = own;
      } else {
        return;
      }
      recomputeOwner();
      syncView();
    },
    [recomputeOwner, syncView]
  );

  const extend = useCallback(
    (cell: Cell) => {
      const color = activeRef.current;
      if (color === -1) return;
      const path = pathsRef.current[color];
      if (path.length === 0) return;
      const last = path[path.length - 1];
      if (!adjacent(cell, last)) return;

      // Backtrack onto the previous cell.
      if (path.length >= 2 && same(cell, path[path.length - 2])) {
        path.pop();
        recomputeOwner();
        syncView();
        return;
      }

      // The far port terminates the cable (only backtracking allowed after).
      const lastIsFarPort =
        path.length >= 2 &&
        endpointRef.current[last.r][last.c] === color &&
        !same(last, path[0]);
      if (lastIsFarPort) return;

      if (path.some((pp) => same(pp, cell))) return; // no self-crossing
      const ep = endpointRef.current[cell.r][cell.c];
      if (ep !== -1 && ep !== color) return; // can't route through another port

      // Entering another colour's cable cuts it back to before this cell.
      const own = ownerRef.current[cell.r][cell.c];
      if (own !== -1 && own !== color) {
        const yi = pathsRef.current[own].findIndex((pp) => same(pp, cell));
        if (yi !== -1) {
          pathsRef.current[own] = pathsRef.current[own].slice(0, yi);
        }
      }

      path.push(cell);
      recomputeOwner();
      syncView();
    },
    [recomputeOwner, syncView]
  );

  const endDrag = useCallback(() => {
    if (activeRef.current === -1) return;
    activeRef.current = -1;
    syncView();
  }, [syncView]);

  // Pointer interaction via delegation on the board (robust for fast drags).
  useEffect(() => {
    const board = boardRef.current;
    if (!board || !puzzle) return;
    const { rows, cols } = puzzle;
    let lastKey = "";

    const cellFrom = (e: PointerEvent): Cell => {
      const rect = board.getBoundingClientRect();
      const c = Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - rect.left) / (rect.width / cols))));
      const r = Math.max(0, Math.min(rows - 1, Math.floor((e.clientY - rect.top) / (rect.height / rows))));
      return { r, c };
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      const cell = cellFrom(e);
      lastKey = `${cell.r}-${cell.c}`;
      try {
        board.setPointerCapture(e.pointerId);
      } catch {}
      begin(cell);
    };
    const move = (e: PointerEvent) => {
      if (activeRef.current === -1) return;
      const cell = cellFrom(e);
      const key = `${cell.r}-${cell.c}`;
      if (key === lastKey) return;
      lastKey = key;
      extend(cell);
    };
    board.addEventListener("pointerdown", down);
    board.addEventListener("pointermove", move);
    board.addEventListener("pointerup", endDrag);
    board.addEventListener("pointercancel", endDrag);
    return () => {
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointermove", move);
      board.removeEventListener("pointerup", endDrag);
      board.removeEventListener("pointercancel", endDrag);
    };
  }, [puzzle, begin, extend, endDrag]);

  const resetBoard = () => {
    const p = puzzleRef.current;
    if (!p) return;
    pathsRef.current = p.endpoints.map(() => []);
    activeRef.current = -1;
    solvedRef.current = false;
    recomputeOwner();
    setOwner(ownerRef.current);
    setSolved(false);
  };

  let filled = 0;
  if (puzzle) {
    for (let r = 0; r < puzzle.rows; r++)
      for (let c = 0; c < puzzle.cols; c++)
        if ((owner[r]?.[c] ?? -1) !== -1) filled += 1;
  }
  const total = puzzle ? puzzle.rows * puzzle.cols : 0;
  const percent = total ? Math.round((filled / total) * 100) : 0;

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Data Flow</h1>
        <div className={styles.score}>
          Level: {level + 1}
          <span className={styles.scoreDivider}>·</span>
          Routed: {percent}%
        </div>

        <div className={styles.stage}>
          {puzzle && (
            <div
              ref={boardRef}
              className={styles.board}
              style={{
                gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
                gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
                width: `min(90vw, ${puzzle.cols * 62}px)`,
                height: `min(90vw, ${puzzle.cols * 62}px)`,
              }}
            >
              {Array.from({ length: puzzle.rows }).flatMap((_, r) =>
                Array.from({ length: puzzle.cols }).map((__, c) => {
                  const o = owner[r]?.[c] ?? -1;
                  const ep = endpointGrid[r]?.[c] ?? -1;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={styles.cell}
                      style={
                        o !== -1
                          ? {
                              backgroundColor: `${COLORS[o]}2e`,
                              boxShadow: `inset 0 0 0 1px ${COLORS[o]}55`,
                            }
                          : undefined
                      }
                    >
                      {o !== -1 && (
                        <span
                          className={styles.pipe}
                          style={{ background: COLORS[o] }}
                        />
                      )}
                      {ep !== -1 && (
                        <span
                          className={styles.port}
                          style={{
                            background: COLORS[ep],
                            boxShadow: `0 0 14px ${COLORS[ep]}`,
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {solved && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>SIGNAL ROUTED</p>
              <p className={styles.overlayText}>
                Every port linked and the grid is full. Nice routing.
              </p>
              <button
                className={styles.button}
                onClick={() => {
                  const next = level + 1;
                  setLevel(next);
                  loadLevel(next);
                }}
              >
                Next Grid
              </button>
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Drag from a port to route a cable. Connect both ports of every colour
          and fill every cell.
        </p>
        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={resetBoard}>
            Reset
          </button>
          <button className={styles.button} onClick={() => loadLevel(level)}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
