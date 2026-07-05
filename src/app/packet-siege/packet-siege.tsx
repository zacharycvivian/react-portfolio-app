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
// Tuned so a full-power shot arcs up and lands back inside the playfield around
// the fort (never flying flat off the right edge). Stronger gravity + a lower
// launch multiplier give a clear rise-and-fall parabola instead of a line drive.
const GRAVITY = 1500;
const POWER = 8.3;
const MAX_PULL = 124;
const REST = 0.34;
const STOP_SPEED = 62;
const START_BIRDS = 3;

// Structure physics — blocks and pigs fall and stack under their own gravity, so
// knocking out a supporting wall lets the roof topple down onto the pigs.
const B_GRAVITY = 1400; // gravity for blocks + pigs
const B_FRICTION = 0.78; // horizontal damping when a body rests on ground/support
const KNOCK = 0.05; // fraction of the bird's velocity a struck block absorbs
const CRUSH_SPEED = 150; // block speed above which it crushes a pig it lands on
const SETTLE_TIME = 1.1; // seconds to let the structure finish collapsing
const MAX_BODY_V = 1600; // clamp so a bad contact can't fling a block off-screen
const TIP_ACC = 1500; // sideways pull on a block whose weight overhangs its support

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
  vx: number;
  vy: number;
}
interface Pig {
  x: number;
  y: number;
  r: number;
  hp: number;
  max: number;
  vx: number;
  vy: number;
}
interface GState {
  proj: { x: number; y: number; vx: number; vy: number };
  drag: { active: boolean; x: number; y: number };
  blocks: Block[];
  pigs: Pig[];
  birds: number;
  phase: Phase;
  settleT: number;
  lowT: number;
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
  x, y, w, h, mat, hp: HP[mat], max: HP[mat], vx: 0, vy: 0,
});
const pig = (x: number, y: number): Pig => ({ x, y, r: 17, hp: 12, max: 12, vx: 0, vy: 0 });

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
    lowT: 0,
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

function overlapBox(a: Block, b: Block) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 0 && oy > 0 ? { ox, oy } : null;
}

