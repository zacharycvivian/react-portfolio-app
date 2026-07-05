"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./pong.module.css"; // Adjust the import path as necessary

type Difficulty = "easy" | "medium" | "hard" | "impossible";

// ── Game constants ────────────────────────────────────────────
// All speeds are in px/SECOND and integrated with delta time, so the game
// runs identically on 60Hz and 144Hz displays (the old version moved the
// ball a fixed distance per frame — hence "way too fast" on fast monitors).
const CANVAS_W = 600;
const CANVAS_H = 400;
const PADDLE_W = 10;
const BALL_R = 5;
const WIN_SCORE = 5;
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60° off-center deflection
const SPEED_RAMP = 1.05; // rally speeds up 5% per paddle hit...
const MAX_RAMP = 1.6; // ...up to +60%
const SERVE_DELAY = 0.9; // seconds of breathing room between points

const difficultySettings: Record<
  Difficulty,
  { paddleHeight: number; ballSpeed: number; aiSpeed: number }
> = {
  easy: { paddleHeight: 80, ballSpeed: 250, aiSpeed: 170 },
  medium: { paddleHeight: 60, ballSpeed: 310, aiSpeed: 240 },
  hard: { paddleHeight: 45, ballSpeed: 380, aiSpeed: 330 },
  impossible: { paddleHeight: 30, ballSpeed: 440, aiSpeed: 600 },
};

