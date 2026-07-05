"use client";
import React, { useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./access-sequence.module.css";

type Phase = "idle" | "watch" | "input" | "over";

// Four access nodes, each with its own colour and tone (E4, C4, A3, E3).
const PADS = [0, 1, 2, 3] as const;
const TONES = [329.63, 261.63, 220.0, 164.81];

const randomPad = () => Math.floor(Math.random() * 4);

export default function AccessSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [record, setRecord] = useState(false);

  const seqRef = useRef<number[]>([]);
  const inputIdx = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const bestRef = useRef(0); // synchronous mirror of best for the fail check

  useEffect(() => {
    const stored = Number(localStorage.getItem("accessSequenceBest") || 0);
    if (stored > 0) {
      setBest(stored);
      bestRef.current = stored;
    }
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
    return () => {
      timers.current.forEach(clearTimeout);
      audioRef.current?.close().catch(() => {});
    };
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const beep = (pad: number) => {
    try {
      if (!audioRef.current) {
        const Ctx = window.AudioContext;
        if (!Ctx) return;
        audioRef.current = new Ctx();
      }
      const ac = audioRef.current;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = TONES[pad];
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.3);
    } catch {}
  };

  const flash = (pad: number) => {
    setActive(pad);
    beep(pad);
    timers.current.push(setTimeout(() => setActive(null), 230));
  };

  const playback = (seq: number[]) => {
    clearTimers();
    // Playback quickens as the code grows, but never gets unfair.
    const step = Math.max(320, 620 - seq.length * 20);
    let t = 450;
    seq.forEach((pad) => {
      timers.current.push(setTimeout(() => flash(pad), t));
      t += step;
    });
    timers.current.push(
      setTimeout(() => {
        inputIdx.current = 0;
        setPhase("input");
      }, t)
    );
  };

  const nextRound = () => {
    const next = [...seqRef.current, randomPad()];
    seqRef.current = next;
    setPhase("watch");
    playback(next);
  };

  const startGame = () => {
    clearTimers();
    seqRef.current = [];
    inputIdx.current = 0;
    setScore(0);
    setRecord(false);
    setActive(null);
    nextRound();
  };

  const handlePad = (pad: number) => {
    if (phase !== "input") return;
    flash(pad);
    const seq = seqRef.current;
    if (pad === seq[inputIdx.current]) {
      inputIdx.current += 1;
      if (inputIdx.current === seq.length) {
        setScore(seq.length);
        setPhase("watch");
        timers.current.push(setTimeout(nextRound, 720));
      }
    } else {
      // Wrong node — trace failed.
      const reached = seq.length - 1; // rounds completed before this miss
      const beat = reached > bestRef.current;
      if (beat) {
        bestRef.current = reached;
        setBest(reached);
        try {
          localStorage.setItem("accessSequenceBest", String(reached));
        } catch {}
      }
      setRecord(beat);
      setPhase("over");
    }
  };

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Access Sequence</h1>
        <div className={styles.score}>
          Code Length: {score}
          <span className={styles.scoreDivider}>·</span>
          Best: {best}
        </div>

        <div className={styles.stage}>
          <div className={styles.pads} data-locked={phase !== "input"}>
            {PADS.map((pad) => (
              <button
                key={pad}
                type="button"
                aria-label={`Node ${pad + 1}`}
                className={`${styles.pad} ${styles["pad" + pad]} ${
                  active === pad ? styles.padActive : ""
                }`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePad(pad);
                }}
              />
            ))}
          </div>

          <div className={styles.statusReadout}>
            {phase === "watch" && "WATCHING…"}
            {phase === "input" && "YOUR MOVE"}
          </div>

          {phase === "idle" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                startGame();
              }}
            >
              <p className={styles.overlayTitle}>ACCESS SEQUENCE</p>
              <p className={styles.overlayText}>
                Watch the access code light up, then repeat it. Each round adds
                one more node. One wrong node and the trace fails.
              </p>
              <span className={styles.cta}>Jack In</span>
            </div>
          )}

          {phase === "over" && (
            <div
              className={styles.overlay}
              onPointerDown={(e) => {
                e.preventDefault();
                startGame();
              }}
            >
              <p className={styles.overlayTitle}>ACCESS DENIED</p>
              <p className={styles.overlayText}>
                You held the code to length {score}.{" "}
                {record ? "New record!" : ""}
              </p>
              <span className={styles.cta}>Reconnect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
