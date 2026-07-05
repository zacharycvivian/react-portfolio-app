"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./snake.module.css"; // Adjust the import path as necessary

// Define a Point interface to type the snake segments and apple position
interface Point {
  x: number;
  y: number;
}

/** Rounded-rect path helper for the neon game nodes. */
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

const SnakeGame: React.FC = () => {
  // First useEffect initializes the matrix-style animation background
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

    // Second useEffect shows instructions to the player and sets a flag in sessionStorage to not show it again
    useEffect(() => {
      // Check if 'instructionsShown' key exists in sessionStorage
      if (sessionStorage.getItem("snakeInstructionsShown") !== "true") {
        alert(
          "Welcome to Snake! Here's How to Play:\n\n" +
            "- You are the GREEN node snaking through the grid.\n" +
            "- Use arrow keys, or swipe on mobile, to change direction.\n" +
            "- Capture the red DATA PACKETS by colliding with them.\n" +
            "- Grab as many as you can without hitting the walls or your own trail.\n" +
            "- Fill the entire grid with your node and YOU WIN.\n\n" +
            "Good Luck!"
        );
  
        // Set 'instructionsShown' in sessionStorage
        sessionStorage.setItem("snakeInstructionsShown", "true");
      }
    }, []);

  // State and refs setup for the game mechanics
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentSize = 20; // Define segment size as a constant
  const [gameSize, setGameSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  // State hooks for game mechanics
  const [snake, setSnake] = useState<Point[]>([{ x: 20, y: 20 }]);
  const [dir, setDir] = useState<{ x: number; y: number }>({ x: 20, y: 0 });
  const [apple, setApple] = useState<Point>({ x: 200, y: 200 });
  const [speed, setSpeed] = useState<number>(100); // Speed adjusted for better playability
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showRestartButton, setShowRestartButton] = useState(false);
  // The snake used to start moving on page load and could die before the
  // player even touched a key — wait for the first input instead.
  const [started, setStarted] = useState(false);

  // This useEffect is responsible for adjusting the game size to fit the parent container
  useEffect(() => {
    const updateGameSize = () => {
      // Adjust the canvas size to match its parent container's size
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        const width =
          Math.floor(parent.clientWidth / segmentSize) * segmentSize;
        const height =
          Math.floor(parent.clientHeight / segmentSize) * segmentSize;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        setGameSize({
          width,
          height,
        });
      }
    };

    // Listen for window resize, load, and orientation change events
    window.addEventListener("resize", updateGameSize);
    // This call handles initial sizing.
    updateGameSize();

    // Added to handle cases where the initial sizing might not account for dynamic viewport changes.
    const handleLoadOrOrientationChange = () => {
      updateGameSize(); // Adjust game size on full page load or orientation change.
    };

    window.addEventListener("load", handleLoadOrOrientationChange);
    window.addEventListener("orientationchange", handleLoadOrOrientationChange);

    return () => {
      window.removeEventListener("resize", updateGameSize);
      window.removeEventListener("load", handleLoadOrOrientationChange);
      window.removeEventListener(
        "orientationchange",
        handleLoadOrOrientationChange
      );
    };
  }, []); // Ensure this runs only once when the component mounts.

  // Effect hook to handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return; // Ignore key presses if game is over
      let shouldPreventDefault = true;
      if (e.key.startsWith("Arrow")) setStarted(true);
      switch (e.key) {
        // Update direction based on arrow key pressed, preventing reverse movement
        case "ArrowUp":
          if (dir.y === 0) setDir({ x: 0, y: -20 });
          break;
        case "ArrowDown":
          if (dir.y === 0) setDir({ x: 0, y: 20 });
          break;
        case "ArrowLeft":
          if (dir.x === 0) setDir({ x: -20, y: 0 });
          break;
        case "ArrowRight":
          if (dir.x === 0) setDir({ x: 20, y: 0 });
          break;
        default:
          shouldPreventDefault = false;
          break;
      }
      if (shouldPreventDefault) e.preventDefault();
    };

    // Add and remove the event listener
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dir, gameOver]);

  // Effect hook to handle touch controls for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Record the start position of a touch
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || gameOver) {
        return;
      }
      // Determine the swipe direction based on the end position
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      setStarted(true);
      // Set the direction based on the swipe gesture, preventing reverse movement
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement
        if (deltaX > 0 && dir.x === 0) setDir({ x: 20, y: 0 }); // Right swipe
        else if (deltaX < 0 && dir.x === 0) setDir({ x: -20, y: 0 }); // Left swipe
      } else {
        // Vertical movement
        if (deltaY > 0 && dir.y === 0) setDir({ x: 0, y: 20 }); // Down swipe
        else if (deltaY < 0 && dir.y === 0) setDir({ x: 0, y: -20 }); // Up swipe
      }
      touchStartRef.current = null; // Reset start position after determining the swipe direction
      e.preventDefault(); // Prevent default to avoid scrolling and zooming
    };

    const gameCanvas = canvasRef.current;
    // Attach event listeners for touch start and move
    if (gameCanvas) {
      gameCanvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      gameCanvas.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
    }

    // Cleanup by removing event listeners
    return () => {
      if (gameCanvas) {
        gameCanvas.removeEventListener("touchstart", handleTouchStart);
        gameCanvas.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [dir, gameOver]);

  // Function to randomly place an apple within the game boundaries
  const spawnApple = useCallback(() => {
    let potentialApple: Point;
    let isOccupied = false;

    do {
      // Generate a random position within the game boundaries
      potentialApple = {
        x: Math.floor(Math.random() * (gameSize.width / 20)) * 20,
        y: Math.floor(Math.random() * (gameSize.height / 20)) * 20,
      };

      // Check if the generated position collides with any part of the snake
      isOccupied = snake.some(
        (segment) =>
          segment.x === potentialApple.x && segment.y === potentialApple.y
      );
    } while (isOccupied); // Repeat until an unoccupied position is found

    setApple(potentialApple);
  }, [gameSize.height, gameSize.width, snake]);

  // The initial apple is a hardcoded (200, 200); on small screens that can be
  // outside the canvas entirely, making the game unwinnable. Respawn it
  // in-bounds once the real canvas size is known (or after a resize).
  useEffect(() => {
    if (!gameSize.width || !gameSize.height) return;
    if (apple.x >= gameSize.width || apple.y >= gameSize.height) {
      spawnApple();
    }
  }, [gameSize, apple, spawnApple]);

  // Effect hook for the main game loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return; // Exit if the canvas context is not available

    const moveSnake = () => {
      // Calculate the new head position based on the current direction
      const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // Create a new snake array with the new head and without the last segment
      const newSnake = [newHead, ...snake.slice(0, -1)];
      if (gameOver) return; // Add this line to ensure no game logic runs after game over

      // Check for collisions with the game boundaries or itself
      if (
        newHead.x >= gameSize.width ||
        newHead.x < 0 ||
        newHead.y >= gameSize.height ||
        newHead.y < 0 ||
        newSnake
          .slice(1)
          .some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        setShowRestartButton(true);
        return;
      }

      // Check if the snake has eaten the apple
      if (newHead.x === apple.x && newHead.y === apple.y) {
        // Increase the snake's length by adding segments at the end
        for (let i = 0; i < 5; i++) {
          const lastSegment = newSnake[newSnake.length - 1];
          const newSegment = { x: lastSegment.x, y: lastSegment.y };
          newSnake.push(newSegment);
        }
        setScore((prev) => prev + 1); // Increment score
        setSpeed((prev) => Math.max(55, prev - 2)); // Speed up a touch per apple
        spawnApple(); // Generate a new apple position
      }

      setSnake(newSnake); // Update the snake's position
    };

    if (!started) return; // Wait for the player's first input before moving
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [snake, dir, apple, gameOver, gameSize, speed, spawnApple, started]);

  const restartGame = () => {
    setSnake([{ x: 20, y: 20 }]);
    setDir({ x: 20, y: 0 });
    spawnApple();
    setScore(0);
    setSpeed(100);
    setGameOver(false);
    setShowRestartButton(false);
    setStarted(false);
  };

  // Effect hook to draw the snake and the apple
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const W = gameSize.width;
    const H = gameSize.height;
    ctx.clearRect(0, 0, W, H);

    // Neon grid aligned to the cell size.
    ctx.strokeStyle = "rgba(120,240,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += segmentSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += segmentSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Target data packet (the "apple").
    ctx.save();
    ctx.shadowColor = "rgba(255,90,70,0.9)";
    ctx.shadowBlur = 14;
    const ag = ctx.createLinearGradient(
      apple.x,
      apple.y,
      apple.x + segmentSize,
      apple.y + segmentSize
    );
    ag.addColorStop(0, "#ff8a6b");
    ag.addColorStop(1, "#ff4d4d");
    ctx.fillStyle = ag;
    rr(ctx, apple.x + 2, apple.y + 2, segmentSize - 4, segmentSize - 4, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(255,220,200,0.9)";
    ctx.beginPath();
    ctx.arc(apple.x + segmentSize / 2, apple.y + segmentSize / 2, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Snake — glowing green data nodes; the head is brighter with a visor.
    snake.forEach((segment, index) => {
      const head = index === 0;
      ctx.save();
      ctx.shadowColor = head ? "rgba(130,255,150,0.95)" : "rgba(70,230,120,0.55)";
      ctx.shadowBlur = head ? 16 : 8;
      const g = ctx.createLinearGradient(
        segment.x,
        segment.y,
        segment.x + segmentSize,
        segment.y + segmentSize
      );
      g.addColorStop(0, head ? "#c6ffce" : "#4be38a");
      g.addColorStop(1, head ? "#39ff88" : "#17b45f");
      ctx.fillStyle = g;
      rr(ctx, segment.x + 2, segment.y + 2, segmentSize - 4, segmentSize - 4, head ? 6 : 5);
      ctx.fill();
      ctx.restore();

      if (head) {
        ctx.fillStyle = "rgba(6,26,16,0.85)";
        rr(ctx, segment.x + 5, segment.y + 6, segmentSize - 10, 5, 2);
        ctx.fill();
      }
    });
  }, [snake, apple, gameSize]);

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
        <h2 className={styles.title}>Snake</h2>
        <div className={styles.score}>Data Packets: {score}</div>
        <div className={styles.aspectRatioBox}>
          <canvas ref={canvasRef} className={styles.gameCanvas} />

          {!started && !gameOver && (
            <div
              className={styles.overlay}
              onPointerDown={() => setStarted(true)}
            >
              <p className={styles.overlayTitle}>INFILTRATE THE GRID</p>
              <p className={styles.overlayText}>
                Steer your node to capture data packets. Don&apos;t hit the walls
                or your own trail. Arrow keys or swipe — tap to jack in.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {gameOver && (
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>SYSTEM TRACE COMPLETE</p>
              <p className={styles.overlayText}>
                You captured {score} data packet{score === 1 ? "" : "s"}. Run it
                back?
              </p>
              <button className={styles.restartButton} onClick={restartGame}>
                Reconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
