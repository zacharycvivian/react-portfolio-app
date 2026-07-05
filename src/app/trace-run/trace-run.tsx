"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./trace-run.module.css";

// A cyber Temple Run: a 3-lane pseudo-3D runner. Switch lanes, jump the low
// firewalls, slide under the laser gates, dodge the ICE blocks, grab shards.
const W = 760;
const H = 460;
const HORIZON_Y = 132;
const GROUND_Y = 440;
const LANE_OFFSET = 150; // world x per lane at the near plane
const PERSP_K = 0.5;
const Z_FAR = 14; // spawn distance
const JUMP_DUR = 0.62;
const JUMP_H = 78;
const SLIDE_DUR = 0.6;

type Status = "idle" | "playing" | "over";
type Kind = "low" | "high" | "block";

interface Obstacle {
  z: number;
  lane: number;
  kind: Kind;
  evaluated: boolean;
}
interface Shard {
  z: number;
  lane: number;
  taken: boolean;
}
interface GState {
  lane: number;
  visualLane: number;
  jumpT: number;
  slideT: number;
  speed: number;
  traveled: number;
  shards: number;
  obstacles: Obstacle[];
  coins: Shard[];
  sinceSpawn: number;
  over: boolean;
  animTime: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const proj = (z: number) => 1 / (1 + z * PERSP_K);
const projY = (z: number) => HORIZON_Y + (GROUND_Y - HORIZON_Y) * proj(z);
const projX = (lane: number, z: number) => W / 2 + lane * LANE_OFFSET * proj(z);

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
    lane: 0,
    visualLane: 0,
    jumpT: 0,
    slideT: 0,
    speed: 6,
    traveled: 0,
    shards: 0,
    obstacles: [],
    coins: [],
    sinceSpawn: -2,
    over: false,
    animTime: 0,
  };
}

function pickKind(traveled: number): Kind {
  const roll = Math.random();
  if (traveled < 55) return roll < 0.6 ? "low" : "block";
  return roll < 0.4 ? "low" : roll < 0.75 ? "high" : "block";
}

function spawnRow(g: GState) {
  const t = g.traveled;
  const r = Math.random();
  if (r < 0.3) {
    // A trail of shards down one lane.
    const lane = Math.floor(Math.random() * 3) - 1;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      g.coins.push({ z: Z_FAR + i * 1.1, lane, taken: false });
    }
  } else if (r < 0.64 || t < 35) {
    // Single obstacle — always dodgeable.
    const lane = Math.floor(Math.random() * 3) - 1;
    g.obstacles.push({ z: Z_FAR, lane, kind: pickKind(t), evaluated: false });
  } else {
    // Two lanes blocked, one lane always left open.
    const lanes = [-1, 0, 1];
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    for (const lane of lanes.slice(0, 2)) {
      g.obstacles.push({ z: Z_FAR, lane, kind: pickKind(t), evaluated: false });
    }
  }
}

function step(g: GState, dt: number) {
  g.animTime += dt;
  g.speed = 6 + Math.min(g.traveled * 0.02, 8);
  const dz = g.speed * dt;
  g.traveled += dz;

  g.visualLane += (g.lane - g.visualLane) * Math.min(1, dt * 13);
  if (g.jumpT > 0) g.jumpT -= dt;
  if (g.slideT > 0) g.slideT -= dt;

  for (const o of g.obstacles) o.z -= dz;
  for (const c of g.coins) c.z -= dz;

  // Evaluate hazards as they reach the player plane.
  for (const o of g.obstacles) {
    if (!o.evaluated && o.z <= 0) {
      o.evaluated = true;
      if (o.lane === g.lane) {
        if (o.kind === "low") {
          if (g.jumpT <= 0) g.over = true;
        } else if (o.kind === "high") {
          if (g.slideT <= 0) g.over = true;
        } else {
          g.over = true;
        }
      }
    }
  }
  for (const c of g.coins) {
    if (!c.taken && c.z <= 0) {
      c.taken = true;
      if (c.lane === g.lane) g.shards += 1;
    }
  }
  g.obstacles = g.obstacles.filter((o) => o.z > -2);
  g.coins = g.coins.filter((c) => c.z > -2 && !c.taken);

  g.sinceSpawn += dz;
  const gap = Math.max(2.6, 5 - g.traveled * 0.008);
  if (g.sinceSpawn >= gap) {
    g.sinceSpawn = 0;
    spawnRow(g);
  }
}

