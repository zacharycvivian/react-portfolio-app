"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./snake.module.css"; // Adjust the import path as necessary

interface Point {
  x: number;
  y: number;
}

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const updateGameSize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        canvasRef.current.width = parent.clientWidth;
        canvasRef.current.height = parent.clientHeight;
        setGameSize({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

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

  const [gameSize, setGameSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [snake, setSnake] = useState<Point[]>([{ x: 20, y: 20 }]);
  const [dir, setDir] = useState<{ x: number; y: number }>({ x: 20, y: 0 });
  const [apple, setApple] = useState<Point>({ x: 200, y: 200 });
  const [speed, setSpeed] = useState<number>(100); // Speed adjusted for better playability
  const [gameOver, setGameOver] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      let shouldPreventDefault = true;
      switch (e.key) {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dir, gameOver]);

  useEffect(() => {
    if (gameOver) {
      alert("Game Over. Click to restart.");
      window.location.reload();
      return;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const moveSnake = () => {
      const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const newSnake = [newHead, ...snake.slice(0, -1)];

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
        return;
      }

      if (newHead.x === apple.x && newHead.y === apple.y) {
        for (let i = 0; i < 5; i++) {
          // Clone the last segment of the snake to create a new segment
          const lastSegment = newSnake[newSnake.length - 1];
          const newSegment = { x: lastSegment.x, y: lastSegment.y };
          newSnake.push(newSegment);
        }
        spawnApple();
      }

      setSnake(newSnake);
    };

    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [snake, dir, apple, gameOver, gameSize, speed]);

  const spawnApple = () => {
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
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, gameSize.width, gameSize.height);
    ctx.fillStyle = "red";
    ctx.fillRect(apple.x, apple.y, 20, 20);

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "darkgreen" : "green";
      ctx.fillRect(segment.x, segment.y, 20, 20);
    });
  }, [snake, apple, gameSize]);

  return (
    <div className={styles.container}>
      <div className={styles.game}>
        <canvas ref={canvasRef} className={styles.gameCanvas} />
      </div>
    </div>
  );
};

export default SnakeGame;
