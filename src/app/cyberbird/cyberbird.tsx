"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./cyberbird.module.css";

// ── Game constants ────────────────────────────────────────────
// The game runs on a fixed internal resolution (WIDTH×HEIGHT) and the canvas is
// CSS-scaled to fit the layout, so physics behave identically on every screen.
// All motion is integrated with delta time (px/SECOND), like Pong, so the feel
// is the same on 60Hz and 144Hz displays.
const WIDTH = 420;
const HEIGHT = 600;
const GROUND_H = 56;
const FLOOR_Y = HEIGHT - GROUND_H; // 544 — top of the "data stream" floor

const BIRD_X = Math.round(WIDTH * 0.3); // packet stays put; the world scrolls
const BIRD_R = 15; // collision radius (a touch forgiving vs. the 34×26 sprite)

const GRAVITY = 1500; // px/s²
const FLAP_V = -430; // upward impulse applied on each "thrust"

const PIPE_W = 66; // firewall column width
const GAP_H = 172; // vertical opening the packet must fit through
const PIPE_SPEED = 150; // base scroll speed (px/s); ramps up with score
const SPEED_CAP = 110; // most the speed can ramp above the base
const SPAWN_DIST = 250; // horizontal spacing between firewalls (px)

const RESTART_DELAY = 500; // ms after a crash before a tap can reconnect

type Status = "idle" | "playing" | "over";

interface Pipe {
  x: number;
  gapY: number; // center of the opening
  scored: boolean;
}

interface GState {
  birdY: number;
  velY: number;
  pipes: Pipe[];
  score: number;
  dead: boolean;
  bgScroll: number;
  animTime: number;
  overAt: number;
}

// ── Small canvas helpers ──────────────────────────────────────
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** Rounded-rect path (kept for wide browser support; no reliance on roundRect). */
function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function spawnPipe(g: GState, x: number) {
  const minY = GAP_H / 2 + 44;
  const maxY = FLOOR_Y - GAP_H / 2 - 30;
  const gapY = minY + Math.random() * (maxY - minY);
  g.pipes.push({ x, gapY, scored: false });
}

// ── Simulation ────────────────────────────────────────────────
function step(g: GState, dt: number) {
  g.animTime += dt;

  // Packet physics.
  g.velY += GRAVITY * dt;
  g.birdY += g.velY * dt;

  // Firewalls scroll left; they get quicker as the run goes on.
  const speed = PIPE_SPEED + Math.min(g.score * 4, SPEED_CAP);
  g.bgScroll = (g.bgScroll + speed * dt * 0.5) % 40;
  for (const p of g.pipes) p.x -= speed * dt;

  // Recycle off-screen firewalls, then keep the pipeline full at fixed spacing.
  while (g.pipes.length && g.pipes[0].x + PIPE_W < -20) g.pipes.shift();
  const last = g.pipes[g.pipes.length - 1];
  if (!last || last.x <= WIDTH - SPAWN_DIST) {
    spawnPipe(g, (last ? last.x : WIDTH) + SPAWN_DIST);
  }

  // Ceiling: bonk but don't die (classic Flappy behaviour).
  if (g.birdY - BIRD_R < 0) {
    g.birdY = BIRD_R;
    if (g.velY < 0) g.velY = 0;
  }

  // Floor: fatal.
  if (g.birdY + BIRD_R > FLOOR_Y) {
    g.birdY = FLOOR_Y - BIRD_R;
    g.dead = true;
  }

  // Firewall collisions + scoring.
  for (const p of g.pipes) {
    const gapTop = p.gapY - GAP_H / 2;
    const gapBot = p.gapY + GAP_H / 2;
    const overlapX =
      BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
    if (overlapX && (g.birdY - BIRD_R < gapTop || g.birdY + BIRD_R > gapBot)) {
      g.dead = true;
    }
    if (!p.scored && p.x + PIPE_W < BIRD_X - BIRD_R) {
      p.scored = true;
      g.score += 1;
    }
  }
}

