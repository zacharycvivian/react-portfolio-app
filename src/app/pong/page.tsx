"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./pong.module.css"; // Adjust the import path as necessary

type Difficulty = "easy" | "medium" | "hard" | "impossible";

const PongGame: React.FC = () => {
  // First useEffect shows instructions to the player and sets a flag in sessionStorage to not show it again
  useEffect(() => {
    // Check if 'instructionsShown' key exists in sessionStorage
    if (sessionStorage.getItem("pongInstructionsShown") !== "true") {
      alert(
        "Welcome to Pong! Here's How to Play:\n\n" +
          "- Pick a difficulty: Easy, Medium, or Hard.\n" +
          "- Use your cursor, or finger if you're on mobile to move your 'paddle' in that direction.\n" +
          "- Play against the computer, your goal is to prevent the ball from entering your goal.\n" +
          "- First player to 5 points wins.\n\n" +
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
  const [paddleHeight, setPaddleHeight] = useState(60); // Initial default value


  // Constants for game settings
  let paddleWidth = 10; 
  const ballSize = 10;
  
  let playerPaddleY = 50;
  let computerPaddleY = 50;
  let ballX = 50;
  let ballY = 50;
  let ballSpeedX = 5;
  let ballSpeedY = 3;
  let computerPaddleSpeed = 4; // Set a default value that makes sense for your game

  const difficultySettings = {
    easy: {
      paddleHeight: 80, // Example size, adjust as needed
      ballSpeed: { x: 3, y: 2 }, // Example speeds, adjust as needed
      computerPaddleSpeed: 2, // Example speed, adjust as needed
    },
    medium: {
      paddleHeight: 60, // Example size, adjust as needed
      ballSpeed: { x: 5, y: 4 }, // Example speeds, adjust as needed
      computerPaddleSpeed: 4, // Example speed, adjust as needed
    },
    hard: {
      paddleHeight: 40, // Example size, adjust as needed
      ballSpeed: { x: 7, y: 6 }, // Example speeds, adjust as needed
      computerPaddleSpeed: 6, // Example speed, adjust as needed
    },
    impossible: {
        paddleHeight: 25, // Example size, adjust as needed
        ballSpeed: { x: 8, y: 7 }, // Example speeds, adjust as needed
        computerPaddleSpeed: 10, // Example speed, adjust as needed
      },
  };

  const startGame = (selectedDifficulty: Difficulty) => {
    setPlayerScore(0);
    setComputerScore(0);
    setGameStatus("playing");
    setDifficulty(selectedDifficulty);
  
    const settings = difficultySettings[selectedDifficulty];
    setPaddleHeight(settings.paddleHeight); // Update state to trigger re-render
    ballSpeedX = settings.ballSpeed.x;    // Valid reassignment
    ballSpeedY = settings.ballSpeed.y;    // Valid reassignment
    computerPaddleSpeed = settings.computerPaddleSpeed; // Assuming it's declared with let
    // Continue with game initialization...
  };

  useEffect(() => {
    const gameCanvas = gameCanvasRef.current;
    if (!gameCanvas || !gameCanvas.getContext) return;

    const ctx = gameCanvas.getContext("2d");
    if (!ctx) return;

    gameCanvas.width = 600;
    gameCanvas.height = 400;

    const resetBall = () => {
      ballX = gameCanvas.width / 2;
      ballY = gameCanvas.height / 2;
      ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
      ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
    };

    const checkCollisionWithPaddles = () => {
      // Player paddle collision
      if (
        ballX <= paddleWidth &&
        ballY > playerPaddleY &&
        ballY < playerPaddleY + paddleHeight
      ) {
        ballSpeedX = -ballSpeedX;
      }
      // Computer paddle collision
      if (
        ballX >= gameCanvas.width - paddleWidth - ballSize &&
        ballY > computerPaddleY &&
        ballY < computerPaddleY + paddleHeight
      ) {
        ballSpeedX = -ballSpeedX;
      }
    };

    const moveComputerPaddle = () => {
        const targetY = ballY - (paddleHeight / 2);
        
        if (computerPaddleY + paddleHeight / 2 < targetY) {
          computerPaddleY += computerPaddleSpeed; // Use computerPaddleSpeed directly
        } else if (computerPaddleY + paddleHeight / 2 > targetY) {
          computerPaddleY -= computerPaddleSpeed; // Use computerPaddleSpeed directly
        }
      
        // Ensure the computer paddle does not move beyond the canvas boundaries
        computerPaddleY = Math.max(0, computerPaddleY); // Prevent moving above the canvas
        computerPaddleY = Math.min(gameCanvas.height - paddleHeight, computerPaddleY); // Prevent moving below the canvas
      };
      
      

    const gameLoop = () => {
      if (gameStatus !== "playing") {
        return;
      }

      ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Clear the canvas

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Wall collision
      if (ballY <= 0 || ballY >= gameCanvas.height - ballSize) {
        ballSpeedY = -ballSpeedY;
      }

      // Score update and ball reset
      if (ballX < 0) {
        setComputerScore((score) => {
          if (score + 1 === 5) {
            setGameStatus("ended");
          }
          return score + 1;
        });
        resetBall();
      } else if (ballX > gameCanvas.width) {
        setPlayerScore((score) => {
          if (score + 1 === 5) {
            setGameStatus("ended");
          }
          return score + 1;
        });
        resetBall();
      }

      checkCollisionWithPaddles();
      moveComputerPaddle();

      // Draw paddles and ball
      ctx.fillStyle = "white";
      ctx.fillRect(0, playerPaddleY, paddleWidth, paddleHeight);
      ctx.fillRect(
        gameCanvas.width - paddleWidth,
        computerPaddleY,
        paddleWidth,
        paddleHeight
      );
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2, true);
      ctx.fill();

      if (gameStatus === "playing") {
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = gameCanvas.getBoundingClientRect();
      playerPaddleY = event.clientY - rect.top - paddleHeight / 2;
      playerPaddleY = Math.max(0, playerPaddleY);
      playerPaddleY = Math.min(gameCanvas.height - paddleHeight, playerPaddleY);
    };
    document.addEventListener("mousemove", handleMouseMove);

    if (gameStatus === "playing") {
      resetBall();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus]);

  return (
    <div className={styles.matrixBackground}>
      <canvas id="canvas" className={styles.matrixCanvas}></canvas>
      <canvas id="canvas2" className={styles.matrixCanvasOverlay}></canvas>
      <div className={styles.container}>
        <h1 className={styles.title}>Pong</h1>
        <div className={styles.scoreDisplay}>
          Player: {playerScore} | Computer: {computerScore}
        </div>
        <div
          className={styles.gameCanvasContainer}
          style={{ position: "relative" }}
        >
          <canvas ref={gameCanvasRef} className={styles.gameCanvas}></canvas>

          {gameStatus === "idle" && (
            <div className={styles.centeredControls}>
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
          )}

          {gameStatus === "ended" && (
            <div className={styles.centeredMessage}>
              <p>
                Game Over. {playerScore === 5 ? "Player" : "Computer"} Wins!
              </p>
              <button
                className={styles.Button}
                onClick={() => {
                  setPlayerScore(0);
                  setComputerScore(0);
                  setGameStatus("idle");
                }}
              >
                Restart Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PongGame;
