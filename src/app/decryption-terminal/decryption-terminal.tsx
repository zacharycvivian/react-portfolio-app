"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./decryption-terminal.module.css";

// ── Constants ─────────────────────────────────────────────────
const W = 560;
const H = 560;
const FLOOR_Y = H - 34; // words past this line breach the firewall
const MARGIN = 16;
const FONT = 18;
const CHAR_W = 11; // approx advance width of 18px monospace
const START_LIVES = 3;

const WORDS = [
  "CIPHER", "PACKET", "BREACH", "EXPLOIT", "PAYLOAD", "FIREWALL", "MALWARE",
  "PHISH", "ROOTKIT", "TROJAN", "VECTOR", "ZERODAY", "ENTROPY", "KERNEL",
  "DAEMON", "SANDBOX", "BOTNET", "SPOOF", "INJECT", "DECRYPT", "ENCRYPT",
  "TOKEN", "SESSION", "COOKIE", "PROXY", "TUNNEL", "BACKDOOR", "KEYLOG",
  "BRUTE", "SNIFFER", "SPYWARE", "RANSOM", "PATCH", "BINARY", "SUBNET",
  "ROUTER", "NONCE", "BUFFER", "OVERFLOW", "SHELL", "SCRIPT", "ATTACK",
  "SECURE", "HASH", "SALT", "VULN",
];

type Status = "idle" | "playing" | "over";

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  typed: number;
}

interface GState {
  words: Word[];
  activeId: number | null;
  nextId: number;
  spawnTimer: number;
  elapsed: number;
  animTime: number;
  lives: number;
  score: number;
  over: boolean;
}

function freshState(): GState {
  return {
    words: [],
    activeId: null,
    nextId: 1,
    spawnTimer: 0.6,
    elapsed: 0,
    animTime: 0,
    lives: START_LIVES,
    score: 0,
    over: false,
  };
}

function spawnWord(g: GState) {
  const text = WORDS[Math.floor(Math.random() * WORDS.length)];
  const maxX = W - MARGIN - text.length * CHAR_W;
  const x = Math.max(MARGIN, MARGIN + Math.random() * (maxX - MARGIN));
  g.words.push({ id: g.nextId++, text, x, y: 10, typed: 0 });
}

function step(g: GState, dt: number) {
  g.animTime += dt;
  g.elapsed += dt;

  const fall = 42 + Math.min(g.score * 1.4, 95);
  for (const w of g.words) w.y += fall * dt;

  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0) {
    spawnWord(g);
    g.spawnTimer = Math.max(0.85, 2.1 - g.score * 0.028);
  }

  const survivors: Word[] = [];
  for (const w of g.words) {
    if (w.y > FLOOR_Y) {
      g.lives -= 1;
      if (w.id === g.activeId) g.activeId = null;
      if (g.lives <= 0) g.over = true;
    } else {
      survivors.push(w);
    }
  }
  g.words = survivors;
}