// ── Rendering ─────────────────────────────────────────────────
function drawFirewall(ctx: CanvasRenderingContext2D, p: Pipe) {
  const gapTop = p.gapY - GAP_H / 2;
  const gapBot = p.gapY + GAP_H / 2;

  const seg = (y: number, h: number) => {
    if (h <= 0) return;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
    grad.addColorStop(0, "rgba(255,70,60,0.10)");
    grad.addColorStop(0.5, "rgba(255,110,80,0.32)");
    grad.addColorStop(1, "rgba(255,70,60,0.10)");
    ctx.fillStyle = grad;
    rr(ctx, p.x, y, PIPE_W, h, 6);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(255,95,72,0.9)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,80,60,0.85)";
    ctx.shadowBlur = 12;
    rr(ctx, p.x + 1, y + 1, PIPE_W - 2, h - 2, 6);
    ctx.stroke();
    ctx.restore();

    // Faint "circuit" rungs down the column.
    ctx.strokeStyle = "rgba(255,165,125,0.22)";
    ctx.lineWidth = 1;
    for (let ty = y + 16; ty < y + h - 8; ty += 22) {
      ctx.beginPath();
      ctx.moveTo(p.x + 8, ty);
      ctx.lineTo(p.x + PIPE_W - 8, ty);
      ctx.stroke();
    }
  };

  // Top segment runs off the top edge; bottom segment down to the floor.
  seg(-8, gapTop + 8);
  seg(gapBot, FLOOR_Y - gapBot);

  // Bright glowing caps that frame the safe gap.
  ctx.save();
  ctx.fillStyle = "rgba(255,185,120,0.95)";
  ctx.shadowColor = "rgba(255,120,60,0.9)";
  ctx.shadowBlur = 16;
  rr(ctx, p.x - 3, gapTop - 6, PIPE_W + 6, 6, 3);
  ctx.fill();
  rr(ctx, p.x - 3, gapBot, PIPE_W + 6, 6, 3);
  ctx.fill();
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.fillStyle = "rgba(10,14,24,0.55)";
  ctx.fillRect(0, FLOOR_Y, WIDTH, GROUND_H);

  ctx.save();
  ctx.strokeStyle = "rgba(120,240,255,0.85)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(120,240,255,0.85)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y + 1);
  ctx.lineTo(WIDTH, FLOOR_Y + 1);
  ctx.stroke();
  ctx.restore();

  // Streaming data ticks along the floor for a sense of motion.
  ctx.fillStyle = "rgba(120,240,255,0.28)";
  const off = (g.animTime * PIPE_SPEED) % 24;
  for (let x = -off; x < WIDTH; x += 24) {
    ctx.fillRect(x, FLOOR_Y + 14, 10, 3);
  }
}

