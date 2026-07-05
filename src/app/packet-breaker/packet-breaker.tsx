"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./packet-breaker.module.css";

// ── Constants (fixed internal resolution; the canvas is CSS-scaled) ──
const W = 600;
const H = 440;
const PADDLE_W = 94;
const PADDLE_H = 12;
const PADDLE_Y = H - 26;
const BALL_R = 7;
const ROWS = 5;
const COLS = 11;
const MARGIN_X = 14;
const BRICK_TOP = 52;
const BRICK_GAP = 6;
const BRICK_H = 20;
const BRICK_W = (W - MARGIN_X * 2 - (COLS - 1) * BRICK_GAP) / COLS;
const BASE_SPEED = 315; // px/s
const MAX_SPEED = 560;
const MAX_BOUNCE = Math.PI / 3; // 60° off the paddle
const START_LIVES = 3;

type Status = "idle" | "playing" | "over";

interface Brick {
  x: number;
  y: number;
  alive: boolean;
  hue: number;
}

interface GState {
  paddleX: number;
  ballX: number;
  ballY: number;
  velX: number;
  velY: number;
  bricks: Brick[];
  serve: boolean;
  speed: number;
  level: number;
  lives: number;
  score: number;
  over: boolean;
  animTime: number;
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

function buildBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: MARGIN_X + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        alive: true,
        hue: 4 + r * 9, // deep red at the bottom → amber up top
      });
    }
  }
  return bricks;
}

function freshState(): GState {
  return {
    paddleX: (W - PADDLE_W) / 2,
    ballX: W / 2,
    ballY: PADDLE_Y - BALL_R - 1,
    velX: 0,
    velY: 0,
    bricks: buildBricks(),
    serve: true,
    speed: BASE_SPEED,
    level: 1,
    lives: START_LIVES,
    score: 0,
    over: false,
    animTime: 0,
  };
}