function drawTrack(ctx: CanvasRenderingContext2D, g: GState) {
  // Horizon glow.
  const glow = ctx.createRadialGradient(W / 2, HORIZON_Y, 10, W / 2, HORIZON_Y, 260);
  glow.addColorStop(0, "rgba(120,240,255,0.18)");
  glow.addColorStop(1, "rgba(120,240,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // Track surface (trapezoid).
  ctx.fillStyle = "rgba(12,18,30,0.55)";
  ctx.beginPath();
  ctx.moveTo(projX(-1.5, 0), projY(0));
  ctx.lineTo(projX(1.5, 0), projY(0));
  ctx.lineTo(projX(1.5, Z_FAR), projY(Z_FAR));
  ctx.lineTo(projX(-1.5, Z_FAR), projY(Z_FAR));
  ctx.closePath();
  ctx.fill();

  // Moving rungs for speed.
  const spacing = 1.3;
  const phase = g.traveled % spacing;
  for (let i = 0; i < 14; i++) {
    const zr = i * spacing - phase;
    if (zr <= 0 || zr > Z_FAR) continue;
    const a = proj(zr) * 0.5;
    ctx.strokeStyle = `rgba(120,240,255,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(projX(-1.5, zr), projY(zr));
    ctx.lineTo(projX(1.5, zr), projY(zr));
    ctx.stroke();
  }

  // Lane dividers + glowing rails.
  const line = (lane: number, alpha: number, width: number) => {
    ctx.strokeStyle = `rgba(120,240,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(projX(lane, 0), projY(0));
    ctx.lineTo(projX(lane, Z_FAR), projY(Z_FAR));
    ctx.stroke();
  };
  line(-0.5, 0.12, 1);
  line(0.5, 0.12, 1);
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.7)";
  ctx.shadowBlur = 8;
  line(-1.5, 0.55, 2);
  line(1.5, 0.55, 2);
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const p = proj(o.z);
  const x = projX(o.lane, o.z);
  const y = projY(o.z);
  const laneW = LANE_OFFSET * p;
  const w = laneW * 0.82;

  if (o.kind === "low") {
    const h = 34 * p;
    ctx.save();
    ctx.shadowColor = "rgba(255,80,70,0.9)";
    ctx.shadowBlur = 12 * p + 2;
    const grad = ctx.createLinearGradient(0, y - h, 0, y);
    grad.addColorStop(0, "#ff8a6b");
    grad.addColorStop(1, "#c22");
    ctx.fillStyle = grad;
    rr(ctx, x - w / 2, y - h, w, h, 4 * p);
    ctx.fill();
    ctx.restore();
    // Up chevron (jump hint).
    ctx.strokeStyle = "rgba(255,235,200,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8 * p, y - h - 6 * p);
    ctx.lineTo(x, y - h - 16 * p);
    ctx.lineTo(x + 8 * p, y - h - 6 * p);
    ctx.stroke();
  } else if (o.kind === "high") {
    const openH = 104 * p;
    const barH = 24 * p;
    ctx.save();
    ctx.shadowColor = "rgba(255,170,60,0.9)";
    ctx.shadowBlur = 12 * p + 2;
    ctx.fillStyle = "#f4a63a";
    // Side posts.
    rr(ctx, x - w / 2, y - openH, 5 * p + 1, openH, 2);
    ctx.fill();
    rr(ctx, x + w / 2 - (5 * p + 1), y - openH, 5 * p + 1, openH, 2);
    ctx.fill();
    // Top bar (the deadly beam).
    const bar = ctx.createLinearGradient(0, y - openH, 0, y - openH + barH);
    bar.addColorStop(0, "#ffd36b");
    bar.addColorStop(1, "#ff6a2a");
    ctx.fillStyle = bar;
    rr(ctx, x - w / 2, y - openH, w, barH, 3);
    ctx.fill();
    ctx.restore();
    // Down chevron (slide hint).
    ctx.strokeStyle = "rgba(255,235,200,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8 * p, y - openH + barH + 14 * p);
    ctx.lineTo(x, y - openH + barH + 24 * p);
    ctx.lineTo(x + 8 * p, y - openH + barH + 14 * p);
    ctx.stroke();
  } else {
    const h = 96 * p;
    ctx.save();
    ctx.shadowColor = "rgba(120,240,255,0.85)";
    ctx.shadowBlur = 14 * p + 2;
    const grad = ctx.createLinearGradient(0, y - h, 0, y);
    grad.addColorStop(0, "rgba(200,250,255,0.95)");
    grad.addColorStop(1, "rgba(70,150,190,0.9)");
    ctx.fillStyle = grad;
    rr(ctx, x - w / 2, y - h, w, h, 5 * p);
    ctx.fill();
    ctx.restore();
    // Crosshatch.
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let yy = y - h + 12 * p; yy < y - 6 * p; yy += 16 * p) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 6 * p, yy);
      ctx.lineTo(x + w / 2 - 6 * p, yy);
      ctx.stroke();
    }
  }
}

