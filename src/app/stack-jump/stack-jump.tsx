"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./stack-jump.module.css";

const W = 420;
const H = 640;
const GRAVITY = 1500;
const BOUNCE_V = -790;
const MOVE = 360;
const PLAYER_W = 34;
const PLAYER_H = 34;
const PLAT_W = 66;
const PLAT_H = 14;
const SCROLL_LINE = H * 0.42;

type Status = "idle" | "playing" | "over";
type PlatType = "normal" | "moving" | "break";

interface Plat {
  x: number;
  y: number;
  type: PlatType;
  dx: number;
  broken: boolean;
}
interface GState {
  px: number;
  py: number;
  vy: number;
  platforms: Plat[];
  scroll: number;
  over: boolean;
  animTime: number;
  squash: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function addAbove(g: GState) {
  const minY = g.platforms.length
    ? Math.min(...g.platforms.map((p) => p.y))
    : H - 40;
  const gap = 58 + Math.random() * 40;
  const y = minY - gap;
  const x = 10 + Math.random() * (W - PLAT_W - 20);
  const score = g.scroll * 0.05;
  const roll = Math.random();
  let type: PlatType = "normal";
  if (score > 40 && roll < 0.18) type = "break";
  else if (score > 18 && roll < 0.32) type = "moving";
  g.platforms.push({
    x,
    y,
    type,
    dx: type === "moving" ? (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50) : 0,
    broken: false,
  });
}

function freshState(): GState {
  const g: GState = {
    px: W / 2 - PLAYER_W / 2,
    py: H - 80 - PLAYER_H,
    vy: BOUNCE_V,
    platforms: [{ x: W / 2 - PLAT_W / 2, y: H - 80, type: "normal", dx: 0, broken: false }],
    scroll: 0,
    over: false,
    animTime: 0,
    squash: 0,
  };
  while (Math.min(...g.platforms.map((p) => p.y)) > -4) addAbove(g);
  return g;
}

function step(g: GState, dir: number, dt: number) {
  g.animTime += dt;
  if (g.squash > 0) g.squash -= dt;

  g.vy += GRAVITY * dt;
  g.py += g.vy * dt;
  g.px += dir * MOVE * dt;

  // Horizontal wrap.
  if (g.px + PLAYER_W < 0) g.px = W;
  else if (g.px > W) g.px = -PLAYER_W;

  // Moving platforms.
  for (const p of g.platforms) {
    if (p.type !== "moving") continue;
    p.x += p.dx * dt;
    if (p.x < 0) {
      p.x = 0;
      p.dx = Math.abs(p.dx);
    } else if (p.x + PLAT_W > W) {
      p.x = W - PLAT_W;
      p.dx = -Math.abs(p.dx);
    }
  }

  // Bounce off platform tops while descending.
  if (g.vy > 0) {
    const feet = g.py + PLAYER_H;
    for (const p of g.platforms) {
      if (p.broken) continue;
      if (
        g.px + PLAYER_W > p.x + 4 &&
        g.px < p.x + PLAT_W - 4 &&
        feet >= p.y &&
        feet <= p.y + PLAT_H + 12
      ) {
        if (p.type === "break") {
          p.broken = true;
        } else {
          g.vy = BOUNCE_V;
          g.py = p.y - PLAYER_H;
          g.squash = 0.12;
        }
        break;
      }
    }
  }

  // Scroll the world down as the player climbs.
  if (g.py < SCROLL_LINE) {
    const dy = SCROLL_LINE - g.py;
    g.py = SCROLL_LINE;
    g.scroll += dy;
    for (const p of g.platforms) p.y += dy;
  }
  g.platforms = g.platforms.filter((p) => p.y < H + 20 && !p.broken);
  while (Math.min(...g.platforms.map((p) => p.y)) > -4) addAbove(g);

  if (g.py > H) g.over = true;
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Drifting grid tied to climb.
  ctx.strokeStyle = "rgba(80,200,255,0.06)";
  ctx.lineWidth = 1;
  const off = g.scroll % 40;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = -40 + off; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Platforms.
  for (const p of g.platforms) {
    let color = "#38e6ff";
    let glow = "rgba(120,240,255,0.8)";
    if (p.type === "moving") {
      color = "#f4c04a";
      glow = "rgba(244,192,74,0.8)";
    } else if (p.type === "break") {
      color = "#ff6a5a";
      glow = "rgba(255,90,70,0.8)";
    }
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + PLAT_H);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(10,20,30,0.7)");
    ctx.fillStyle = grad;
    rr(ctx, p.x, p.y, PLAT_W, PLAT_H, 5);
    ctx.fill();
    ctx.restore();
  }