function step(g: GState, dt: number) {
  g.animTime += dt;

  if (g.serve) {
    // Ball rides the paddle until launched.
    g.ballX = g.paddleX + PADDLE_W / 2;
    g.ballY = PADDLE_Y - BALL_R - 1;
    return;
  }

  g.ballX += g.velX * dt;
  g.ballY += g.velY * dt;

  // Side + top walls.
  if (g.ballX - BALL_R < 0) {
    g.ballX = BALL_R;
    g.velX = Math.abs(g.velX);
  } else if (g.ballX + BALL_R > W) {
    g.ballX = W - BALL_R;
    g.velX = -Math.abs(g.velX);
  }
  if (g.ballY - BALL_R < 0) {
    g.ballY = BALL_R;
    g.velY = Math.abs(g.velY);
  }

  // Paddle — deflect by where it strikes.
  if (
    g.velY > 0 &&
    g.ballY + BALL_R >= PADDLE_Y &&
    g.ballY - BALL_R <= PADDLE_Y + PADDLE_H &&
    g.ballX >= g.paddleX - BALL_R &&
    g.ballX <= g.paddleX + PADDLE_W + BALL_R
  ) {
    const offset = clamp((g.ballX - (g.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2), -1, 1);
    const angle = offset * MAX_BOUNCE;
    g.velX = g.speed * Math.sin(angle);
    g.velY = -g.speed * Math.cos(angle);
    g.ballY = PADDLE_Y - BALL_R - 1;
  }

  // Firewall blocks — reflect off the shallower penetration axis.
  for (const b of g.bricks) {
    if (!b.alive) continue;
    if (
      g.ballX + BALL_R > b.x &&
      g.ballX - BALL_R < b.x + BRICK_W &&
      g.ballY + BALL_R > b.y &&
      g.ballY - BALL_R < b.y + BRICK_H
    ) {
      const overlapL = g.ballX + BALL_R - b.x;
      const overlapR = b.x + BRICK_W - (g.ballX - BALL_R);
      const overlapT = g.ballY + BALL_R - b.y;
      const overlapB = b.y + BRICK_H - (g.ballY - BALL_R);
      if (Math.min(overlapL, overlapR) < Math.min(overlapT, overlapB)) {
        g.velX = -g.velX;
      } else {
        g.velY = -g.velY;
      }
      b.alive = false;
      g.score += 1;
      break; // at most one brick per frame
    }
  }

  // Layer cleared → rebuild faster.
  if (g.bricks.every((b) => !b.alive)) {
    g.level += 1;
    g.speed = Math.min(g.speed * 1.08, MAX_SPEED);
    g.bricks = buildBricks();
    g.serve = true;
    return;
  }

  // Ball lost below the paddle.
  if (!g.serve && g.ballY - BALL_R > H) {
    g.lives -= 1;
    if (g.lives <= 0) g.over = true;
    else g.serve = true;
  }
}

function draw(ctx: CanvasRenderingContext2D, g: GState) {
  ctx.clearRect(0, 0, W, H);

  // Scrolling grid.
  ctx.save();
  ctx.strokeStyle = "rgba(80,200,255,0.06)";
  ctx.lineWidth = 1;
  const scroll = (g.animTime * 24) % 40;
  for (let x = -scroll; x < W; x += 40) {
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

  // Firewall blocks.
  for (const b of g.bricks) {
    if (!b.alive) continue;
    ctx.save();
    ctx.shadowColor = `hsla(${b.hue}, 100%, 55%, 0.8)`;
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK_H);
    grad.addColorStop(0, `hsl(${b.hue} 100% 66%)`);
    grad.addColorStop(1, `hsl(${b.hue} 90% 46%)`);
    ctx.fillStyle = grad;
    rr(ctx, b.x, b.y, BRICK_W, BRICK_H, 4);
    ctx.fill();
    ctx.restore();
  }

  // Paddle — cyan node.
  ctx.save();
  ctx.shadowColor = "rgba(120,240,255,0.9)";
  ctx.shadowBlur = 14;
  const pg = ctx.createLinearGradient(g.paddleX, 0, g.paddleX + PADDLE_W, 0);
  pg.addColorStop(0, "#9bfcff");
  pg.addColorStop(1, "#12a9d8");
  ctx.fillStyle = pg;
  rr(ctx, g.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
  ctx.fill();
  ctx.restore();

  // Data packet (ball).
  ctx.save();
  ctx.shadowColor = "rgba(200,250,255,0.95)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#eaffff";
  ctx.beginPath();
  ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Launch hint.
  if (g.serve) {
    ctx.save();
    ctx.fillStyle = "rgba(230,250,255,0.85)";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("CLICK / SPACE TO LAUNCH", W / 2, PADDLE_Y - 26);
    ctx.restore();
  }
}

export default function PacketBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);

  const gameRef = useRef<GState>(freshState());
  const bestRef = useRef(0);
  const shownRef = useRef({ score: 0, lives: START_LIVES, level: 1 });

  useEffect(() => {
    const stored = Number(localStorage.getItem("packetBreakerBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshState();
    shownRef.current = { score: 0, lives: START_LIVES, level: 1 };
    setScore(0);
    setLives(START_LIVES);
    setLevel(1);
    setStatus("playing");
  }, []);

  const launch = useCallback(() => {
    const g = gameRef.current;
    if (status === "playing" && g.serve) {
      g.serve = false;
      const a = (Math.random() * 2 - 1) * (Math.PI / 8);
      g.velX = g.speed * Math.sin(a);
      g.velY = -g.speed * Math.cos(a);
    }
  }, [status]);

  // Keyboard: Space launches.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        launch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launch]);

  // Render / simulate.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = W;
    canvas.height = H;
    const g = gameRef.current;
    let raf = 0;

    if (status === "idle" || status === "over") {
      draw(ctx, g); // static frame behind the overlay
      return;
    }

    // status === "playing"
    const movePaddle = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      g.paddleX = clamp(x - PADDLE_W / 2, 0, W - PADDLE_W);
    };
    const onMouse = (e: MouseEvent) => movePaddle(e.clientX);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length) movePaddle(e.touches[0].clientX);
      e.preventDefault();
    };
    const onPointerDown = () => launch();

    window.addEventListener("mousemove", onMouse);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      step(g, dt);

      if (g.score !== shownRef.current.score) {
        shownRef.current.score = g.score;
        setScore(g.score);
      }
      if (g.lives !== shownRef.current.lives) {
        shownRef.current.lives = g.lives;
        setLives(g.lives);
      }
      if (g.level !== shownRef.current.level) {
        shownRef.current.level = g.level;
        setLevel(g.level);
      }

      draw(ctx, g);

      if (g.over) {
        if (g.score > bestRef.current) {
          bestRef.current = g.score;
          setBest(g.score);
          try {
            localStorage.setItem("packetBreakerBest", String(g.score));
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
      window.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [status, launch]);

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Packet Breaker</h1>
        <div className={styles.score}>
          Score: {score}
          <span className={styles.scoreDivider}>·</span>
          Lives: {lives}
          <span className={styles.scoreDivider}>·</span>
          Layer: {level}
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
              <p className={styles.overlayTitle}>BREACH THE FIREWALL</p>
              <p className={styles.overlayText}>
                Bounce the data packet off your node to smash every firewall
                block. Move with your mouse or finger; click / Space to launch.
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
              <p className={styles.overlayTitle}>FIREWALL RESTORED</p>
              <p className={styles.overlayText}>
                You smashed {score} block{score === 1 ? "" : "s"} across{" "}
                {level} layer{level === 1 ? "" : "s"}.
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
