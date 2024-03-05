"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./CyberWordle.module.css"; // Ensure you have this CSS file in your project

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

    // Display logic for guesses remains the same as previously implemented

    if (guess.toUpperCase() === currentWord) {
      setTimeout(() => {
        alert("Congratulations, you guessed the word!");
        setGameOver(true);
      }, 500); // Adjust delay as needed
    } else if (newGuesses.length >= 6) {
      // Assuming 6 attempts are allowed
      setTimeout(() => {
        alert(`Game over! The word was ${currentWord}.`);
        setGameOver(true);
      }, 500); // Adjust delay as needed
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
      inputRefs.current[index + 1]?.focus(); // Move focus to the next field
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !inputValues[index] && index > 0) {
      setInputValues((values) =>
        values.map((val, i) => (i === index - 1 ? "" : val))
      ); 
      inputRefs.current[index - 1]?.focus(); // Move focus to the previous field
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

  // Inside your CyberWordle component

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

  // Adjusted part of the return statement in the render method

  return (
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
  );
};

export default CyberWordle;