// Separate two overlapping blocks along the axis of least penetration. For a
// vertical overlap the upper block is lifted onto the lower one (which stays put
// as the support), so stacks resting on the ground stay stable instead of
// sinking into each other.
function resolveBlockPair(a: Block, b: Block) {
  const o = overlapBox(a, b);
  if (!o) return;
  if (o.ox < o.oy) {
    const push = o.ox / 2;
    if (a.x < b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
    a.vx *= 0.5;
    b.vx *= 0.5;
  } else {
    const upper = a.y <= b.y ? a : b;
    upper.y -= o.oy;
    if (upper.vy > 0) upper.vy = 0;
    upper.vx *= B_FRICTION;
  }
}

// Where a block is held up from directly below (by the ground or another block)
// and the x-span of that contact. A block is only stable if its centre of mass
// sits within that span — otherwise it overhangs and should tip off.
function supportInfo(b: Block, blocks: Block[]) {
  const EPS = 3;
  let minX = Infinity;
  let maxX = -Infinity;
  let supported = false;
  if (b.y + b.h >= GROUND - EPS) {
    supported = true;
    minX = b.x;
    maxX = b.x + b.w;
  }
  for (const s of blocks) {
    if (s === b) continue;
    if (Math.abs(s.y - (b.y + b.h)) <= EPS) {
      const ox0 = Math.max(b.x, s.x);
      const ox1 = Math.min(b.x + b.w, s.x + s.w);
      if (ox1 > ox0) {
        supported = true;
        minX = Math.min(minX, ox0);
        maxX = Math.max(maxX, ox1);
      }
    }
  }
  return { supported, minX, maxX };
}

// One frame of gravity + stacking for the blocks and pigs. Runs every frame in
// every phase so a structure keeps settling (and can crush a pig) even after the
// bird itself has come to rest.
function stepBodies(g: GState, dt: number) {
  for (const b of g.blocks) {
    b.vy += B_GRAVITY * dt;
    b.vx = clamp(b.vx, -MAX_BODY_V, MAX_BODY_V);
    b.vy = clamp(b.vy, -MAX_BODY_V, MAX_BODY_V);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (const p of g.pigs) {
    p.vy += B_GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  // Crush check happens before resolution zeroes the falling velocity, so we can
  // read the true impact speed of a block landing on a pig.
  for (let i = g.pigs.length - 1; i >= 0; i--) {
    const pg = g.pigs[i];
    for (const b of g.blocks) {
      if (!circleBox(pg.x, pg.y, pg.r, b)) continue;
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > CRUSH_SPEED) pg.hp -= clamp(spd * 0.06, 3, 40);
    }
    if (pg.hp <= 0) g.pigs.splice(i, 1);
  }

  // A few positional iterations settle the stack cleanly.
  for (let iter = 0; iter < 4; iter++) {
    for (const b of g.blocks) {
      if (b.y + b.h > GROUND) {
        b.y = GROUND - b.h;
        if (b.vy > 0) b.vy = 0;
        b.vx *= B_FRICTION;
      }
      if (b.x < 0) { b.x = 0; if (b.vx < 0) b.vx = 0; }
      if (b.x + b.w > W) { b.x = W - b.w; if (b.vx > 0) b.vx = 0; }
    }
    for (let i = 0; i < g.blocks.length; i++) {
      for (let j = i + 1; j < g.blocks.length; j++) {
        resolveBlockPair(g.blocks[i], g.blocks[j]);
      }
    }
    for (const pg of g.pigs) {
      // Rest on / get pushed out of blocks.
      for (const b of g.blocks) {
        const hit = circleBox(pg.x, pg.y, pg.r, b);
        if (!hit) continue;
        pg.x += hit.nx * hit.pen;
        pg.y += hit.ny * hit.pen;
        if (hit.ny < 0 && pg.vy > 0) pg.vy = 0; // landed on top of a block
      }
      if (pg.y + pg.r > GROUND) {
        pg.y = GROUND - pg.r;
        if (pg.vy > 0) pg.vy = 0;
        pg.vx *= B_FRICTION;
      }
      pg.x = clamp(pg.x, pg.r, W - pg.r);
    }
  }

  // Tipping pass: a resting block whose centre of mass hangs past its support
  // gets pulled toward the overhang so it slides off and drops — this is what
  // makes a roof come down once you knock out the wall holding up one end.
  for (const b of g.blocks) {
    const info = supportInfo(b, g.blocks);
    if (!info.supported) continue;
    const com = b.x + b.w / 2;
    if (com < info.minX - 2) b.vx -= TIP_ACC * dt;
    else if (com > info.maxX + 2) b.vx += TIP_ACC * dt;
  }
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
      // Shove the block in the bird's travel direction (before we bounce the
      // bird) so a solid hit can knock a wall loose and topple what it holds up.
      b.vx += p.vx * KNOCK;
      b.vy += p.vy * KNOCK;
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
  if (p.x - PROJ_R > W || p.x + PROJ_R < 0) {
    g.phase = "settle";
    g.settleT = SETTLE_TIME;
    g.lowT = 0;
    return;
  }
  // Settle once the bird has been slow for a moment — whether it stopped on the
  // ground or came to rest on top of the rubble.
  if (spd < STOP_SPEED) {
    g.lowT += dt;
    if (g.lowT > 0.45) {
      g.phase = "settle";
      g.settleT = SETTLE_TIME;
      g.lowT = 0;
    }
  } else {
    g.lowT = 0;
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

      if (g.phase === "fly") {
        stepFly(g, dt);
      }
      // Structures fall/settle every frame, so a collapse (and any pig it
      // crushes) keeps resolving even after the bird has stopped.
      stepBodies(g, dt);

      if (g.phase === "settle") {
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

      // A pig can be wiped out by falling debris at any moment, not just by a
      // direct bird hit — clear the level as soon as the last one is gone.
      if (!g.over && g.pigs.length === 0) {
        g.won = true;
        g.over = true;
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