const PongGame: React.FC = () => {
  // First useEffect shows instructions to the player and sets a flag in sessionStorage to not show it again
  useEffect(() => {
    // Check if 'instructionsShown' key exists in sessionStorage
    if (sessionStorage.getItem("pongInstructionsShown") !== "true") {
      alert(
        "Welcome to Pong! Here's How to Play:\n\n" +
          "- You are the CYAN node; you're up against a red SENTINEL.\n" +
          "- Pick a threat level: Easy, Medium, Hard, or Impossible.\n" +
          "- Move your cursor, or finger on mobile, to steer your node.\n" +
          "- Deflect the data packet and keep it out of your goal.\n" +
          "- First to 5 points breaches the firewall and wins.\n\n" +
          "Good Luck!"
      );

      // Set 'instructionsShown' in sessionStorage
      sessionStorage.setItem("pongInstructionsShown", "true");
    }
  }, []);

  // Second useEffect initializes the matrix-style animation background
  useEffect(() => {
    var canvas = document.getElementById("canvas") as HTMLCanvasElement;
    var ctx = canvas!.getContext("2d")!;
    var canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
    var ctx2 = canvas2!.getContext("2d")!;
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    var charArr = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ];
    var maxCharCount = 100;
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

    // Clean up the animation frame when the component unmounts
    return () => {
      cancelAnimationFrame(requestId);
    };
  }, []);

  const [gameStatus, setGameStatus] = useState("idle");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty | "">(""); // Use the Difficulty type for your state
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);

  // Mutable game state lives in one ref so the rAF loop never fights React
  // re-renders. Scores are the only game state React needs to know about.
  const gameRef = useRef({
    playerY: (CANVAS_H - 60) / 2,
    aiY: (CANVAS_H - 60) / 2,
    ballX: CANVAS_W / 2,
    ballY: CANVAS_H / 2,
    velX: 0,
    velY: 0,
    paddleH: 60,
    ballSpeed: 310,
    aiSpeed: 240,
    ramp: 1,
    serveTimer: 0,
    serveDir: 1 as 1 | -1,
  });

  const startGame = (selectedDifficulty: Difficulty) => {
    const settings = difficultySettings[selectedDifficulty];
    const g = gameRef.current;
    g.paddleH = settings.paddleHeight;
    g.ballSpeed = settings.ballSpeed;
    g.aiSpeed = settings.aiSpeed;
    g.playerY = (CANVAS_H - settings.paddleHeight) / 2;
    g.aiY = (CANVAS_H - settings.paddleHeight) / 2;
    g.ballX = CANVAS_W / 2;
    g.ballY = CANVAS_H / 2;
    g.velX = 0;
    g.velY = 0;
    g.ramp = 1;
    g.serveTimer = SERVE_DELAY;
    g.serveDir = Math.random() > 0.5 ? 1 : -1;

    setPlayerScore(0);
    setComputerScore(0);
    setDifficulty(selectedDifficulty);
    setGameStatus("playing");
  };

  useEffect(() => {
    if (gameStatus !== "playing") return;
    const gameCanvas = gameCanvasRef.current;
    const ctx = gameCanvas?.getContext("2d");
    if (!gameCanvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gameCanvas.width = CANVAS_W * dpr;
    gameCanvas.height = CANVAS_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = gameRef.current;
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    /** Queue the next serve: ball parks at center until the timer runs out. */
    const queueServe = (dir: 1 | -1) => {
      g.ballX = CANVAS_W / 2;
      g.ballY = CANVAS_H / 2;
      g.velX = 0;
      g.velY = 0;
      g.ramp = 1;
      g.serveDir = dir;
      g.serveTimer = SERVE_DELAY;
    };

    /** Launch the ball at a shallow random angle toward `serveDir`. */
    const serve = () => {
      const angle = (Math.random() * 2 - 1) * (Math.PI / 6); // ±30°
      g.velX = Math.cos(angle) * g.ballSpeed * g.serveDir;
      g.velY = Math.sin(angle) * g.ballSpeed;
    };

    /** Deflect off a paddle: exit angle depends on where the ball struck, so
     * players can aim shots with the paddle edge — and each hit speeds the
     * rally up slightly. */
    const bounce = (paddleY: number, dir: 1 | -1) => {
      const offset = clamp(
        (g.ballY - (paddleY + g.paddleH / 2)) / (g.paddleH / 2 + BALL_R),
        -1,
        1
      );
      g.ramp = Math.min(g.ramp * SPEED_RAMP, MAX_RAMP);
      const speed = g.ballSpeed * g.ramp;
      const angle = offset * MAX_BOUNCE_ANGLE;
      g.velX = Math.cos(angle) * speed * dir;
      g.velY = Math.sin(angle) * speed;
    };

    const step = (dt: number) => {
      // Serve pause: hold the ball at center, then launch.
      if (g.serveTimer > 0) {
        g.serveTimer -= dt;
        if (g.serveTimer <= 0) serve();
      } else {
        g.ballX += g.velX * dt;
        g.ballY += g.velY * dt;
      }

      // Top/bottom walls — clamp position so the ball can't tunnel out and
      // oscillate against the wall.
      if (g.ballY - BALL_R < 0) {
        g.ballY = BALL_R;
        g.velY = Math.abs(g.velY);
      } else if (g.ballY + BALL_R > CANVAS_H) {
        g.ballY = CANVAS_H - BALL_R;
        g.velY = -Math.abs(g.velY);
      }

      // Player paddle (left). Only while the ball moves left, and snap the
      // ball flush with the paddle face so it can never get stuck inside.
      if (
        g.velX < 0 &&
        g.ballX - BALL_R <= PADDLE_W &&
        g.ballX + BALL_R > 0 &&
        g.ballY > g.playerY - BALL_R &&
        g.ballY < g.playerY + g.paddleH + BALL_R
      ) {
        g.ballX = PADDLE_W + BALL_R;
        bounce(g.playerY, 1);
      }

      // Computer paddle (right).
      if (
        g.velX > 0 &&
        g.ballX + BALL_R >= CANVAS_W - PADDLE_W &&
        g.ballX - BALL_R < CANVAS_W &&
        g.ballY > g.aiY - BALL_R &&
        g.ballY < g.aiY + g.paddleH + BALL_R
      ) {
        g.ballX = CANVAS_W - PADDLE_W - BALL_R;
        bounce(g.aiY, -1);
      }

      // Scoring — ball fully past an edge. Point, then serve toward whoever
      // just conceded.
      if (g.ballX + BALL_R < 0) {
        setComputerScore((s) => {
          if (s + 1 >= WIN_SCORE) setGameStatus("ended");
          return s + 1;
        });
        queueServe(-1);
      } else if (g.ballX - BALL_R > CANVAS_W) {
        setPlayerScore((s) => {
          if (s + 1 >= WIN_SCORE) setGameStatus("ended");
          return s + 1;
        });
        queueServe(1);
      }

      // AI: chase the ball only while it's incoming; otherwise drift back to
      // center. The dead-zone stops it vibrating once aligned.
      const aiTarget = g.velX > 0 ? g.ballY : CANVAS_H / 2;
      const aiCenter = g.aiY + g.paddleH / 2;
      const diff = aiTarget - aiCenter;
      if (Math.abs(diff) > 6) {
        const move = clamp(diff, -g.aiSpeed * dt, g.aiSpeed * dt);
        g.aiY = clamp(g.aiY + move, 0, CANVAS_H - g.paddleH);
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Scrolling cyber grid.
      ctx.save();
      ctx.strokeStyle = "rgba(80,200,255,0.06)";
      ctx.lineWidth = 1;
      const scroll = (t * 40) % 40;
      for (let x = -scroll; x < CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }
      ctx.restore();

      // Drifting scan-line glow.
      const scanY = ((t * 60) % (CANVAS_H + 40)) - 20;
      const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scan.addColorStop(0, "rgba(120,240,255,0)");
      scan.addColorStop(0.5, "rgba(120,240,255,0.06)");
      scan.addColorStop(1, "rgba(120,240,255,0)");
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 30, CANVAS_W, 60);

      // Glowing center line.
      ctx.save();
      ctx.strokeStyle = "rgba(120,240,255,0.35)";
      ctx.shadowColor = "rgba(120,240,255,0.6)";
      ctx.shadowBlur = 8;
      ctx.setLineDash([8, 12]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, 0);
      ctx.lineTo(CANVAS_W / 2, CANVAS_H);
      ctx.stroke();
      ctx.restore();

      // Player paddle — a cyan data node.
      ctx.save();
      ctx.shadowColor = "rgba(120,240,255,0.9)";
      ctx.shadowBlur = 14;
      const pg = ctx.createLinearGradient(0, 0, PADDLE_W, 0);
      pg.addColorStop(0, "#9bfcff");
      pg.addColorStop(1, "#12a9d8");
      ctx.fillStyle = pg;
      ctx.fillRect(0, g.playerY, PADDLE_W, g.paddleH);
      ctx.restore();

      // Sentinel paddle — hostile red.
      ctx.save();
      ctx.shadowColor = "rgba(255,90,70,0.9)";
      ctx.shadowBlur = 14;
      const ag = ctx.createLinearGradient(CANVAS_W - PADDLE_W, 0, CANVAS_W, 0);
      ag.addColorStop(0, "#ff8a3d");
      ag.addColorStop(1, "#ff4d4d");
      ctx.fillStyle = ag;
      ctx.fillRect(CANVAS_W - PADDLE_W, g.aiY, PADDLE_W, g.paddleH);
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
    };

    let last = performance.now();
    let elapsed = 0;
    const gameLoop = (now: number) => {
      // Clamp dt so a background-tab pause doesn't teleport the ball.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt;
      step(dt);
      draw(elapsed);
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    /** Map a pointer's viewport Y to canvas coordinates. The canvas is CSS
     * scaled (width: 100%), so clientY must be rescaled — the old code
     * skipped this, making the paddle drift away from the cursor whenever
     * the canvas wasn't rendered at exactly 600×400. */
    const paddleFromClientY = (clientY: number) => {
      const rect = gameCanvas.getBoundingClientRect();
      const y = ((clientY - rect.top) / rect.height) * CANVAS_H;
      g.playerY = clamp(y - g.paddleH / 2, 0, CANVAS_H - g.paddleH);
    };

    const handleMouseMove = (event: MouseEvent) => paddleFromClientY(event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      paddleFromClientY(event.touches[0].clientY);
      event.preventDefault(); // Prevent scrolling when moving the paddle
    };

    document.addEventListener("mousemove", handleMouseMove);
    gameCanvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    animationFrameId.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      gameCanvas.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus]);

  useEffect(() => {
    // Automatically scroll down 80 pixels to ensure the game is in full view
    window.scrollTo({
      top: 80,
      left: 0,
      behavior: "smooth", // Optional: Adds a smooth scrolling effect
    });
  }, []);

  return (
    <div className={styles.matrixBackground}>
      <canvas id="canvas" className={styles.matrixCanvas}></canvas>
      <canvas id="canvas2" className={styles.matrixCanvasOverlay}></canvas>
      <div className={styles.container}>
        <h1 className={styles.title}>Pong</h1>
        <div className={styles.score}>
          USER {playerScore}
          <span className={styles.scoreDivider}>{"//"}</span>
          SENTINEL {computerScore}
        </div>
        <div
          className={styles.gameCanvasContainer}
          style={{ position: "relative" }}
        >
          <canvas ref={gameCanvasRef} className={styles.gameCanvas}></canvas>

          {gameStatus === "idle" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>SELECT THREAT LEVEL</p>
              <div className={styles.difficultyRow}>
                <button className={styles.Button} onClick={() => startGame("easy")}>
                  Easy
                </button>
                <button className={styles.Button} onClick={() => startGame("medium")}>
                  Medium
                </button>
                <button className={styles.Button} onClick={() => startGame("hard")}>
                  Hard
                </button>
                <button className={styles.Button} onClick={() => startGame("impossible")}>
                  Impossible
                </button>
              </div>
              <p className={styles.overlayText}>
                Move your cursor or finger to steer the cyan node. First to{" "}
                {WIN_SCORE} breaches the firewall.
              </p>
            </div>
          )}

          {gameStatus === "ended" && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>
                {playerScore === WIN_SCORE ? "FIREWALL BREACHED" : "CONNECTION LOST"}
              </p>
              <p className={styles.overlayText}>
                {playerScore === WIN_SCORE
                  ? "You outpaced the sentinel and slipped through."
                  : "The sentinel held the line. Try again."}
              </p>
              <button
                className={styles.Button}
                onClick={() => {
                  setPlayerScore(0);
                  setComputerScore(0);
                  setGameStatus("idle");
                }}
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PongGame;
