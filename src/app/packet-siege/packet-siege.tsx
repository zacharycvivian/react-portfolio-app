"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./packet-siege.module.css";

const W = 820;
const H = 460;
const GROUND = 418;
const ANCHOR_X = 132;
const ANCHOR_Y = GROUND - 66;
const PROJ_R = 13;
const GRAVITY = 1150;
const POWER = 9.5;
const MAX_PULL = 120;
const REST = 0.34;
const STOP_SPEED = 62;
const START_BIRDS = 3;

type Mat = "glass" | "wood" | "steel";
type Status = "idle" | "playing" | "over";
type Phase = "aim" | "fly" | "settle";

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  mat: Mat;
}
interface Pig {
  x: number;
  y: number;
  r: number;
  hp: number;
  max: number;
}
interface GState {
  proj: { x: number; y: number; vx: number; vy: number };
  drag: { active: boolean; x: number; y: number };
  blocks: Block[];
  pigs: Pig[];
  birds: number;
  phase: Phase;
  settleT: number;
  over: boolean;
  won: boolean;
}

const HP: Record<Mat, number> = { glass: 5, wood: 15, steel: 40 };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

const mk = (x: number, y: number, w: number, h: number, mat: Mat): Block => ({
  x, y, w, h, mat, hp: HP[mat], max: HP[mat],
});
const pig = (x: number, y: number): Pig => ({ x, y, r: 17, hp: 12, max: 12 });

function buildLevel(idx: number): { blocks: Block[]; pigs: Pig[] } {
  if (idx % 2 === 0) {
    return {
      blocks: [
        mk(560, GROUND - 92, 22, 92, "wood"),
        mk(650, GROUND - 92, 22, 92, "wood"),
        mk(556, GROUND - 114, 120, 20, "wood"),
        mk(602, GROUND - 138, 30, 24, "glass"),
      ],
      pigs: [pig(606, GROUND - 17)],
    };
  }
  return {
    blocks: [
      mk(600, GROUND - 26, 150, 26, "steel"),
      mk(604, GROUND - 118, 20, 92, "wood"),
      mk(724, GROUND - 118, 20, 92, "wood"),
      mk(600, GROUND - 140, 148, 20, "wood"),
      mk(560, GROUND - 60, 22, 60, "glass"),
    ],
    pigs: [pig(566, GROUND - 76), pig(668, GROUND - 43)],
  };
}

function freshState(level: number): GState {
  const { blocks, pigs } = buildLevel(level);
  return {
    proj: { x: ANCHOR_X, y: ANCHOR_Y, vx: 0, vy: 0 },
    drag: { active: false, x: ANCHOR_X, y: ANCHOR_Y },
    blocks,
    pigs,
    birds: START_BIRDS,
    phase: "aim",
    settleT: 0,
    over: false,
    won: false,
  };
}