function drawShard(ctx: CanvasRenderingContext2D, c: Shard) {
  const p = proj(c.z);
  const x = projX(c.lane, c.z);
  const y = projY(c.z) - 34 * p;
  const s = 11 * p;
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 12 * p + 2;
  ctx.fillStyle = "#7ef9ff";
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: GState) {
  const x = projX(g.visualLane, 0);
  const jumpOff =
    g.jumpT > 0 ? Math.sin((1 - g.jumpT / JUMP_DUR) * Math.PI) * JUMP_H : 0;
  const sliding = g.slideT > 0;
  const baseY = GROUND_Y - jumpOff;

  // Shadow.
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  const shW = 34 - jumpOff * 0.18;
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 4, Math.max(12, shW), 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 16;
  const grad = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
  grad.addColorStop(0, "#9bfcff");
  grad.addColorStop(1, "#12a9d8");
  ctx.fillStyle = grad;

  if (sliding) {
    rr(ctx, x - 20, baseY - 20, 40, 18, 8);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(6,20,30,0.85)";
    ctx.beginPath();
    ctx.arc(x + 12, baseY - 12, 6, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const bob = Math.sin(g.animTime * (9 + g.speed)) * 4;
  // Legs.
  ctx.strokeStyle = "#2fd0e6";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 6, baseY - 20);
  ctx.lineTo(x - 8, baseY - 2 + bob);
  ctx.moveTo(x + 6, baseY - 20);
  ctx.lineTo(x + 8, baseY - 2 - bob);
  ctx.stroke();
  // Torso.
  rr(ctx, x - 13, baseY - 46, 26, 30, 8);
  ctx.fill();
  // Head.
  ctx.beginPath();
  ctx.arc(x, baseY - 54, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Backpack glow band.
  ctx.fillStyle = "rgba(6,26,34,0.7)";
  rr(ctx, x - 9, baseY - 42, 18, 6, 3);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Scan-line drift.
  const scanY = ((g.animTime * 60) % (H + 40)) - 20;
  const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scan.addColorStop(0, "rgba(120,240,255,0)");
  scan.addColorStop(0.5, "rgba(120,240,255,0.05)");
  scan.addColorStop(1, "rgba(120,240,255,0)");
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 30, W, 60);

  drawTrack(ctx, g);

  // Hazards + shards, far to near.
  const items: (
    | { z: number; kind: "ob"; ob: Obstacle }
    | { z: number; kind: "sh"; sh: Shard }
  )[] = [];
  for (const o of g.obstacles) items.push({ z: o.z, kind: "ob", ob: o });
  for (const c of g.coins) items.push({ z: c.z, kind: "sh", sh: c });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    if (it.z > Z_FAR + 1) continue;
    if (it.kind === "ob") drawObstacle(ctx, it.ob);
    else drawShard(ctx, it.sh);
  }

  drawPlayer(ctx, g);

  // The trace closing in from behind (atmosphere).
  const pulse = 0.35 + Math.sin(g.animTime * 6) * 0.12;
  const tg = ctx.createLinearGradient(0, GROUND_Y + 6, 0, H);
  tg.addColorStop(0, `rgba(255,60,60,${pulse})`);
  tg.addColorStop(1, "rgba(120,0,0,0.65)");
  ctx.fillStyle = tg;
  ctx.fillRect(0, GROUND_Y + 6, W, H - GROUND_Y - 6);

  // Distance HUD.
  ctx.save();
  ctx.font = "bold 40px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillText(`${Math.floor(g.traveled * 6)}m`, W / 2, 64);
  ctx.restore();
}