function drawBird(ctx: CanvasRenderingContext2D, g: GState) {
  const tilt = clamp(g.velY / 620, -0.5, 1.3);
  ctx.save();
  ctx.translate(BIRD_X, g.birdY);
  ctx.rotate(tilt);

  // Thruster flame when rising.
  if (g.velY < -30) {
    ctx.save();
    ctx.fillStyle = "rgba(255,170,60,0.85)";
    ctx.shadowColor = "rgba(255,140,40,0.9)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(-28 - Math.random() * 6, 0);
    ctx.lineTo(-16, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Glowing packet body.
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 18;
  const bw = 34;
  const bh = 26;
  const grad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
  grad.addColorStop(0, "#9bfcff");
  grad.addColorStop(0.5, "#38e6ff");
  grad.addColorStop(1, "#12a9d8");
  ctx.fillStyle = grad;
  rr(ctx, -bw / 2, -bh / 2, bw, bh, 8);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  rr(ctx, -bw / 2 + 2, -bh / 2 + 2, bw - 4, bh - 4, 6);
  ctx.stroke();

  // Visor + glint (the "face").
  ctx.fillStyle = "rgba(6,20,30,0.9)";
  rr(ctx, 2, -7, 12, 14, 4);
  ctx.fill();
  ctx.fillStyle = "#c6fbff";
  ctx.beginPath();
  ctx.arc(8, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Little "</>" bracket on the trailing edge.
  ctx.strokeStyle = "rgba(6,30,40,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-4, 6);
  ctx.stroke();

  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, g: GState, showScore: boolean) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Scrolling grid.
  ctx.save();
  ctx.strokeStyle = "rgba(80,200,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = -g.bgScroll; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }
  for (let y = 0; y < FLOOR_Y; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  // Drifting scan-line glow.
  const scanY = ((g.animTime * 60) % (FLOOR_Y + 40)) - 20;
  const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scan.addColorStop(0, "rgba(120,240,255,0)");
  scan.addColorStop(0.5, "rgba(120,240,255,0.06)");
  scan.addColorStop(1, "rgba(120,240,255,0)");
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 30, WIDTH, 60);

  for (const p of g.pipes) drawFirewall(ctx, p);
  drawGround(ctx, g);

  if (showScore) {
    ctx.save();
    ctx.font = "bold 64px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillText(String(g.score), WIDTH / 2, 96);
    ctx.restore();
  }

  drawBird(ctx, g);
}

const CyberBird: React.FC = () => {
  // Matrix-style falling-character background, shared with the other games.
  useEffect(() => {
    var canvas = document.getElementById("canvas") as HTMLCanvasElement;
    var ctx = canvas!.getContext("2d")!;
    var canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
    var ctx2 = canvas2!.getContext("2d")!;
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    var charArr = [
      "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    ];
    var fallingCharArr: Point[] = [];
    var fontSize = 10;
    var maxColumns = cw / fontSize;
    canvas.width = canvas2.width = cw;
    canvas.height = canvas2.height = ch;

    function randomInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min) + min);
    }

    function randomFloat(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    class Point {
      x: number;
      y: number;
      value: string;
      speed: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.value = charArr[randomInt(0, charArr.length - 1)].toUpperCase();
        this.speed = randomFloat(1, 5);
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx2.fillStyle = "rgba(255,255,255,0.8)";
        ctx2.font = fontSize + "px san-serif";
        ctx2.fillText(this.value, this.x, this.y);

        ctx.fillStyle = "#c6d6f6";
        ctx.font = fontSize + "px san-serif";
        ctx.fillText(this.value, this.x, this.y);

        this.y += this.speed;
        if (this.y > ch) {
          this.y = randomFloat(-100, 0);
          this.speed = randomFloat(2, 5);
        }
      }
    }

    for (var i = 0; i < maxColumns; i++) {
      fallingCharArr.push(new Point(i * fontSize, randomFloat(-500, 0)));
    }

    let requestId: number;

    var update = function () {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, cw, ch);
      ctx2.clearRect(0, 0, cw, ch);
      for (let i = fallingCharArr.length - 1; i >= 0; i--) {
        fallingCharArr[i].draw(ctx);
      }
      requestId = requestAnimationFrame(update);
    };

    requestId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestId);
  }, []);

  // One-time instructions, remembered for the session.
  useEffect(() => {
    if (sessionStorage.getItem("cyberBirdInstructionsShown") !== "true") {
      alert(
        "Welcome to Cyber Bird! Here's How to Play:\n\n" +
          "- You are a cyan DATA PACKET trying to breach the network.\n" +
          "- Tap, click, or press SPACE / UP to thrust upward.\n" +
          "- Slip through the gaps in the red FIREWALLS — don't touch them.\n" +
          "- Don't hit the floor either. Every firewall you clear = +1.\n" +
          "- The deeper you go, the faster the firewalls come.\n\n" +
          "Good Luck, hacker!"
      );
      sessionStorage.setItem("cyberBirdInstructionsShown", "true");
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const scoreShownRef = useRef(0);
  const highScoreRef = useRef(0); // synchronous mirror of highScore for the crash check

  const gameRef = useRef<GState>({
    birdY: HEIGHT * 0.45,
    velY: 0,
    pipes: [],
    score: 0,
    dead: false,
    bgScroll: 0,
    animTime: 0,
    overAt: 0,
  });

  // Load the best score once on mount.
  useEffect(() => {
    const stored = Number(localStorage.getItem("cyberBirdHighScore") || 0);
    if (stored > 0) {
      setHighScore(stored);
      highScoreRef.current = stored;
    }
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.birdY = HEIGHT * 0.42;
    g.velY = FLAP_V; // an immediate hop so the packet doesn't drop on launch
    g.pipes = [];
    g.score = 0;
    g.dead = false;
    g.bgScroll = 0;
    spawnPipe(g, WIDTH + 60);
    scoreShownRef.current = 0;
    setScore(0);
    setNewRecord(false);
    setStatus("playing");
  }, []);

  const flap = useCallback(() => {
    const g = gameRef.current;
    if (status === "idle") {
      startGame();
    } else if (status === "playing") {
      g.velY = FLAP_V;
    } else if (status === "over") {
      if (performance.now() - g.overAt > RESTART_DELAY) startGame();
    }
  }, [status, startGame]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  // Main render/simulation loop — one branch per status, like Pong.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const g = gameRef.current;
    let raf = 0;

    if (status === "idle") {
      // Gently bob the idle packet so the scene feels alive.
      const idle = (now: number) => {
        const t = now / 1000;
        g.animTime = t;
        g.birdY = HEIGHT * 0.45 + Math.sin(t * 2.2) * 9;
        g.velY = Math.cos(t * 2.2) * 20;
        g.bgScroll = (t * 30) % 40;
        draw(ctx, g, false);
        raf = requestAnimationFrame(idle);
      };
      raf = requestAnimationFrame(idle);
      return () => cancelAnimationFrame(raf);
    }

    if (status === "playing") {
      let last = performance.now();
      const loop = (now: number) => {
        // Clamp dt so a backgrounded tab doesn't teleport the packet.
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;

        step(g, dt);

        if (g.score !== scoreShownRef.current) {
          scoreShownRef.current = g.score;
          setScore(g.score);
        }

        draw(ctx, g, true);

        if (g.dead) {
          g.overAt = performance.now();
          const beat = g.score > highScoreRef.current;
          setNewRecord(beat);
          if (beat) {
            highScoreRef.current = g.score;
            setHighScore(g.score);
            try {
              localStorage.setItem("cyberBirdHighScore", String(g.score));
            } catch {}
          }
          setStatus("over");
          return; // freeze on the crash frame; the overlay takes over
        }

        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }
  }, [status]);

  // Bring the game fully into view, matching the other game pages.
  useEffect(() => {
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  return (
    <div className={styles.matrixBackground}>
      <canvas id="canvas" className={styles.matrixCanvas}></canvas>
      <canvas id="canvas2" className={styles.matrixCanvasOverlay}></canvas>
      <div className={styles.container}>
        <h1 className={styles.title}>Cyber Bird</h1>
        <div className={styles.score}>
          Firewalls Bypassed: {score}
          <span className={styles.scoreDivider}>·</span>
          Best: {highScore}
        </div>
        <div className={styles.gameCanvasContainer}>
          <canvas
            ref={canvasRef}
            className={styles.gameCanvas}
            onPointerDown={(e) => {
              e.preventDefault();
              flap();
            }}
          />

          {status === "idle" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                flap();
              }}
            >
              <p className={styles.overlayTitle}>BREACH THE NETWORK</p>
              <p className={styles.overlayText}>
                Thrust your data packet through the firewalls. Tap, click, or
                press SPACE to fly.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {status === "over" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                flap();
              }}
            >
              <p className={styles.overlayTitle}>CONNECTION TERMINATED</p>
              <p className={styles.overlayText}>
                You bypassed {score} firewall{score === 1 ? "" : "s"}.
                {newRecord ? " New record!" : ""}
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CyberBird;