  // Player — squashy cyan blob with eyes.
  const sq = g.squash > 0 ? g.squash / 0.12 : 0;
  const w = PLAYER_W * (1 + sq * 0.25);
  const h = PLAYER_H * (1 - sq * 0.3);
  const cx = g.px + PLAYER_W / 2;
  const cy = g.py + PLAYER_H / 2;
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 16;
  const bg = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  bg.addColorStop(0, "#9bfcff");
  bg.addColorStop(1, "#12a9d8");
  ctx.fillStyle = bg;
  rr(ctx, cx - w / 2, cy + PLAYER_H / 2 - h, w, h, 12);
  ctx.fill();
  ctx.restore();
  // Eyes.
  ctx.fillStyle = "rgba(6,20,30,0.9)";
  const eyeY = cy + PLAYER_H / 2 - h + h * 0.4;
  ctx.beginPath();
  ctx.arc(cx - 6, eyeY, 3, 0, Math.PI * 2);
  ctx.arc(cx + 6, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Height HUD.
  ctx.save();
  ctx.font = "bold 34px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillText(`${Math.floor(g.scroll * 0.05)}m`, W / 2, 56);
  ctx.restore();
}

export default function StackJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [height, setHeight] = useState(0);
  const [best, setBest] = useState(0);
  const [record, setRecord] = useState(false);

  const gameRef = useRef<GState>(freshState());
  const statusRef = useRef<Status>("idle");
  const bestRef = useRef(0);
  const overAtRef = useRef(0);
  const shownRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const pointerDirRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored = Number(localStorage.getItem("stackJumpBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshState();
    shownRef.current = 0;
    setHeight(0);
    setRecord(false);
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const maybeStart = () => {
      const s = statusRef.current;
      if (s === "idle") startGame();
      else if (s === "over" && performance.now() - overAtRef.current > 500) startGame();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = true;
      else if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = true;
      else if (e.code === "Space") { /* start only */ }
      else return;
      e.preventDefault();
      maybeStart();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = false;
      else if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = false;
    };
    const onDown = (e: PointerEvent) => {
      const rect = (container as HTMLElement).getBoundingClientRect();
      pointerDirRef.current = e.clientX - rect.left < rect.width / 2 ? -1 : 1;
      maybeStart();
    };
    const onUp = () => {
      pointerDirRef.current = 0;
    };
    container?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      container?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = W;
    canvas.height = H;
    const g = gameRef.current;

    if (status !== "playing") {
      draw(ctx, g);
      return;
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const dir = clamp(
        (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0) + pointerDirRef.current,
        -1,
        1
      );
      step(g, dir, dt);

      const m = Math.floor(g.scroll * 0.05);
      if (m !== shownRef.current) {
        shownRef.current = m;
        setHeight(m);
      }

      draw(ctx, g);

      if (g.over) {
        overAtRef.current = performance.now();
        const beat = m > bestRef.current;
        setRecord(beat);
        if (beat) {
          bestRef.current = m;
          setBest(m);
          try {
            localStorage.setItem("stackJumpBest", String(m));
          } catch {}
        }
        statusRef.current = "over";
        setStatus("over");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Stack Jump</h1>
        <div className={styles.score}>
          Height: {height} m
          <span className={styles.scoreDivider}>·</span>
          Best: {best} m
        </div>

        <div className={styles.gameCanvasContainer} ref={containerRef}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {status === "idle" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>CLIMB THE STACK</p>
              <p className={styles.overlayText}>
                You auto-bounce. Steer with arrows / A-D, or hold the left and
                right sides of the screen. Amber platforms drift, red ones
                shatter. Don&apos;t fall off the bottom.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>STACK OVERFLOW</p>
              <p className={styles.overlayText}>
                You climbed {height} m.{record ? " New record!" : ""}
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
