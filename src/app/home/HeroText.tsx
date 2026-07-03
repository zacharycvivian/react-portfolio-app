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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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

/**
 * Cycles through {@link ROTATING_TEXTS} with a vertical roll: the current
 * skill springs up and out while the next one rolls in beneath it. Unlike the
 * old character-splice (which showed "RISK MANAGEMENTTION"-style hybrids
 * mid-transition), every frame shows a real, readable word. Respects
 * prefers-reduced-motion (static first word) and pauses in hidden tabs.
 */
export function RotatingWord() {
  const texts = useMemo(() => ROTATING_TEXTS, []);
  const [index, setIndex] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => {
      if (document.hidden) return; // don't churn in background tabs
      setIndex((i) => (i + 1) % texts.length);
    }, 2800);
    return () => clearInterval(id);
  }, [prefersReduced, texts.length]);

  return (
    <div className={styles.textLoopContainer}>
      <span className={styles.rotatingLabel} aria-hidden="true">
        Specializing in
      </span>
      {/* The rolling word is decorative noise for screen readers; give them
          one static, meaningful heading instead. */}
      <h2 className={styles.rotatingViewport} aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.strong
            key={texts[index]}
            className={styles.rotatingWord}
            initial={{ y: "1.1em", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-1.1em", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {texts[index]}
          </motion.strong>
        </AnimatePresence>
      </h2>
      <h2 className="sr-only">My specialties</h2>
    </div>
  );
}
