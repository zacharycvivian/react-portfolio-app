"use client";
/**
 * HeroText — client islands for the animated hero copy on the Home page.
 *
 * These are `"use client"` because they rely on browser-only behaviour:
 *  - `Greeting` derives a time-of-day greeting from the visitor's clock.
 *  - `RotatingWord` runs a per-character "re-typing" loop through a list of skills.
 *
 * The surrounding layout and static paragraph live in the Home Server Component.
 */
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeInVariant } from "@/components/motion/Animated";
import styles from "../page.module.css";

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/** Animated "Good <time>, I'm Zachary Vivian" headline. */
export function Greeting() {
  const greeting = useMemo(() => getTimeGreeting(), []);
  return (
    <motion.h1
      className={styles.welcomeMessage}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {greeting}, I&apos;m <strong>Zachary Vivian</strong>
    </motion.h1>
  );
}

const ROTATING_TEXTS = [
  "SOFTWARE IMPLEMENTATION",
  "RISK MANAGEMENT",
  "IT/CUSTOMER SUPPORT",
  "TECHNICAL TRAINING",
  "DOCUMENTATION",
  "SQL DATABASES",
  "WINDOWS + SERVER",
  "NETWORKING",
];

/** Cycles through {@link ROTATING_TEXTS}, re-typing one character at a time. */
export function RotatingWord() {
  const texts = useMemo(() => ROTATING_TEXTS, []);
  const [index, setIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(texts[0]);
  const [transitionIndex, setTransitionIndex] = useState(0);

  useEffect(() => {
    const currentWord = texts[index];
    const nextWord = texts[(index + 1) % texts.length];
    const maxTransitionLength = Math.max(currentWord.length, nextWord.length);

    if (transitionIndex <= maxTransitionLength) {
      const timeoutId = setTimeout(() => {
        const newChars =
          nextWord.slice(0, transitionIndex) +
          currentWord.slice(transitionIndex);
        setDisplayWord(newChars);
        setTransitionIndex(transitionIndex + 1);
      }, 75);
      return () => clearTimeout(timeoutId);
    }

    const pauseTimeoutId = setTimeout(() => {
      setIndex((index + 1) % texts.length);
      setTransitionIndex(0);
      setDisplayWord(nextWord);
    }, 2000);
    return () => clearTimeout(pauseTimeoutId);
  }, [transitionIndex, index, texts]);

  return (
    <div className={styles.textLoopContainer}>
      <h2>
        <strong>{displayWord}</strong>
      </h2>
    </div>
  );
}
