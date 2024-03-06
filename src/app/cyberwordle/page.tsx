"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./cyberwordle.module.css";

type WordListType = string[];
type GuessesType = string[];

const CyberWordle: React.FC = () => {
  const [wordList, setWordList] = useState<WordListType>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [guesses, setGuesses] = useState<GuessesType>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState(["", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/CyberWordList.txt")
      .then((response) => response.text())
      .then((text) => {
        const words: WordListType = text
          .split("\n")
          .map((word) => word.trim())
          .filter((word) => word.length === 5);
        setWordList(words);
        setCurrentWord(
          words[Math.floor(Math.random() * words.length)].toUpperCase()
        );
      });
  }, []);

  useEffect(() => {
    // Cast the elements to HTMLCanvasElement explicitly
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

  const handleSubmitGuess = (): void => {
    const guess = inputValues.join("");
    // Add a check for spaces or non-alphabetic characters
    if (guess.length !== 5 || gameOver || /[^a-zA-Z]/.test(guess)) {
      alert(
        "Each box must contain a single alphabetic letter. No spaces or special characters allowed."
      );
      return;
    }
    // Update the guesses state immediately with the new guess
    const newGuesses = [...guesses, guess.toUpperCase()];
    setGuesses(newGuesses);
    if (guess.toUpperCase() === currentWord) {
      setTimeout(() => {
        alert("Congratulations, you guessed the word!");
        setGameOver(true);
      }, 500);
    } else if (newGuesses.length >= 6) {
      setTimeout(() => {
        alert(`Game over! The word was ${currentWord}.`);
        setGameOver(true);
      }, 500);
    }
    // Clear the input fields after submission
    setInputValues(["", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((values) =>
      values.map((val, i) => (i === index ? value.toUpperCase() : val))
    );
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !inputValues[index] && index > 0) {
      setInputValues((values) =>
        values.map((val, i) => (i === index - 1 ? "" : val))
      );
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleSubmitGuess();
    }
  };

  const renderInputBoxes = () => {
    return inputValues.map((value, index) => (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        maxLength={1}
        disabled={gameOver}
        className={styles.letterInput}
      />
    ));
  };

  const renderGuessFeedback = (
    guess: string,
    isCorrectWord: boolean = false
  ): JSX.Element[] => {
    return guess.split("").map((letter, index) => {
      const letterStyle = isCorrectWord
        ? styles.red
        : getLetterStyle(letter, index);
      return (
        <span key={index} className={letterStyle}>
          {letter.toUpperCase()}
        </span>
      );
    });
  };

  const getLetterStyle = (letter: string, index: number) => {
    if (currentWord[index] === letter) {
      return styles.green;
    } else if (currentWord.includes(letter)) {
      return styles.yellow;
    } else {
      return styles.gray;
    }
  };

  return (
    <div className={styles.matrixBackground}>
      <canvas id="canvas" className={styles.matrixCanvas}></canvas>
      <canvas id="canvas2" className={styles.matrixCanvasOverlay}></canvas>
      {/* Your game content here */}
      <div className={styles.container}>
        <div className={styles.game}>
          <h1 className={styles.title}>Cyber Wordle</h1>
          <div className={styles.inputBoxes}>{renderInputBoxes()}</div>
          <button
            className={styles.submitButton}
            onClick={handleSubmitGuess}
            disabled={gameOver}
          >
            Submit Guess
          </button>
          <div className={styles.guesses}>
            {guesses.map((guess, index) => (
              <div key={index} className={styles.guess}>
                {renderGuessFeedback(guess)}
              </div>
            ))}
            {gameOver && guesses[guesses.length - 1] !== currentWord && (
              <div className={styles.guess}>
                {renderGuessFeedback(currentWord, true)}
              </div>
            )}
          </div>
          {gameOver && (
            <button
              className={styles.restartButton}
              onClick={() => window.location.reload()}
            >
              Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CyberWordle;