function circleBox(cx: number, cy: number, r: number, b: Block) {
  const closestX = clamp(cx, b.x, b.x + b.w);
  const closestY = clamp(cy, b.y, b.y + b.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  const dist = Math.sqrt(d2) || 0.0001;
  return { nx: dx / dist, ny: dy / dist, pen: r - dist };
}

function stepFly(g: GState, dt: number) {
  const p = g.proj;
  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Ground — only bounce when descending (so a low-launched shot isn't killed).
  if (p.y + PROJ_R > GROUND && p.vy > 0) {
    p.y = GROUND - PROJ_R;
    p.vy = -p.vy * 0.4;
    p.vx *= 0.62;
  }

  const speed = Math.hypot(p.vx, p.vy);

  // Blocks.
  for (let i = g.blocks.length - 1; i >= 0; i--) {
    const b = g.blocks[i];
    const hit = circleBox(p.x, p.y, PROJ_R, b);
    if (!hit) continue;
    const dmg = clamp(speed * 0.03, 1, 24);
    if (b.hp - dmg <= 0) {
      // Punch through a shattering block.
      g.blocks.splice(i, 1);
      p.vx *= 0.82;
      p.vy *= 0.82;
    } else {
      b.hp -= dmg;
      p.x += hit.nx * hit.pen;
      p.y += hit.ny * hit.pen;
      const vdot = p.vx * hit.nx + p.vy * hit.ny;
      p.vx -= (1 + REST) * vdot * hit.nx;
      p.vy -= (1 + REST) * vdot * hit.ny;
      p.vx *= 0.66;
      p.vy *= 0.66;
    }
  }

  // Pigs.
  for (let i = g.pigs.length - 1; i >= 0; i--) {
    const pg = g.pigs[i];
    const dx = p.x - pg.x;
    const dy = p.y - pg.y;
    if (Math.hypot(dx, dy) < PROJ_R + pg.r) {
      pg.hp -= clamp(speed * 0.05, 3, 30);
      p.vx *= 0.7;
      p.vy *= 0.7;
      if (pg.hp <= 0) g.pigs.splice(i, 1);
    }
  }

  if (g.pigs.length === 0) {
    g.won = true;
    g.over = true;
    return;
  }

  const spd = Math.hypot(p.vx, p.vy);
  const onGround = p.y + PROJ_R >= GROUND - 0.5;
  if (p.x - PROJ_R > W || p.x + PROJ_R < 0 || (onGround && spd < STOP_SPEED)) {
    g.phase = "settle";
    g.settleT = 0.5;
  }
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Ground.
  ctx.fillStyle = "rgba(10,14,24,0.6)";
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.save();
  ctx.strokeStyle = "rgba(120,240,255,0.8)";
  ctx.shadowColor = "rgba(120,240,255,0.7)";
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(W, GROUND);
  ctx.stroke();
  ctx.restore();

  // Blocks.
  for (const b of g.blocks) {
    const frac = b.hp / b.max;
    let base = "120,200,255";
    if (b.mat === "wood") base = "210,150,90";
    else if (b.mat === "steel") base = "170,190,210";
    ctx.save();
    ctx.shadowColor = `rgba(${base},0.5)`;
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(${base},${0.35 + frac * 0.5})`;
    rr(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(${base},0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Pigs (trojans).
  for (const pg of g.pigs) {
    ctx.save();
    ctx.shadowColor = "rgba(57,255,136,0.8)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#39ff88";
    ctx.beginPath();
    ctx.arc(pg.x, pg.y, pg.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(6,26,16,0.9)";
    ctx.beginPath();
    ctx.arc(pg.x - 6, pg.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(pg.x + 6, pg.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Slingshot.
  ctx.strokeStyle = "#2a3a4a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(ANCHOR_X, GROUND);
  ctx.lineTo(ANCHOR_X, ANCHOR_Y);
  ctx.stroke();

  const p = g.proj;

  // Aiming: band + trajectory preview.
  if (g.phase === "aim" && g.drag.active) {
    ctx.strokeStyle = "rgba(255,120,90,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ANCHOR_X, ANCHOR_Y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    // Trajectory dots.
    const vx = (ANCHOR_X - p.x) * POWER;
    const vy = (ANCHOR_Y - p.y) * POWER;
    ctx.fillStyle = "rgba(200,240,255,0.5)";
    for (let t = 0.05; t < 1.1; t += 0.06) {
      const tx = p.x + vx * t;
      const ty = p.y + vy * t + 0.5 * GRAVITY * t * t;
      if (ty > GROUND) break;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Projectile.
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#7ef9ff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, PROJ_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "rgba(6,20,30,0.85)";
  ctx.fillRect(p.x - 5, p.y - 2, 10, 4);
}

export default function PacketSiege() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [level, setLevel] = useState(0);
  const [birds, setBirds] = useState(START_BIRDS);
  const [pigsLeft, setPigsLeft] = useState(0);
  const [won, setWon] = useState(false);

  const gameRef = useRef<GState>(freshState(0));
  const statusRef = useRef<Status>("idle");
  const overAtRef = useRef(0);
  const shown = useRef({ birds: START_BIRDS, pigs: 0 });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startLevel = useCallback((lvl: number) => {
    gameRef.current = freshState(lvl);
    shown.current = { birds: START_BIRDS, pigs: gameRef.current.pigs.length };
    setLevel(lvl);
    setBirds(START_BIRDS);
    setPigsLeft(gameRef.current.pigs.length);
    setWon(false);
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  const canvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    const onDown = (e: PointerEvent) => {
      const s = statusRef.current;
      if (s === "idle") {
        startLevel(0);
        return;
      }
      if (s === "over") {
        if (performance.now() - overAtRef.current > 400) {
          const g = gameRef.current;
          startLevel(g.won ? level + 1 : level);
        }
        return;
      }
      const g = gameRef.current;
      if (g.phase !== "aim") return;
      g.drag.active = true;
      const pt = canvasPoint(e.clientX, e.clientY);
      g.proj.x = pt.x;
      g.proj.y = pt.y;
    };
    const onMove = (e: PointerEvent) => {
      const g = gameRef.current;
      if (!g.drag.active) return;
      const pt = canvasPoint(e.clientX, e.clientY);
      let dx = pt.x - ANCHOR_X;
      let dy = pt.y - ANCHOR_Y;
      const d = Math.hypot(dx, dy);
      if (d > MAX_PULL) {
        dx = (dx / d) * MAX_PULL;
        dy = (dy / d) * MAX_PULL;
      }
      g.proj.x = ANCHOR_X + dx;
      g.proj.y = ANCHOR_Y + dy;
    };
    const onUp = () => {
      const g = gameRef.current;
      if (!g.drag.active) return;
      g.drag.active = false;
      const pull = Math.hypot(g.proj.x - ANCHOR_X, g.proj.y - ANCHOR_Y);
      if (pull < 12) {
        g.proj.x = ANCHOR_X;
        g.proj.y = ANCHOR_Y;
        return;
      }
      g.proj.vx = (ANCHOR_X - g.proj.x) * POWER;
      g.proj.vy = (ANCHOR_Y - g.proj.y) * POWER;
      g.phase = "fly";
    };
    container?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      container?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [startLevel, level]);

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

      if (g.phase === "fly") {
        stepFly(g, dt);
      } else if (g.phase === "settle") {
        g.settleT -= dt;
        if (g.settleT <= 0) {
          if (g.pigs.length === 0) {
            g.won = true;
            g.over = true;
          } else {
            g.birds -= 1;
            if (g.birds <= 0) {
              g.over = true;
              g.won = false;
            } else {
              g.proj = { x: ANCHOR_X, y: ANCHOR_Y, vx: 0, vy: 0 };
              g.phase = "aim";
            }
          }
        }
      }

      if (g.birds !== shown.current.birds) {
        shown.current.birds = g.birds;
        setBirds(g.birds);
      }
      if (g.pigs.length !== shown.current.pigs) {
        shown.current.pigs = g.pigs.length;
        setPigsLeft(g.pigs.length);
      }

      draw(ctx, g);

      if (g.over) {
        overAtRef.current = performance.now();
        setWon(g.won);
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
        <h1 className={styles.title}>Packet Siege</h1>
        <div className={styles.score}>
          Level: {level + 1}
          <span className={styles.scoreDivider}>·</span>
          Birds: {birds}
          <span className={styles.scoreDivider}>·</span>
          Trojans: {pigsLeft}
        </div>

        <div className={styles.gameCanvasContainer} ref={containerRef}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {status === "idle" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>PACKET SIEGE</p>
              <p className={styles.overlayText}>
                Drag the data packet back on the slingshot and release to launch.
                Smash the firewall blocks and wipe out every green trojan before
                you run out of packets.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>
                {won ? "STRONGHOLD BREACHED" : "OUT OF PACKETS"}
              </p>
              <p className={styles.overlayText}>
                {won
                  ? "Every trojan wiped. Load the next stronghold?"
                  : "Trojans still standing. Re-arm and try again."}
              </p>
              <span className={styles.cta}>{won ? "Next Level" : "Retry"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