/** Route a typed character into the active word (or acquire a new target). */
function typeChar(g: GState, raw: string) {
  if (raw === "Backspace") {
    if (g.activeId != null) {
      const w = g.words.find((x) => x.id === g.activeId);
      if (w) {
        w.typed = Math.max(0, w.typed - 1);
        if (w.typed === 0) g.activeId = null;
      }
    }
    return;
  }
  if (raw.length !== 1) return;
  const ch = raw.toUpperCase();
  if (!/[A-Z0-9]/.test(ch)) return;

  if (g.activeId != null) {
    const w = g.words.find((x) => x.id === g.activeId);
    if (!w) {
      g.activeId = null;
      return;
    }
    if (w.text[w.typed] === ch) {
      w.typed += 1;
      if (w.typed >= w.text.length) {
        g.words = g.words.filter((x) => x.id !== w.id);
        g.activeId = null;
        g.score += 1;
      }
    }
    // wrong key: ignored, progress preserved
    return;
  }

  // No active target — grab the lowest word starting with this letter.
  let cand: Word | null = null;
  let maxY = -Infinity;
  for (const w of g.words) {
    if (w.typed === 0 && w.text[0] === ch && w.y > maxY) {
      cand = w;
      maxY = w.y;
    }
  }
  if (cand) {
    cand.typed = 1;
    g.activeId = cand.id;
    if (cand.text.length === 1) {
      const id = cand.id;
      g.words = g.words.filter((x) => x.id !== id);
      g.activeId = null;
      g.score += 1;
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Grid.
  ctx.save();
  ctx.strokeStyle = "rgba(80,200,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Scan-line.
  const scanY = ((g.animTime * 60) % (H + 40)) - 20;
  const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scan.addColorStop(0, "rgba(120,240,255,0)");
  scan.addColorStop(0.5, "rgba(120,240,255,0.06)");
  scan.addColorStop(1, "rgba(120,240,255,0)");
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 30, W, 60);

  // Breach line.
  ctx.save();
  ctx.strokeStyle = "rgba(255,90,70,0.7)";
  ctx.shadowColor = "rgba(255,80,60,0.8)";
  ctx.shadowBlur = 10;
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y + 8);
  ctx.lineTo(W, FLOOR_Y + 8);
  ctx.stroke();
  ctx.restore();

  // Falling words.
  ctx.font = `${FONT}px 'Courier New', monospace`;
  ctx.textBaseline = "alphabetic";
  for (const w of g.words) {
    const active = w.id === g.activeId;
    const typed = w.text.slice(0, w.typed);
    const rest = w.text.slice(w.typed);
    if (active) {
      const width = ctx.measureText(w.text).width;
      ctx.fillStyle = "rgba(120,240,255,0.14)";
      ctx.fillRect(w.x - 4, w.y - FONT, width + 8, FONT + 8);
    }
    if (typed) {
      ctx.save();
      ctx.fillStyle = "#7ef9ff";
      ctx.shadowColor = "rgba(120,240,255,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillText(typed, w.x, w.y);
      ctx.restore();
    }
    const tw = ctx.measureText(typed).width;
    ctx.fillStyle = active ? "rgba(235,250,255,0.95)" : "rgba(150,180,210,0.85)";
    ctx.fillText(rest, w.x + tw, w.y);
  }
}

export default function DecryptionTerminal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [best, setBest] = useState(0);

  const gameRef = useRef<GState>(freshState());
  const bestRef = useRef(0);
  const shown = useRef({ score: 0, lives: START_LIVES });

  useEffect(() => {
    const stored = Number(localStorage.getItem("decryptionBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshState();
    shown.current = { score: 0, lives: START_LIVES };
    setScore(0);
    setLives(START_LIVES);
    setStatus("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = gameRef.current;

    if (status !== "playing") {
      draw(ctx, g);
      const onKey = (e: KeyboardEvent) => {
        if (status === "idle" && (e.key.length === 1 || e.key === "Enter" || e.key === " ")) {
          startGame();
        } else if (status === "over" && (e.key === "Enter" || e.key === " ")) {
          startGame();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") e.preventDefault(); // never scroll the page
      typeChar(g, e.key);
    };
    window.addEventListener("keydown", onKey);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      step(g, dt);

      if (g.score !== shown.current.score) {
        shown.current.score = g.score;
        setScore(g.score);
      }
      if (g.lives !== shown.current.lives) {
        shown.current.lives = g.lives;
        setLives(g.lives);
      }

      draw(ctx, g);

      if (g.over) {
        if (g.score > bestRef.current) {
          bestRef.current = g.score;
          setBest(g.score);
          try {
            localStorage.setItem("decryptionBest", String(g.score));
          } catch {}
        }
        setStatus("over");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [status, startGame]);

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Decryption Terminal</h1>
        <div className={styles.score}>
          Decrypted: {score}
          <span className={styles.scoreDivider}>·</span>
          Integrity: {lives}
          <span className={styles.scoreDivider}>·</span>
          Best: {best}
        </div>

        <div className={styles.gameCanvasContainer}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {status === "idle" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                startGame();
              }}
            >
              <p className={styles.overlayTitle}>DECRYPTION TERMINAL</p>
              <p className={styles.overlayText}>
                Encrypted packets are dropping toward the firewall. Type each
                word to decrypt it before it breaches the line. Three breaches
                and you&apos;re locked out.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                startGame();
              }}
            >
              <p className={styles.overlayTitle}>LOCKED OUT</p>
              <p className={styles.overlayText}>
                You decrypted {score} packet{score === 1 ? "" : "s"} before the
                firewall fell.
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
