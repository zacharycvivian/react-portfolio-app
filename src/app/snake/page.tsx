"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./snake.module.css"; // Adjust the import path as necessary

// Define a Point interface to type the snake segments and apple position
interface Point {
  x: number;
  y: number;
}

const SnakeGame: React.FC = () => {
  // Ref to access the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentSize = 20; // Define segment size as a constant
  // Effect hook for setting up and updating the game size on window resize
  useEffect(() => {
    const updateGameSize = () => {
      // Adjust the canvas size to match its parent container's size
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        const width = Math.floor(parent.clientWidth / segmentSize) * segmentSize;
        const height = Math.floor(parent.clientHeight / segmentSize) * segmentSize;
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

  // Effect hook to handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return; // Ignore key presses if game is over
      let shouldPreventDefault = true;
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
      if (!touchStartRef.current) {
        return;
      }
      // Determine the swipe direction based on the end position
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

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
  }, [dir, setDir]);

  // Effect hook for the main game loop
  useEffect(() => {
    if (gameOver) {
      alert("Game Over. Click to restart.");
      window.location.reload(); // Reload the page to restart the game
      return;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return; // Exit if the canvas context is not available

    const moveSnake = () => {
      // Calculate the new head position based on the current direction
      const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // Create a new snake array with the new head and without the last segment
      const newSnake = [newHead, ...snake.slice(0, -1)];

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
        setScore(score + 1); // Increment score
        spawnApple(); // Generate a new apple position
      }

      setSnake(newSnake); // Update the snake's position
    };

    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [snake, dir, apple, gameOver, gameSize, speed]);

  // Function to randomly place an apple within the game boundaries
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

  // Effect hook to draw the snake and the apple
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

  useEffect(() => {
    // Automatically scroll down 80 pixels to ensure the game is in full view
    window.scrollTo({
      top: 80,
      left: 0,
      behavior: 'smooth' // Optional: Adds a smooth scrolling effect
    });
  }, []);


  return (
    <div className={styles.container}>
      <div className={styles.game}>
        <div className={styles.score}>Apples Eaten: {score}</div>
        <canvas ref={canvasRef} className={styles.gameCanvas} />
      </div>
    </div>
  );
};

export default SnakeGame;