export default function TraceRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dist, setDist] = useState(0);
  const [shards, setShards] = useState(0);
  const [best, setBest] = useState(0);
  const [record, setRecord] = useState(false);

  const gameRef = useRef<GState>(freshState());
  const statusRef = useRef<Status>("idle");
  const bestRef = useRef(0);
  const overAtRef = useRef(0);
  const shown = useRef({ dist: 0, shards: 0 });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored = Number(localStorage.getItem("traceRunBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshState();
    shown.current = { dist: 0, shards: 0 };
    setDist(0);
    setShards(0);
    setRecord(false);
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  // Input: arrows / WASD / swipes.
  useEffect(() => {
    const container = containerRef.current;
    let start: { x: number; y: number } | null = null;

    const act = (type: "left" | "right" | "up" | "down") => {
      const s = statusRef.current;
      if (s === "idle") {
        startGame();
        return;
      }
      if (s === "over") {
        if (performance.now() - overAtRef.current > 500) startGame();
        return;
      }
      const g = gameRef.current;
      if (type === "left") g.lane = clamp(g.lane - 1, -1, 1);
      else if (type === "right") g.lane = clamp(g.lane + 1, -1, 1);
      else if (type === "up") {
        if (g.jumpT <= 0 && g.slideT <= 0) g.jumpT = JUMP_DUR;
      } else if (g.slideT <= 0 && g.jumpT <= 0) g.slideT = SLIDE_DUR;
    };

    const onKey = (e: KeyboardEvent) => {
      let type: "left" | "right" | "up" | "down" | null = null;
      if (e.code === "ArrowLeft" || e.code === "KeyA") type = "left";
      else if (e.code === "ArrowRight" || e.code === "KeyD") type = "right";
      else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") type = "up";
      else if (e.code === "ArrowDown" || e.code === "KeyS") type = "down";
      if (type) {
        e.preventDefault();
        act(type);
      }
    };
    const onDown = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax < 18 && ay < 18) {
        act("up"); // a tap = jump
        return;
      }
      if (ax > ay) act(dx > 0 ? "right" : "left");
      else act(dy > 0 ? "down" : "up");
    };

    container?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      container?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [startGame]);

  // Render / simulate.
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
      step(g, dt);

      const m = Math.floor(g.traveled * 6);
      if (m !== shown.current.dist) {
        shown.current.dist = m;
        setDist(m);
      }
      if (g.shards !== shown.current.shards) {
        shown.current.shards = g.shards;
        setShards(g.shards);
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
            localStorage.setItem("traceRunBest", String(m));
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
        <h1 className={styles.title}>Trace Run</h1>
        <div className={styles.score}>
          Distance: {dist} m
          <span className={styles.scoreDivider}>·</span>
          Shards: {shards}
          <span className={styles.scoreDivider}>·</span>
          Best: {best} m
        </div>

        <div className={styles.gameCanvasContainer} ref={containerRef}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {status === "idle" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>OUTRUN THE TRACE</p>
              <p className={styles.overlayText}>
                Arrows or swipe to switch lanes. Up / swipe up (or tap) to jump
                the red firewalls; down / swipe down to slide under the laser
                gates. Dodge the ICE blocks and grab shards.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>TRACE COMPLETE</p>
              <p className={styles.overlayText}>
                The trace caught you at {dist} m with {shards} shard
                {shards === 1 ? "" : "s"}.{record ? " New record!" : ""}
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
