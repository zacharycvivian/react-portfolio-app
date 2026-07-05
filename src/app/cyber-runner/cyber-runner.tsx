"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./cyber-runner.module.css";

// ── Constants (fixed internal resolution; the canvas is CSS-scaled) ──
const W = 760;
const H = 440;
const CEIL_Y = 26;
const FLOOR_Y = H - 44; // 396 — top of the floor band
const PLAYER_X = 150;
const PLAYER_W = 24;
const PLAYER_H = 34;

const GRAVITY = 1650; // px/s² when falling
const THRUST = -2500; // px/s² while the jetpack fires
const MAX_VY = 640;

const BASE_SCROLL = 250; // px/s
const SCROLL_RAMP = 260; // most it speeds up
const METER = 0.05; // pixels → meters (20px = 1m)

const MISSILE_SPEED = 580;
const MISSILE_WARN = 1.1; // seconds of telegraph before it fires

type Status = "idle" | "playing" | "over";

interface Zapper {
  x: number;
  y: number;
  w: number;
  h: number;
  vertical: boolean;
}
interface Coin {
  x: number;
  y: number;
  taken: boolean;
}
interface Missile {
  x: number;
  y: number;
  state: "warn" | "fly";
  timer: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}
interface GState {
  playerY: number;
  velY: number;
  thrust: boolean;
  scroll: number;
  distancePx: number;
  bits: number;
  zappers: Zapper[];
  coins: Coin[];
  missiles: Missile[];
  particles: Particle[];
  zapTimer: number;
  coinTimer: number;
  missileTimer: number;
  over: boolean;
  animTime: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const aabb = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

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

function freshState(): GState {
  return {
    playerY: (CEIL_Y + FLOOR_Y) / 2 - PLAYER_H / 2,
    velY: 0,
    thrust: false,
    scroll: BASE_SCROLL,
    distancePx: 0,
    bits: 0,
    zappers: [],
    coins: [],
    missiles: [],
    particles: [],
    zapTimer: 1.4,
    coinTimer: 1.0,
    missileTimer: 4.0,
    over: false,
    animTime: 0,
  };
}

function spawnZapper(g: GState) {
  const band = FLOOR_Y - CEIL_Y;
  if (Math.random() < 0.6) {
    // Vertical bar anchored to the ceiling or floor, leaving the far side open.
    const h = 80 + Math.random() * (band * 0.5);
    const fromTop = Math.random() < 0.5;
    const y = fromTop ? CEIL_Y : FLOOR_Y - h;
    g.zappers.push({ x: W + 30, y, w: 14, h, vertical: true });
  } else {
    // Floating horizontal bar — fly above or below it.
    const w = 110 + Math.random() * 90;
    const y = CEIL_Y + 46 + Math.random() * (band - 110);
    g.zappers.push({ x: W + 30, y, w, h: 14, vertical: false });
  }
}

function spawnCoins(g: GState) {
  const count = 4 + Math.floor(Math.random() * 3);
  const band = FLOOR_Y - CEIL_Y;
  const cy = CEIL_Y + 42 + Math.random() * (band - 84);
  const arc = Math.random() < 0.5;
  for (let i = 0; i < count; i++) {
    const x = W + 24 + i * 30;
    const y = arc ? cy - Math.sin((i / (count - 1)) * Math.PI) * 44 : cy;
    g.coins.push({ x, y, taken: false });
  }
}

function spawnMissile(g: GState) {
  g.missiles.push({
    x: W - 8,
    y: g.playerY + PLAYER_H / 2,
    state: "warn",
    timer: MISSILE_WARN,
  });
}

function step(g: GState, dt: number) {
  g.animTime += dt;
  const meters = g.distancePx * METER;
  g.scroll = BASE_SCROLL + Math.min(meters * 0.45, SCROLL_RAMP);
  g.distancePx += g.scroll * dt;

  // Player — hold to thrust up, release to fall.
  g.velY += (g.thrust ? THRUST : GRAVITY) * dt;
  g.velY = clamp(g.velY, -MAX_VY, MAX_VY);
  g.playerY += g.velY * dt;
  if (g.playerY < CEIL_Y) {
    g.playerY = CEIL_Y;
    if (g.velY < 0) g.velY = 0;
  }
  if (g.playerY + PLAYER_H > FLOOR_Y) {
    g.playerY = FLOOR_Y - PLAYER_H;
    if (g.velY > 0) g.velY = 0;
  }

  // Jetpack exhaust particles.
  if (g.thrust) {
    g.particles.push({
      x: PLAYER_X + 3 + Math.random() * 5,
      y: g.playerY + PLAYER_H - 2,
      vx: -50 - Math.random() * 70,
      vy: 120 + Math.random() * 130,
      life: 0.35 + Math.random() * 0.25,
      max: 0.6,
    });
  }
  for (const p of g.particles) {
    p.x -= g.scroll * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  g.particles = g.particles.filter((p) => p.life > 0);
  if (g.particles.length > 70) g.particles.splice(0, g.particles.length - 70);

  // Zappers.
  for (const z of g.zappers) z.x -= g.scroll * dt;
  g.zappers = g.zappers.filter((z) => z.x + z.w > -20);
  g.zapTimer -= dt;
  if (g.zapTimer <= 0) {
    spawnZapper(g);
    g.zapTimer = Math.max(0.8, 1.7 - meters * 0.0006);
  }

  // Data bits (coins).
  for (const c of g.coins) c.x -= g.scroll * dt;
  g.coins = g.coins.filter((c) => c.x > -20 && !c.taken);
  g.coinTimer -= dt;
  if (g.coinTimer <= 0) {
    spawnCoins(g);
    g.coinTimer = 1.2 + Math.random() * 0.8;
  }

  // Trace missiles.
  g.missileTimer -= dt;
  if (meters > 100 && g.missileTimer <= 0) {
    spawnMissile(g);
    g.missileTimer = Math.max(2.0, 3.6 - meters * 0.001);
  }
  for (const m of g.missiles) {
    if (m.state === "warn") {
      m.timer -= dt;
      if (m.timer <= 0) m.state = "fly";
    } else {
      m.x -= MISSILE_SPEED * dt;
    }
  }
  g.missiles = g.missiles.filter((m) => m.x > -60);

  // Player hitbox (a touch smaller than the sprite = forgiving).
  const hx = PLAYER_X + 3;
  const hy = g.playerY + 4;
  const hw = PLAYER_W - 6;
  const hh = PLAYER_H - 8;

  for (const c of g.coins) {
    if (!c.taken && aabb(hx, hy, hw, hh, c.x - 9, c.y - 9, 18, 18)) {
      c.taken = true;
      g.bits += 1;
    }
  }
  for (const z of g.zappers) {
    if (aabb(hx, hy, hw, hh, z.x, z.y, z.w, z.h)) g.over = true;
  }
  for (const m of g.missiles) {
    if (m.state === "fly" && aabb(hx, hy, hw, hh, m.x - 30, m.y - 8, 34, 16)) {
      g.over = true;
    }
  }
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: GState) {
  const cx = PLAYER_X + PLAYER_W / 2;
  const cy = g.playerY + PLAYER_H / 2;
  const tilt = clamp(g.velY / 1000, -0.35, 0.5);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  if (g.thrust) {
    ctx.save();
    ctx.shadowColor = "rgba(255,150,40,0.9)";
    ctx.shadowBlur = 14;
    const flick = 6 + Math.random() * 9;
    const grad = ctx.createLinearGradient(0, PLAYER_H / 2, 0, PLAYER_H / 2 + 18 + flick);
    grad.addColorStop(0, "#ffe08a");
    grad.addColorStop(0.5, "#ff9b3d");
    grad.addColorStop(1, "rgba(255,80,40,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-8, PLAYER_H / 2 - 2);
    ctx.lineTo(-1, PLAYER_H / 2 + 16 + flick);
    ctx.lineTo(6, PLAYER_H / 2 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Backpack.
  ctx.fillStyle = "#0d2836";
  rr(ctx, -PLAYER_W / 2 - 4, -PLAYER_H / 2 + 6, 8, PLAYER_H - 8, 3);
  ctx.fill();

  // Body.
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.8)";
  ctx.shadowBlur = 14;
  const bg = ctx.createLinearGradient(-PLAYER_W / 2, 0, PLAYER_W / 2, 0);
  bg.addColorStop(0, "#9bfcff");
  bg.addColorStop(1, "#12a9d8");
  ctx.fillStyle = bg;
  rr(ctx, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H, 7);
  ctx.fill();
  ctx.restore();

  // Visor.
  ctx.fillStyle = "rgba(6,20,30,0.9)";
  rr(ctx, -2, -PLAYER_H / 2 + 6, 10, 9, 3);
  ctx.fill();
  ctx.fillStyle = "#c6fbff";
  ctx.beginPath();
  ctx.arc(4, -PLAYER_H / 2 + 10.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Parallax grid.
  ctx.save();
  ctx.strokeStyle = "rgba(80,200,255,0.05)";
  ctx.lineWidth = 1;
  const far = (g.distancePx * 0.3) % 48;
  for (let x = -far; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, CEIL_Y);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(80,200,255,0.08)";
  const near = g.distancePx % 40;
  for (let x = -near; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, CEIL_Y);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }
  for (let y = CEIL_Y; y < FLOOR_Y; y += 40) {
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
  scan.addColorStop(0.5, "rgba(120,240,255,0.05)");
  scan.addColorStop(1, "rgba(120,240,255,0)");
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 30, W, 60);

  // Data bits.
  for (const c of g.coins) {
    if (c.taken) continue;
    ctx.save();
    ctx.shadowColor = "rgba(120,240,255,0.9)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#7ef9ff";
    drawHex(ctx, c.x, c.y, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(6,26,34,0.9)";
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", c.x, c.y + 0.5);
    ctx.restore();
  }

  // Zappers.
  for (const z of g.zappers) {
    ctx.save();
    ctx.shadowColor = "rgba(255,70,90,0.9)";
    ctx.shadowBlur = 14;
    const grad = z.vertical
      ? ctx.createLinearGradient(z.x, 0, z.x + z.w, 0)
      : ctx.createLinearGradient(0, z.y, 0, z.y + z.h);
    grad.addColorStop(0, "rgba(255,80,90,0.55)");
    grad.addColorStop(0.5, "rgba(255,140,120,0.85)");
    grad.addColorStop(1, "rgba(255,80,90,0.55)");
    ctx.fillStyle = grad;
    rr(ctx, z.x, z.y, z.w, z.h, 4);
    ctx.fill();
    // Bright electric core.
    ctx.strokeStyle = "rgba(255,225,230,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (z.vertical) {
      ctx.moveTo(z.x + z.w / 2, z.y + 4);
      ctx.lineTo(z.x + z.w / 2, z.y + z.h - 4);
    } else {
      ctx.moveTo(z.x + 4, z.y + z.h / 2);
      ctx.lineTo(z.x + z.w - 4, z.y + z.h / 2);
    }
    ctx.stroke();
    // Electrode nodes.
    ctx.fillStyle = "#ffd7dd";
    ctx.beginPath();
    ctx.arc(z.x + z.w / 2, z.y + (z.vertical ? 3 : z.h / 2), 3, 0, Math.PI * 2);
    ctx.arc(
      z.vertical ? z.x + z.w / 2 : z.x + z.w,
      z.vertical ? z.y + z.h : z.y + z.h / 2,
      3, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  // Missiles.
  for (const m of g.missiles) {
    if (m.state === "warn") {
      if (Math.sin(g.animTime * 22) > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(255,70,70,0.95)";
        ctx.shadowColor = "rgba(255,60,60,0.9)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(W - 6, m.y);
        ctx.lineTo(W - 20, m.y - 9);
        ctx.lineTo(W - 20, m.y + 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", W - 15, m.y + 0.5);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.shadowColor = "rgba(255,90,60,0.9)";
      ctx.shadowBlur = 14;
      // Flame trail.
      const fl = ctx.createLinearGradient(m.x, 0, m.x + 34, 0);
      fl.addColorStop(0, "rgba(255,180,60,0.9)");
      fl.addColorStop(1, "rgba(255,80,40,0)");
      ctx.fillStyle = fl;
      ctx.beginPath();
      ctx.moveTo(m.x + 22, m.y - 5);
      ctx.lineTo(m.x + 40, m.y);
      ctx.lineTo(m.x + 22, m.y + 5);
      ctx.closePath();
      ctx.fill();
      // Body.
      ctx.fillStyle = "#e9edf2";
      rr(ctx, m.x - 4, m.y - 5, 28, 10, 3);
      ctx.fill();
      // Nose.
      ctx.fillStyle = "#ff5a4d";
      ctx.beginPath();
      ctx.moveTo(m.x - 14, m.y);
      ctx.lineTo(m.x - 4, m.y - 5);
      ctx.lineTo(m.x - 4, m.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Exhaust particles.
  for (const p of g.particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(a * 80)},60,${a * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 + a * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlayer(ctx, g);

  // Ceiling + floor bands with glowing edges.
  ctx.fillStyle = "rgba(10,14,24,0.6)";
  ctx.fillRect(0, 0, W, CEIL_Y);
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  ctx.save();
  ctx.strokeStyle = "rgba(120,240,255,0.8)";
  ctx.shadowColor = "rgba(120,240,255,0.8)";
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CEIL_Y);
  ctx.lineTo(W, CEIL_Y);
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(W, FLOOR_Y);
  ctx.stroke();
  ctx.restore();
  // Floor data ticks.
  ctx.fillStyle = "rgba(120,240,255,0.28)";
  const off = g.distancePx % 26;
  for (let x = -off; x < W; x += 26) ctx.fillRect(x, FLOOR_Y + 12, 12, 3);

  // Distance HUD.
  ctx.save();
  ctx.font = "bold 40px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillText(`${Math.floor(g.distancePx * METER)}m`, W / 2, 70);
  ctx.restore();
}

export default function CyberRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [meters, setMeters] = useState(0);
  const [bits, setBits] = useState(0);
  const [best, setBest] = useState(0);
  const [record, setRecord] = useState(false);

  const gameRef = useRef<GState>(freshState());
  const statusRef = useRef<Status>("idle");
  const bestRef = useRef(0);
  const overAtRef = useRef(0);
  const shown = useRef({ meters: 0, bits: 0 });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored = Number(localStorage.getItem("cyberRunnerBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshState();
    gameRef.current.thrust = true; // the press that starts also fires the jetpack
    shown.current = { meters: 0, bits: 0 };
    setMeters(0);
    setBits(0);
    setRecord(false);
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  // Unified hold-to-thrust input (attached once; gated on statusRef).
  useEffect(() => {
    const container = containerRef.current;
    const press = () => {
      const s = statusRef.current;
      if (s === "idle") startGame();
      else if (s === "playing") gameRef.current.thrust = true;
      else if (s === "over" && performance.now() - overAtRef.current > 500) startGame();
    };
    const release = () => {
      gameRef.current.thrust = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      press();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        press();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") release();
    };
    container?.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      container?.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startGame]);

  // Render / simulate.
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
      return;
    }

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      step(g, dt);

      const m = Math.floor(g.distancePx * METER);
      if (m !== shown.current.meters) {
        shown.current.meters = m;
        setMeters(m);
      }
      if (g.bits !== shown.current.bits) {
        shown.current.bits = g.bits;
        setBits(g.bits);
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
            localStorage.setItem("cyberRunnerBest", String(m));
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
        <h1 className={styles.title}>Cyber Runner</h1>
        <div className={styles.score}>
          Distance: {meters} m
          <span className={styles.scoreDivider}>·</span>
          Bits: {bits}
          <span className={styles.scoreDivider}>·</span>
          Best: {best} m
        </div>

        <div className={styles.gameCanvasContainer} ref={containerRef}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {status === "idle" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>JETPACK OVERRIDE</p>
              <p className={styles.overlayText}>
                Hold anywhere (or Space) to fire your jetpack. Dodge the electric
                zappers and trace missiles, and grab the data bits. Let go to
                drop.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>RUN TERMINATED</p>
              <p className={styles.overlayText}>
                You ran {meters} m and grabbed {bits} bit{bits === 1 ? "" : "s"}.
                {record ? " New record!" : ""}
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
